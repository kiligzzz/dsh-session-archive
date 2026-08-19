/**
 * @kiligzzz/dsh-session-archive — browser half.
 *
 * Adds an "Archived sessions" entry in the sidebar footer. Clicking it opens a
 * fixed-size panel that lists every registry-archived session (title + owning
 * directory), grouped by workspace directory, searchable by title, with
 * collapsible directory groups and one-click restore per row. Restoring calls
 * the same-origin host route; the workspace baseline then refreshes so the
 * session reappears in its grouping.
 */

import { useMemo, useState, type ReactNode } from 'react'
import {
  Button,
  IconTrashOutline16,
  Input,
  Modal,
  StateDot,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type {} from '@deepseek-ai/dsh-client-runtime/client'
import type { PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'

const NS = 'session-archive'
const ROUTE = '/_dsh/session-archive'

const en = {
  nav: 'Archived sessions',
  open: 'Archived sessions',
  empty: 'No archived sessions.',
  searchPlaceholder: 'Search by title…',
  searchEmpty: 'No sessions match.',
  restore: 'Restore',
  restoring: 'Restoring…',
  restored: 'Restored',
  delete: 'Delete',
  deleting: 'Deleting…',
  deleteTitle: 'Delete session',
  deleteWarning: 'This permanently deletes the session and its log from disk. This cannot be undone.',
  deleteConfirm: 'Delete',
  deleteFailed: 'Delete failed',
  deleteLiveError: 'This session is still open. Close it in the sidebar first, then delete it again.',
  failed: 'Action failed',
  untitled: 'Untitled session',
  ungrouped: 'Ungrouped',
  now: 'now',
  close: 'Close',
  title: 'Archived sessions',
  intro: 'These sessions are hidden from every list. Restore one to bring it back into its directory, or delete it permanently.',
  preview: 'Preview',
  previewTitle: 'Session preview',
  previewNote: 'Showing user questions only.',
  previewLoading: 'Loading…',
  previewEmpty: 'No questions to show.',
  previewFailed: 'Preview failed',
} as const

/** Relative-time bucket label ("now" / "5min" / "3h" / "2d"), matching the
 *  sidebar session rows' compact recency style. */
function relativeTimeLabel(updatedAt: number, now: number, locale: string): string {
  const diff = Math.max(0, now - updatedAt)
  const min = Math.floor(diff / 60_000)
  if (min < 1) return locale === 'zh' ? '刚刚' : 'now'
  if (min < 60) return locale === 'zh' ? `${min}分钟前` : `${min}min`
  const hours = Math.floor(min / 60)
  if (hours < 24) return locale === 'zh' ? `${hours}小时前` : `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 30) return locale === 'zh' ? `${days}天前` : `${days}d`
  const months = Math.floor(days / 30)
  if (months < 12) return locale === 'zh' ? `${months}个月前` : `${months}mo`
  const years = Math.floor(months / 12)
  return locale === 'zh' ? `${years}年前` : `${years}y`
}

/** Absolute local timestamp for the hover title ("2026-08-14 18:07"). */
function absoluteTimeLabel(updatedAt: number): string {
  const d = new Date(updatedAt)
  const pad = (n: number): string => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

type LocaleKey = keyof typeof en

const zh: Record<LocaleKey, string> = {
  nav: '已归档会话',
  open: '已归档会话',
  empty: '还没有已归档的会话。',
  searchPlaceholder: '按标题搜索…',
  searchEmpty: '没有匹配的会话。',
  restore: '恢复',
  restoring: '恢复中…',
  restored: '已恢复',
  delete: '删除',
  deleting: '删除中…',
  deleteTitle: '删除会话',
  deleteWarning: '这将从磁盘上永久删除该会话及其日志，且无法撤销。',
  deleteConfirm: '删除',
  deleteFailed: '删除失败',
  deleteLiveError: '该会话仍在运行中。请先在侧边栏关闭它，再删除。',
  failed: '操作失败',
  untitled: '未命名会话',
  ungrouped: '未分组',
  now: '刚刚',
  close: '关闭',
  title: '已归档会话',
  intro: '这些会话已从所有列表中隐藏。恢复一个即可把它放回原目录，或永久删除它。',
  preview: '预览',
  previewTitle: '会话预览',
  previewNote: '仅展示用户问题。',
  previewLoading: '加载中…',
  previewEmpty: '没有可显示的问题。',
  previewFailed: '预览失败',
}

type Translate = (key: LocaleKey) => string

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface SlotMap {
    /** Footer entry that opens the archived-session panel. */
    'sidebar.footer.action': { kind: 'list'; scope: 'root' }
  }

  interface LocaleNamespaceMap {
    'session-archive': LocaleKey
  }
}

type FooterProps = PropsRuntime<'sidebar.footer.action'> & {
  useSessions: (selector: (state: { byId: Record<string, SessionSummary> }) => unknown) => unknown
  useWorkspaces: (selector: (state: WorkspaceListState) => unknown) => unknown
  /**
   * Sidebar expansion flag injected by the sidebar shell's renderSlot call
   * (`renderSlot("sidebar.footer.action", { wide })`). false when the sidebar
   * is collapsed to its narrow icon rail.
   */
  wide?: boolean | undefined
  t?: Translate | undefined
}

interface SessionSummary {
  id: string
  title?: string | undefined
  cwd?: string | undefined
  updatedAt?: number | undefined
}

interface WorkspaceSummary {
  workspaceId: string
  title: string
  path: string
  sessionIds: string[]
}

interface WorkspaceListState {
  items: WorkspaceSummary[]
  archivedSessionIds: string[]
}

/** One directory group: sessions archived under a single workspace (or none). */
interface SessionGroup {
  key: string
  label: string
  path?: string | undefined
  sessions: Array<{ summary: SessionSummary; title: string; updatedAt?: number | undefined }>
}

interface ApiSuccess {
  ok: true
  value: {
    restored?: boolean
    deleted?: { archived: boolean; detached: boolean; removed: boolean }
    archivedSessionIds: string[]
  }
}
interface ApiFailure {
  ok: false
  error: { code: string; message: string }
}
type ApiResponse = ApiSuccess | ApiFailure

/** One previewed user question returned by the host. */
interface PreviewQuestion {
  seq: number
  text: string[]
}

/** Host preview payload: metadata plus the user-question list. */
interface PreviewData {
  title?: string | undefined
  cwd?: string | undefined
  questions: PreviewQuestion[]
}

/** Same-origin action call (restore or delete) to the host route. */
async function postAction(action: 'restore' | 'delete', sessionId: string): Promise<ApiResponse> {
  let response: Response
  try {
    response = await fetch(ROUTE, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, sessionId }),
    })
  } catch {
    return { ok: false, error: { code: 'network', message: 'Network request failed' } }
  }
  let body: unknown
  try {
    body = await response.json() as unknown
  } catch {
    return { ok: false, error: { code: 'unparseable', message: 'Non-JSON response' } }
  }
  if (response.ok && body?.ok === true) return body as ApiSuccess
  const failure = body as Partial<ApiFailure>
  return {
    ok: false,
    error: {
      code: failure.error?.code ?? 'http',
      message: failure.error?.message ?? `HTTP ${response.status}`,
    },
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Fetch a preview of a session's log. */
async function postPreview(sessionId: string): Promise<{ ok: true; preview: PreviewData } | { ok: false; error: string }> {  let response: Response
  try {
    response = await fetch(ROUTE, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'preview', sessionId }),
    })
  } catch {
    return { ok: false, error: 'Network request failed' }
  }
  let body: unknown
  try {
    body = await response.json() as unknown
  } catch {
    return { ok: false, error: 'Non-JSON response' }
  }
  if (response.ok && isRecord(body) && body.ok === true && isRecord(body.value)) {
    return { ok: true, preview: body.value.preview as PreviewData }
  }
  const failure = body as Partial<ApiFailure>
  return { ok: false, error: failure.error?.message ?? `HTTP ${response.status}` }
}

function folderOf(id: string, workspaces: WorkspaceSummary[]): WorkspaceSummary | undefined {
  for (const workspace of workspaces) {
    if (workspace.sessionIds.includes(id)) return workspace
  }
  return undefined
}

/** Group archived sessions by owning workspace directory (Ungrouped last). */
function buildGroups(
  archivedIds: string[],
  byId: Record<string, SessionSummary>,
  workspaces: WorkspaceSummary[],
  t: Translate,
): SessionGroup[] {
  const groups = new Map<string, SessionGroup>()
  const ungrouped: SessionGroup = { key: 'ungrouped', label: t('ungrouped'), sessions: [] }

  for (const id of archivedIds) {
    const summary = byId[id]
    if (summary === undefined) continue
    const title = summary.title !== undefined && summary.title.length > 0 ? summary.title : t('untitled')
    const workspace = folderOf(id, workspaces)
    const group = workspace === undefined
      ? ungrouped
      : (groups.get(workspace.workspaceId) ?? {
          key: workspace.workspaceId,
          label: workspace.title,
          path: workspace.path,
          sessions: [],
        })
    if (workspace !== undefined) groups.set(workspace.workspaceId, group)
    group.sessions.push({ summary, title, updatedAt: summary.updatedAt })
  }

  const ordered: SessionGroup[] = []
  for (const workspace of workspaces) {
    const group = groups.get(workspace.workspaceId)
    if (group !== undefined && group.sessions.length > 0) ordered.push(group)
  }
  if (ungrouped.sessions.length > 0) ordered.push(ungrouped)
  for (const group of ordered) {
    // Newest activity first; sessions without a timestamp sink to the end.
    group.sessions.sort((a, b) => (b.updatedAt ?? -Infinity) - (a.updatedAt ?? -Infinity))
  }
  return ordered
}

function matchesTitle(value: string, query: string): boolean {
  return value.toLowerCase().includes(query)
}

function ArchivedRow({ title, updatedAt, busy, restored, onPreview, onRestore, onDeleteRequest, t }: {
  title: string
  updatedAt?: number | undefined
  busy: boolean
  restored: boolean
  onPreview: () => void
  onRestore: () => void
  onDeleteRequest: () => void
  t: Translate
}) {
  const now = Date.now()
  const locale = t('now') === '刚刚' ? 'zh' : 'en'
  return (
    <li className="dsa-row" data-restored={restored || undefined}>
      <StateDot state={restored ? 'ready' : 'archived'} />
      <button
        type="button"
        className="dsa-row-main"
        title={t('preview')}
        disabled={restored}
        onClick={onPreview}
      >
        <strong>{title}</strong>
      </button>
      {updatedAt !== undefined
        ? (
          <time
            className="dsa-row-time"
            dateTime={new Date(updatedAt).toISOString()}
            title={absoluteTimeLabel(updatedAt)}
          >
            {relativeTimeLabel(updatedAt, now, locale)}
          </time>
        )
        : null}
      <Button size="sm" variant="outline" disabled={busy || restored} onClick={onRestore}>
        {restored ? t('restored') : busy ? t('restoring') : t('restore')}
      </Button>
      <button
        type="button"
        className="dsa-delete-btn"
        aria-label={t('delete')}
        title={t('delete')}
        disabled={busy || restored}
        onClick={onDeleteRequest}
      >
        <IconTrashOutline16 />
      </button>
    </li>
  )
}

/** Modal previewing a session's user questions. */
function PreviewModal({ session, loading, error, preview, onClose, t }: {
  session: { id: string; title: string }
  loading: boolean
  error: string | undefined
  preview: PreviewData | undefined
  onClose: () => void
  t: Translate
}) {
  return (
    <Modal
      open
      className="dsa-preview-modal"
      contentClassName="dsa-preview-content"
      onClose={onClose}
      title={t('previewTitle')}
      closeLabel={t('close')}
    >
      <div className="dsa-preview">
        <header className="dsa-preview-head">
          <strong>{preview?.title ?? session.title}</strong>
          {preview?.cwd !== undefined && preview.cwd.length > 0 ? <code>{preview.cwd}</code> : null}
          {preview !== undefined ? <span className="dsa-preview-count">{preview.questions.length}</span> : null}
        </header>
        <p className="dsa-preview-note">{t('previewNote')}</p>
        {loading
          ? <p className="dsa-preview-empty">{t('previewLoading')}</p>
          : error !== undefined
            ? <p className="dsa-error">{t('previewFailed')}: {error}</p>
            : preview === undefined || preview.questions.length === 0
              ? <p className="dsa-preview-empty">{t('previewEmpty')}</p>
              : (
                <ol className="dsa-questions">
                  {preview.questions.map((question, index) => (
                    <li key={question.seq} className="dsa-question">
                      <span className="dsa-question-index">{index + 1}</span>
                      <p className="dsa-question-text">
                        {question.text.map((line, i) => <span key={i}>{line}</span>)}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
      </div>
    </Modal>
  )
}

function PanelBody({ useWorkspaces, useSessions, refresh, t }: {
  useWorkspaces: FooterProps['useWorkspaces']
  useSessions: FooterProps['useSessions']
  /** Re-pull the workspace + session baselines so the list drops deleted ids. */
  refresh: () => Promise<void>
  t: Translate
}) {
  const archivedIds = useWorkspaces((state) => state.archivedSessionIds) as string[]
  const byId = useSessions((state) => state.byId) as Record<string, SessionSummary>
  const workspaces = useWorkspaces((state) => state.items) as WorkspaceSummary[]
  const [query, setQuery] = useState('')
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set())
  const [busy, setBusy] = useState<string | null>(null)
  const [restoredIds, setRestoredIds] = useState<string[]>([])
  const [deletedIds, setDeletedIds] = useState<string[]>([])
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null)
  const [error, setError] = useState<string | undefined>(undefined)
  const [previewing, setPreviewing] = useState<{ id: string; title: string } | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewData, setPreviewData] = useState<PreviewData | undefined>(undefined)
  const [previewError, setPreviewError] = useState<string | undefined>(undefined)

  const groups = useMemo(
    () => buildGroups(archivedIds ?? [], byId, workspaces, t),
    [archivedIds, byId, workspaces, t],
  )

  if (groups.length === 0) {
    return <p className="dsa-empty">{t('empty')}</p>
  }

  const restore = (id: string): void => {
    setBusy(id)
    setError(undefined)
    void postAction('restore', id).then((result) => {
      setBusy(null)
      if (!result.ok) {
        setError(result.error.message)
        return
      }
      setRestoredIds((ids) => (ids.includes(id) ? ids : [...ids, id]))
    })
  }

  const openPreview = (id: string, title: string): void => {
    setPreviewing({ id, title })
    setPreviewLoading(true)
    setPreviewData(undefined)
    setPreviewError(undefined)
    void postPreview(id).then((result) => {
      setPreviewLoading(false)
      if (!result.ok) {
        setPreviewError(result.error)
        return
      }
      setPreviewData(result.preview)
    })
  }

  const deleteSession = (id: string): void => {
    setConfirmingDelete(null)
    setBusy(id)
    setError(undefined)
    void postAction('delete', id).then((result) => {
      setBusy(null)
      if (!result.ok) {
        // Friendly, localized message for the known "still open" case; any
        // other failure falls back to the generic delete-failed text.
        const message = result.error.code === 'delete-live'
          ? t('deleteLiveError')
          : t('deleteFailed')
        setError(message)
        return
      }
      setDeletedIds((ids) => (ids.includes(id) ? ids : [...ids, id]))
      // Refresh the workspace + session baselines instead of reloading the
      // whole page: archivedSessionIds drops the deleted id and byId drops
      // the stale entry, so the panel re-renders with the row gone.
      void refresh()
    })
  }

  const toggleGroup = (key: string): void => {
    setCollapsed((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const q = query.trim().toLowerCase()
  const visible = q.length === 0
    ? groups
    : groups
        .map((group) => ({
          ...group,
          sessions: group.sessions.filter(({ title }) => matchesTitle(title, q)),
        }))
        .filter((group) => group.sessions.length > 0)

  const confirmTarget = confirmingDelete === null
    ? undefined
    : visible.flatMap((group) => group.sessions).find(({ summary }) => summary.id === confirmingDelete)

  return (
    <div className="dsa-body">
      {error === undefined ? null : <div className="dsa-error">{t('failed')}: {error}</div>}
      <Input
        className="dsa-search"
        value={query}
        onChange={(event) => { setQuery(event.target.value) }}
        placeholder={t('searchPlaceholder')}
      />
      {visible.length === 0
        ? <p className="dsa-empty">{t('searchEmpty')}</p>
        : (
          <div className="dsa-groups">
            {visible.map((group) => {
              const isCollapsed = collapsed.has(group.key)
              const groupSessions = group.sessions.filter(({ summary }) => !deletedIds.includes(summary.id))
              if (groupSessions.length === 0) return null
              return (
                <section key={group.key} className="dsa-group">
                  <button
                    type="button"
                    className="dsa-group-head"
                    aria-expanded={!isCollapsed}
                    onClick={() => { toggleGroup(group.key) }}
                  >
                    <span className="dsa-chevron" data-open={!isCollapsed || undefined} aria-hidden="true">▸</span>
                    <strong>{group.label}</strong>
                    {group.path !== undefined ? <code>{group.path}</code> : null}
                    <span className="dsa-group-count">{groupSessions.length}</span>
                  </button>
                  {!isCollapsed
                    ? (
                      <ul className="dsa-list">
                        {groupSessions.map(({ summary, title, updatedAt }) => (
                          <ArchivedRow
                            key={summary.id}
                            title={title}
                            updatedAt={updatedAt}
                            busy={busy === summary.id}
                            restored={restoredIds.includes(summary.id)}
                            onPreview={() => { openPreview(summary.id, title) }}
                            onRestore={() => { restore(summary.id) }}
                            onDeleteRequest={() => { setConfirmingDelete(summary.id) }}
                            t={t}
                          />
                        ))}
                      </ul>
                    )
                    : null}
                </section>
              )
            })}
          </div>
        )}
      {confirmTarget === undefined || confirmingDelete === null
        ? null
        : (
          <Modal
            open
            className="dsa-delete-modal"
            onClose={() => { setConfirmingDelete(null) }}
            title={t('deleteTitle')}
            closeLabel={t('close')}
            footer={
              <>
                <Button variant="outline" onClick={() => { setConfirmingDelete(null) }}>
                  {t('close')}
                </Button>
                <Button
                  variant="primary"
                  className="dsa-delete-confirm"
                  disabled={busy === confirmingDelete}
                  onClick={() => { deleteSession(confirmingDelete) }}
                >
                  {busy === confirmingDelete ? t('deleting') : t('deleteConfirm')}
                </Button>
              </>
            }
          >
            <div className="dsa-delete-warning">
              <p><strong>{confirmTarget.title}</strong></p>
              <p>{t('deleteWarning')}</p>
            </div>
          </Modal>
        )}
      {previewing === null
        ? null
        : (
          <PreviewModal
            session={previewing}
            loading={previewLoading}
            error={previewError}
            preview={previewData}
            onClose={() => { setPreviewing(null) }}
            t={t}
          />
        )}
    </div>
  )
}

/** Archive-box glyph for the sidebar footer entry. */
function ArchiveIcon(): ReactNode {
  return (
    <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 3h11v3h-11V3Z" />
      <path d="M3 6h10v7H3V6Z" />
      <path d="M6.5 9h3" />
    </svg>
  )
}

/** Footer entry that opens the archived-session panel. */
function FooterEntry({ useWorkspaces, useSessions, refresh, t, wide, ...rest }: FooterProps & {
  /** Re-pull the workspace + session baselines after a delete. */
  refresh: () => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  // The sidebar shell always passes `wide` (renderSlot("sidebar.footer.action",
  // { wide })): true expanded, false collapsed to the icon rail. It is the only
  // reliable signal — width measurement is NOT usable here: once the label is
  // hidden the wrap shrinks to the icon, which re-triggers a "narrow" reading
  // and locks the label hidden forever after re-expanding.
  const narrow = wide === false
  const translate = t ?? ((key: LocaleKey) => en[key])
  return (
    <>
      <div className={narrow ? 'dsa-footer-wrap dsa-narrow' : 'dsa-footer-wrap'}>
        <Button
          variant="ghost"
          className="dsa-footer-entry"
          onClick={() => { setOpen(true) }}
        >
          <span className="dsa-footer-icon"><ArchiveIcon /></span>
          <span className="dsa-footer-label">{translate('open')}</span>
        </Button>
      </div>
      {open
        ? (
          <Modal
            open
            className="dsa-modal"
            contentClassName="dsa-modal-content"
            onClose={() => { setOpen(false) }}
            title={translate('title')}
            closeLabel={translate('close')}
            description={translate('intro')}
          >
            <PanelBody useWorkspaces={useWorkspaces} useSessions={useSessions} refresh={refresh} t={translate} />
          </Modal>
        )
        : null}
    </>
  )
}

const CSS = `
/* 真正的布局容器是 sidebar 宿主的 footerActions div（display:flex，默认 row）。
   slot wrapper [data-slot] 本身是 display:contents（不生成盒子），直接写在它身上的
   flex 属性是空操作，必须用 :has() 选中其父容器。
   垂直堆叠后，cordis-panel / 插件市场 / 已归档会话 三个 width:100% 的整行按钮各占
   一行，任何一方（包括临时挂载的 Cordis 面板）都不会再把其他条目挤出视口；
   窄 rail 模式下条目各自是 36px 圆形图标，竖排同样不溢出。 */
div:has(> [data-slot="sidebar.footer.action"]){flex-direction:column}
.dsa-footer-wrap{display:flex;width:100%;min-width:0;flex:none}
.dsa-footer-icon{display:inline-flex;align-items:center;justify-content:center;flex:none;line-height:0}
.dsa-footer-entry{display:flex;flex-direction:row;justify-content:flex-start !important;align-items:center;gap:8px;flex:1 1 auto;min-width:0;white-space:nowrap;overflow:hidden;padding-inline:var(--dsb-btn-pad-x,8px)}
.dsa-footer-label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:0 1 auto;min-width:0}
.dsa-footer-wrap.dsa-narrow{width:auto !important;flex:none !important;justify-content:center}
.dsa-footer-wrap.dsa-narrow .dsa-footer-entry{width:36px !important;height:36px !important;flex:none;justify-content:center !important;align-items:center !important;gap:0 !important;padding:0 !important;border-radius:50%}
.dsa-footer-wrap.dsa-narrow .dsa-footer-entry:hover{background:var(--dsw-alias-interactive-bg-hover)}
.dsa-footer-wrap.dsa-narrow .dsa-footer-label{display:none}
.dsa-modal{width:min(760px,94vw)!important;height:min(640px,88vh)!important;display:flex!important;flex-direction:column}
.dsa-modal-content{display:flex!important;flex-direction:column;flex:1;min-height:0}
.dsa-modal-content>div:last-child{flex:1;min-height:0;overflow:auto}
.dsa-body{display:grid;gap:10px;min-width:0;padding:2px 2px 12px}
.dsa-search{width:100%}
.dsa-empty{margin:0;color:var(--dsw-alias-fg-muted,#77736d);font-size:12px;padding:8px 2px}
.dsa-error{padding:8px 10px;border-radius:9px;background:rgba(205,72,72,.1);color:#aa3939;font-size:12px;line-height:1.4}
.dsa-groups{display:grid;gap:14px}
.dsa-group{display:grid;gap:6px}
.dsa-group-head{display:flex;align-items:center;gap:7px;min-width:0;padding:0;border:0;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer;width:100%}
.dsa-group-head:focus-visible{outline:2px solid #7c6ff0;outline-offset:-2px;border-radius:6px}
.dsa-chevron{color:var(--dsw-alias-fg-muted,#77736d);font-size:10px;flex:none;transition:transform .14s ease}
.dsa-chevron[data-open]{transform:rotate(90deg)}
.dsa-group-head strong{font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dsa-group-head code{font-size:10px;color:var(--dsw-alias-fg-muted,#77736d);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
.dsa-group-count{margin-left:auto;flex:none;font-size:10px;padding:2px 7px;border-radius:999px;background:var(--dsw-alias-bg-layer-2,#f7f5f1);color:var(--dsw-alias-fg-muted,#77736d)}
.dsa-list{list-style:none;margin:0;padding:0;display:grid;gap:6px}
.dsa-row{display:flex;align-items:center;gap:10px;padding:9px 10px;border:1px solid var(--dsw-alias-border-subtle,#dedbd5);border-radius:10px;background:var(--dsw-alias-bg-layer-1,#fff)}
.dsa-row[data-restored]{opacity:.55}
.dsa-row-main{min-width:0;flex:1;display:grid;gap:2px}
.dsa-row-main strong{font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsa-delete-btn{flex:none;display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;padding:0;border:0;border-radius:7px;background:transparent;color:var(--dsw-alias-fg-muted,#77736d);cursor:pointer;transition:background .12s ease,color .12s ease}
.dsa-delete-btn:hover:not(:disabled){background:rgba(205,72,72,.1);color:#c34f4f}
.dsa-delete-btn:focus-visible{outline:2px solid #cf5050;outline-offset:-1px}
.dsa-delete-btn:disabled{opacity:.4;cursor:default}
.dsa-delete-modal{width:min(420px,90vw)!important}
.dsa-delete-warning{display:grid;gap:8px;padding:2px 0 4px}
.dsa-delete-warning p{margin:0;font-size:12px;line-height:1.55;color:var(--dsw-alias-fg-muted,#77736d)}
.dsa-delete-warning strong{display:block;margin-bottom:4px;font-size:13px;color:var(--dsw-alias-fg-primary,#26231f);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsa-delete-confirm{background:#cf5050!important;border-color:#cf5050!important}
.dsa-row-main{min-width:0;flex:1;display:grid;gap:2px;padding:0;border:0;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer}
.dsa-row-time{flex:none;font-size:11px;color:var(--dsw-alias-fg-muted,#77736d);white-space:nowrap;font-variant-numeric:tabular-nums;cursor:default}
.dsa-row-main:hover strong{color:#6659c7}
.dsa-row-main:focus-visible{outline:2px solid #7c6ff0;outline-offset:-2px;border-radius:6px}
.dsa-row-main:disabled{cursor:default}
.dsa-preview-modal{width:min(540px,90vw)!important;height:min(480px,75vh)!important;display:flex!important;flex-direction:column}
.dsa-preview-content{display:flex!important;flex-direction:column;flex:1;min-height:0}
.dsa-preview-content>div:last-child{flex:1;min-height:0;overflow:auto}
.dsa-preview{display:grid;gap:8px;min-width:0}
.dsa-preview-head{display:flex;align-items:center;gap:8px;padding:2px 0 6px;border-bottom:1px solid var(--dsw-alias-border-subtle,#e8e5df)}
.dsa-preview-head strong{font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsa-preview-head code{font-size:10px;color:var(--dsw-alias-fg-muted,#77736d);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
.dsa-preview-count{margin-left:auto;flex:none;font-size:10px;padding:2px 8px;border-radius:999px;background:var(--dsw-alias-bg-layer-2,#f7f5f1);color:var(--dsw-alias-fg-muted,#77736d)}
.dsa-preview-note{margin:0;padding:6px 10px;border-radius:8px;background:rgba(92,108,213,.08);color:#5149a6;font-size:11px;line-height:1.5}
.dsa-preview-empty{margin:0;padding:12px 2px;color:var(--dsw-alias-fg-muted,#77736d);font-size:12px}
.dsa-questions{list-style:none;margin:0;padding:0;display:grid;gap:8px}
.dsa-question{display:flex;align-items:flex-start;gap:10px;padding:10px 12px;border:1px solid var(--dsw-alias-border-subtle,#dedbd5);border-radius:10px;background:var(--dsw-alias-bg-layer-1,#fff)}
.dsa-question-index{flex:none;font-size:11px;font-weight:650;color:var(--dsw-alias-fg-muted,#77736d);padding-top:1px;min-width:20px;text-align:right}
.dsa-question-text{margin:0;display:grid;gap:4px;min-width:0}
.dsa-question-text span{font-size:13px;line-height:1.6;white-space:pre-wrap;word-break:break-word;color:var(--dsw-alias-fg-primary,#26231f)}
`

function installStyles(): () => void {
  const id = '@kiligzzz/dsh-session-archive/client'
  const existing = document.querySelector<HTMLStyleElement>(`style[data-plugin-css="${id}"]`)
  if (existing !== null) return () => {}
  const style = document.createElement('style')
  style.dataset.plugin = '@kiligzzz/dsh-session-archive'
  style.dataset.pluginCss = id
  style.textContent = CSS
  document.head.appendChild(style)
  return () => { style.remove() }
}

/** Required client services. */
export const inject = ['slots', 'locale']

/** Register the sidebar footer entry and its panel. */
export function apply(ctx: ClientApi): void {
  ctx.effect(installStyles, '@kiligzzz/dsh-session-archive: styles')
  ctx.effect(() => ctx.locale.register(NS, { en, zh }), '@kiligzzz/dsh-session-archive: locale')
  const t: Translate = ctx.locale.bind(NS)
  // Re-pull the workspace + session baselines. The optional `workspaces` /
  // `sessions` services exist on the client runtime; a delete already mutated
  // the host store, so this refreshes the local snapshots without a reload.
  const refresh = async (): Promise<void> => {
    const workspaces = ctx.get('workspaces') as { refresh?: () => Promise<unknown> } | undefined
    const sessions = ctx.get('sessions') as { refresh?: () => Promise<unknown> } | undefined
    await Promise.allSettled([
      workspaces?.refresh?.(),
      sessions?.refresh?.(),
    ])
  }
  ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register({
    name: 'sidebar.footer.action',
    id: 'session-archive',
    // 排在插件市场（community-market order=10）上方、Cordis 面板（默认 order=0）下方。
    order: 5,
    label: () => t('nav'),
    inject: () => ({ t, refresh }),
  }, FooterEntry))
}

/** Minimal structural shape of the client context this plugin requires. */
interface ClientApi {
  effect(fn: () => unknown, label?: string): void
  get(name: string): unknown
  slots: {
    inject(name: 'sidebar.footer.action', callback: () => unknown): unknown
    register(options: unknown, component: unknown): unknown
  }
  locale: {
    register(namespace: 'session-archive', dicts: { en: unknown; zh: unknown }): unknown
    bind(namespace: 'session-archive'): Translate
  }
}
