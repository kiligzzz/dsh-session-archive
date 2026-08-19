/**
 * @kiligzzz/dsh-session-archive — surface, restore, and delete the
 * registry-global archived-session set.
 *
 * The harness workspace registry keeps an `archivedSessionIds` list that hides
 * sessions from every grouping surface but ships no way to view, unarchive, or
 * delete them. This plugin adds that missing capability:
 *   - `workspaceArchive.list()` returns the archived ids in host order,
 *   - `workspaceArchive.restore(sessionId)` removes one id from the durable
 *     archived set (idempotent, serialized through the registry write chain),
 *   - `workspaceArchive.deleteSession(sessionId)` additionally detaches the
 *     session from its workspace accounting and removes its on-disk log,
 *   - a same-origin HTTP route `/_dsh/session-archive` lets the Web bundle
 *     read, restore, and delete.
 * @module @kiligzzz/dsh-session-archive
 */

import { rm } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Context } from 'cordis'
import type {} from '@deepseek-ai/dsh-host-webserver'

/** Exact route used by the browser panel. */
export const ROUTE = '/_dsh/session-archive'

/** Stable Cordis plugin name. */
export const name = '@kiligzzz/dsh-session-archive'

/** Services required before restore/delete can be called. */
export const inject = ['workspaceRegistry', 'sessions', 'sessionPersistence']

const MAX_BODY = 64 * 1024

/**
 * Session log root: the `sessions` directory under the harness home. Mirrors
 * `dsh-home-paths.defaultDshHome()` (`~/.dsh`, honouring `DSH_HOME`) so the
 * bundle needs no external package at runtime.
 */
function sessionRoot(): string {
  const home = process.env.DSH_HOME?.length > 0 ? process.env.DSH_HOME : join(homedir(), '.dsh')
  return join(home, 'sessions')
}

/** Mirror the jsonl backend's project-key encoding for a cwd path. */
function projectKey(cwd: string): string {
  if (cwd.length === 0) throw new Error('cannot encode an empty project path')
  let readable = ''
  let separatorRun = false
  for (let i = 0; i < cwd.length; i++) {
    const code = cwd.charCodeAt(i)
    const ch = String.fromCharCode(code)
    if (ch === '/' || ch === '\\' || ch === ':') {
      if (!separatorRun) readable += '-'
      separatorRun = true
    } else if (ch !== '~' && /^[A-Za-z0-9._-]$/.test(ch)) {
      readable += ch
      separatorRun = false
    } else {
      readable += `~${code.toString(16).toUpperCase().padStart(4, '0')}`
      separatorRun = false
    }
  }
  return `--${(readable.replace(/^-+/, '') || 'root').slice(0, 251)}--`
}

/** Mirror the jsonl backend's segment encoding for a session id. */
function encodeSegment(raw: string): string {
  if (raw.length === 0) throw new Error('cannot encode an empty path segment')
  if (raw === '.') return '~002E'
  if (raw === '..') return '~002E~002E'
  let out = ''
  for (let i = 0; i < raw.length; i++) {
    const code = raw.charCodeAt(i)
    const ch = String.fromCharCode(code)
    if (ch !== '~' && /^[A-Za-z0-9._-]$/.test(ch)) out += ch
    else out += `~${code.toString(16).toUpperCase().padStart(4, '0')}`
  }
  return out
}

/** Absolute on-disk session directory for a cwd + id. */
function sessionDirectory(cwd: string, sessionId: string): string {
  return join(sessionRoot(), projectKey(cwd), encodeSegment(sessionId))
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Content-restricted JSON response. */
function responseJson(res: ServerResponse, status: number, body: unknown): void {
  const bytes = Buffer.from(JSON.stringify(body))
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Content-Length', String(bytes.length))
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'")
  res.writeHead(status)
  res.end(bytes)
}

/** Mirror the no-CSRF posture used by the vision-toolkit web backend. */
function sameOriginPost(req: IncomingMessage): boolean {
  const fetchSite = req.headers['sec-fetch-site']
  if (fetchSite === 'cross-site') return false
  const origin = req.headers.origin
  if (origin === undefined) return fetchSite === 'same-origin' || fetchSite === 'same-site' || fetchSite === 'none'
  const host = req.headers.host
  if (host === undefined) return false
  try {
    const parsed = new URL(origin)
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && parsed.host === host
  } catch {
    return false
  }
}

/** Read a small JSON body (Content-Type enforced). */
async function readJson(req: IncomingMessage): Promise<unknown> {
  const contentType = req.headers['content-type']?.split(';')[0]?.trim().toLowerCase()
  if (contentType !== 'application/json') throw new TypeError('Content-Type must be application/json')
  const chunks: Buffer[] = []
  let bytes = 0
  for await (const chunk of req) {
    const part = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    bytes += part.length
    if (bytes > MAX_BODY) throw new RangeError(`request body exceeds ${MAX_BODY} bytes`)
    chunks.push(part)
  }
  if (chunks.length === 0) throw new TypeError('request body is empty')
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown
}

/** Plain plugin message (no harness objects leak into the JSON contract). */
function publicMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/**
 * The harness-facing face this plugin needs from the workspace registry.
 * `enqueueOperation`/`requireState`/`setState` are the registry's public
 * serialized write chain (mirroring `archiveSession`); `list()` yields the
 * live workspace entities used to detach accounting.
 */
interface RegistryFace {
  enqueueOperation(operation: () => Promise<unknown>): Promise<unknown>
  requireState(): { archivedSessionIds: string[] }
  setState(state: unknown): Promise<void>
  list(): WorkspaceEntityFace[]
}

interface WorkspaceEntityFace {
  path: string
  sessionIds: string[]
  detachSession(sessionId: string): Promise<void>
}

/** Minimal face of `ctx.sessionPersistence` for cwd lookup and log reads. */
interface SessionPersistenceFace {
  inspect(id: string, signal?: AbortSignal): Promise<{ meta?: { cwd?: string; title?: string } }>
  readFrom(id: string, fromSeq: number, signal?: AbortSignal): Promise<{
    meta: { id: string; cwd?: string; title?: string }
    events: SessionLogEvent[]
  }>
}

/** Minimal session-log event shape extracted for preview. */
interface SessionLogEvent {
  seq: number
  type: string
  data?: Record<string, unknown>
  time?: number
}

/** Extract a plain-text line from a message-content block. */
function blockText(block: unknown): string | undefined {
  if (typeof block !== 'object' || block === null) return undefined
  const record = block as Record<string, unknown>
  if (typeof record.text === 'string' && record.text.length > 0) return record.text
  if (typeof record.content === 'string' && record.content.length > 0) return record.content
  return undefined
}

/** Flatten either a raw string or a block array into non-empty text lines. */
function contentLines(value: unknown, limit = 8): string[] {
  const lines: string[] = []
  const push = (text: unknown, cap = 300): void => {
    if (typeof text !== 'string') return
    const t = text.trim()
    if (t.length === 0) return
    lines.push(t.length > cap ? `${t.slice(0, cap)}…` : t)
  }
  if (Array.isArray(value)) {
    for (const block of value) push(blockText(block))
  } else {
    push(value)
  }
  return lines.slice(0, limit)
}

/**
 * Host service exposing the archived-session set, durable restore, and durable
 * deletion to other host plugins and to the Web backend.
 */
export class WorkspaceArchive {
  constructor(
    private readonly registry: RegistryFace,
    private readonly sessions: { get(id: string): unknown },
    private readonly persistence: SessionPersistenceFace,
  ) {}

  /** Archived ids in host order. */
  list(): string[] {
    return this.registry.requireState().archivedSessionIds
  }

  /**
   * Read a read-only preview of a session's log: metadata plus every user
   * question rendered as plain text (newest first). Purely observational —
   * never mutates the archived set or workspace accounting, so the user can
   * inspect the questions before deciding to restore or delete.
   * @param sessionId - session to preview.
   * @returns metadata and the user-question list.
   */
  async preview(sessionId: string): Promise<{
    title: string | undefined
    cwd: string | undefined
    questions: Array<{
      seq: number
      text: string[]
    }>
  }> {
    if (typeof sessionId !== 'string' || sessionId.length === 0) throw new TypeError('sessionId must be a non-empty string')
    const { meta, events } = await this.persistence.readFrom(sessionId, 0)
    // Title lives in the last session/title event when present.
    let title: string | undefined = typeof meta.title === 'string' && meta.title.length > 0 ? meta.title : undefined
    for (let i = events.length - 1; i >= 0; i--) {
      if (events[i].type === 'session/title') {
        const data = events[i].data ?? {}
        if (typeof data.title === 'string' && data.title.length > 0) {
          title = data.title
          break
        }
      }
    }
    // Collect every genuine user question (newest first), capping the count so
    // even a very long session stays a bounded payload. System-injected
    // user-role messages (agent presets, skill reminders, plugin/workspace
    // context) carry a non-"user" source.kind and are skipped — mirroring the
    // official conversation renderer's `source.kind !== "user"` classification.
    const questions: Array<{ seq: number; text: string[] }> = []
    const QUESTION_LIMIT = 100
    for (let i = events.length - 1; i >= 0 && questions.length < QUESTION_LIMIT; i--) {
      const event = events[i]
      if (event.type !== 'user/message') continue
      const data = event.data ?? {}
      const source = isRecord(data.source) ? data.source : undefined
      const sourceKind = typeof source?.kind === 'string' ? source.kind : 'user'
      if (sourceKind !== 'user') continue
      questions.unshift({ seq: event.seq, text: contentLines(data.content) })
    }
    return {
      title,
      cwd: typeof meta.cwd === 'string' ? meta.cwd : undefined,
      questions,
    }
  }

  /**
   * Remove one session from the durable archived set. Idempotent: an id that
   * is not archived resolves without writing. Serialized through the registry
   * write chain so it cannot interleave with an in-flight archive.
   * @param sessionId - session to restore.
   */
  async restore(sessionId: string): Promise<boolean> {
    if (typeof sessionId !== 'string' || sessionId.length === 0) throw new TypeError('sessionId must be a non-empty string')
    return this.registry.enqueueOperation(async () => {
      const state = this.registry.requireState()
      const archived = state.archivedSessionIds
      if (!archived.includes(sessionId)) return false
      await this.registry.setState({
        ...state,
        archivedSessionIds: archived.filter((id) => id !== sessionId),
      })
      return true
    }) as Promise<boolean>
  }

  /**
   * Permanently delete an archived session: unarchive it, detach its workspace
   * accounting, and remove its on-disk log directory. Refuses live sessions.
   * @param sessionId - session to delete.
   * @returns a summary of what was removed.
   */
  async deleteSession(sessionId: string): Promise<{
    archived: boolean
    detached: boolean
    removed: boolean
    path?: string | undefined
  }> {
    if (typeof sessionId !== 'string' || sessionId.length === 0) throw new TypeError('sessionId must be a non-empty string')
    if (this.sessions.get(sessionId) !== undefined) {
      // Distinct error code so the client can render a friendly localized
      // message ("the session is still open") instead of this raw English
      // guard message.
      const error = new Error(`cannot delete live session '${sessionId}'`) as Error & { code?: string }
      error.code = 'delete-live'
      throw error
    }

    // Find the owning workspace (if any) for cwd + detach. The entity's
    // `sessionIds` getter filters by canonical cwd; fall back to the raw
    // archived membership so archived sessions still resolve.
    let workspace: WorkspaceEntityFace | undefined
    for (const candidate of this.registry.list()) {
      if (candidate.sessionIds.includes(sessionId)) {
        workspace = candidate
        break
      }
    }

    let cwd: string | undefined
    if (workspace !== undefined) cwd = workspace.path
    else {
      try {
        const inspection = await this.persistence.inspect(sessionId)
        cwd = inspection.meta?.cwd
      } catch {
        cwd = undefined
      }
    }

    const outcome = await this.registry.enqueueOperation(async () => {
      const state = this.registry.requireState()
      const archived = state.archivedSessionIds
      const archivedNow = archived.includes(sessionId)
      if (archivedNow) {
        await this.registry.setState({
          ...state,
          archivedSessionIds: archived.filter((id) => id !== sessionId),
        })
      }
      if (workspace !== undefined) {
        await workspace.detachSession(sessionId)
      }
      return { archived: archivedNow, detached: workspace !== undefined }
    }) as Promise<{ archived: boolean; detached: boolean }>

    let removed = false
    let path: string | undefined
    if (cwd !== undefined) {
      path = sessionDirectory(cwd, sessionId)
      try {
        await rm(path, { recursive: true, force: true })
        removed = true
      } catch {
        removed = false
      }
    }
    return { ...outcome, removed, path }
  }
}

/** Handle the `/_dsh/session-archive` same-origin backend. */
async function handle(archive: WorkspaceArchive, req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method === 'GET') {
    responseJson(res, 200, { ok: true, value: { archivedSessionIds: archive.list() } })
    return
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST')
    responseJson(res, 405, { ok: false, error: { code: 'method-not-allowed', message: 'Use GET or POST' } })
    return
  }
  if (!sameOriginPost(req)) {
    responseJson(res, 403, { ok: false, error: { code: 'origin-rejected', message: 'The request must originate from this DSH Web application' } })
    return
  }
  let parsed: { action: 'restore' | 'delete' | 'preview'; sessionId: string }
  try {
    const body = await readJson(req) as unknown
    if (!isRecord(body) || (body.action !== 'restore' && body.action !== 'delete' && body.action !== 'preview')) {
      throw new TypeError('action must be "restore", "delete", or "preview"')
    }
    if (typeof body.sessionId !== 'string' || body.sessionId.length === 0) throw new TypeError('sessionId is required')
    parsed = { action: body.action, sessionId: body.sessionId }
  } catch (error) {
    responseJson(res, error instanceof RangeError ? 413 : 400, { ok: false, error: { code: 'invalid-request', message: publicMessage(error) } })
    return
  }
  try {
    if (parsed.action === 'restore') {
      const restored = await archive.restore(parsed.sessionId)
      responseJson(res, 200, { ok: true, value: { restored, archivedSessionIds: archive.list() } })
    } else if (parsed.action === 'preview') {
      const preview = await archive.preview(parsed.sessionId)
      responseJson(res, 200, { ok: true, value: { preview } })
    } else {
      const deleted = await archive.deleteSession(parsed.sessionId)
      responseJson(res, 200, { ok: true, value: { deleted, archivedSessionIds: archive.list() } })
    }
  } catch (error) {
    // Prefer the error's own code when present (e.g. `delete-live`), so the
    // client can localize the message instead of surfacing the raw English
    // guard text.
    const errorCode = typeof error === 'object' && error !== null
      ? (error as { code?: unknown }).code
      : undefined
    const code = typeof errorCode === 'string' && errorCode.length > 0
      ? errorCode
      : parsed.action === 'restore' ? 'restore-failed' : parsed.action === 'preview' ? 'preview-failed' : 'delete-failed'
    responseJson(res, 400, { ok: false, error: { code, message: publicMessage(error) } })
  }
}

/** Plugin entry. */
export async function apply(ctx: Context): Promise<() => void> {
  const archive = new WorkspaceArchive(ctx.workspaceRegistry, ctx.sessions, ctx.sessionPersistence)
  // Expose to sibling host plugins.
  ctx.provide('workspaceArchive', archive)
  // Register the same-origin route when a webServer is present.
  let disposeRoutes: () => void = () => {}
  ctx.inject(['webServer'], (webCtx) => {
    const server = webCtx.webServer
    const detach = server.register({
      kind: 'exact',
      path: ROUTE,
      handler: (req, res) => { void handle(archive, req, res) },
    })
    disposeRoutes = detach
    webCtx.effect(() => detach, 'dsh-session-archive: route')
  })
  return () => { disposeRoutes() }
}
