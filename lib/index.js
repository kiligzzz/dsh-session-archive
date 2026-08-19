// src/index.ts
import { rm } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
var ROUTE = "/_dsh/session-archive";
var name = "@dsh-external/dsh-session-archive";
var inject = ["workspaceRegistry", "sessions", "sessionPersistence"];
var MAX_BODY = 64 * 1024;
function sessionRoot() {
  const home = process.env.DSH_HOME?.length > 0 ? process.env.DSH_HOME : join(homedir(), ".dsh");
  return join(home, "sessions");
}
function projectKey(cwd) {
  if (cwd.length === 0) throw new Error("cannot encode an empty project path");
  let readable = "";
  let separatorRun = false;
  for (let i = 0; i < cwd.length; i++) {
    const code = cwd.charCodeAt(i);
    const ch = String.fromCharCode(code);
    if (ch === "/" || ch === "\\" || ch === ":") {
      if (!separatorRun) readable += "-";
      separatorRun = true;
    } else if (ch !== "~" && /^[A-Za-z0-9._-]$/.test(ch)) {
      readable += ch;
      separatorRun = false;
    } else {
      readable += `~${code.toString(16).toUpperCase().padStart(4, "0")}`;
      separatorRun = false;
    }
  }
  return `--${(readable.replace(/^-+/, "") || "root").slice(0, 251)}--`;
}
function encodeSegment(raw) {
  if (raw.length === 0) throw new Error("cannot encode an empty path segment");
  if (raw === ".") return "~002E";
  if (raw === "..") return "~002E~002E";
  let out = "";
  for (let i = 0; i < raw.length; i++) {
    const code = raw.charCodeAt(i);
    const ch = String.fromCharCode(code);
    if (ch !== "~" && /^[A-Za-z0-9._-]$/.test(ch)) out += ch;
    else out += `~${code.toString(16).toUpperCase().padStart(4, "0")}`;
  }
  return out;
}
function sessionDirectory(cwd, sessionId) {
  return join(sessionRoot(), projectKey(cwd), encodeSegment(sessionId));
}
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function responseJson(res, status, body) {
  const bytes = Buffer.from(JSON.stringify(body));
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Content-Length", String(bytes.length));
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'");
  res.writeHead(status);
  res.end(bytes);
}
function sameOriginPost(req) {
  const fetchSite = req.headers["sec-fetch-site"];
  if (fetchSite === "cross-site") return false;
  const origin = req.headers.origin;
  if (origin === void 0) return fetchSite === "same-origin" || fetchSite === "same-site" || fetchSite === "none";
  const host = req.headers.host;
  if (host === void 0) return false;
  try {
    const parsed = new URL(origin);
    return (parsed.protocol === "http:" || parsed.protocol === "https:") && parsed.host === host;
  } catch {
    return false;
  }
}
async function readJson(req) {
  const contentType = req.headers["content-type"]?.split(";")[0]?.trim().toLowerCase();
  if (contentType !== "application/json") throw new TypeError("Content-Type must be application/json");
  const chunks = [];
  let bytes = 0;
  for await (const chunk of req) {
    const part = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    bytes += part.length;
    if (bytes > MAX_BODY) throw new RangeError(`request body exceeds ${MAX_BODY} bytes`);
    chunks.push(part);
  }
  if (chunks.length === 0) throw new TypeError("request body is empty");
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
function publicMessage(error) {
  return error instanceof Error ? error.message : String(error);
}
function blockText(block) {
  if (typeof block !== "object" || block === null) return void 0;
  const record = block;
  if (typeof record.text === "string" && record.text.length > 0) return record.text;
  if (typeof record.content === "string" && record.content.length > 0) return record.content;
  return void 0;
}
function contentLines(value, limit = 8) {
  const lines = [];
  const push = (text, cap = 300) => {
    if (typeof text !== "string") return;
    const t = text.trim();
    if (t.length === 0) return;
    lines.push(t.length > cap ? `${t.slice(0, cap)}\u2026` : t);
  };
  if (Array.isArray(value)) {
    for (const block of value) push(blockText(block));
  } else {
    push(value);
  }
  return lines.slice(0, limit);
}
var WorkspaceArchive = class {
  constructor(registry, sessions, persistence) {
    this.registry = registry;
    this.sessions = sessions;
    this.persistence = persistence;
  }
  /** Archived ids in host order. */
  list() {
    return this.registry.requireState().archivedSessionIds;
  }
  /**
   * Read a read-only preview of a session's log: metadata plus every user
   * question rendered as plain text (newest first). Purely observational —
   * never mutates the archived set or workspace accounting, so the user can
   * inspect the questions before deciding to restore or delete.
   * @param sessionId - session to preview.
   * @returns metadata and the user-question list.
   */
  async preview(sessionId) {
    if (typeof sessionId !== "string" || sessionId.length === 0) throw new TypeError("sessionId must be a non-empty string");
    const { meta, events } = await this.persistence.readFrom(sessionId, 0);
    let title = typeof meta.title === "string" && meta.title.length > 0 ? meta.title : void 0;
    for (let i = events.length - 1; i >= 0; i--) {
      if (events[i].type === "session/title") {
        const data = events[i].data ?? {};
        if (typeof data.title === "string" && data.title.length > 0) {
          title = data.title;
          break;
        }
      }
    }
    const questions = [];
    const QUESTION_LIMIT = 100;
    for (let i = events.length - 1; i >= 0 && questions.length < QUESTION_LIMIT; i--) {
      const event = events[i];
      if (event.type !== "user/message") continue;
      const data = event.data ?? {};
      const source = isRecord(data.source) ? data.source : void 0;
      const sourceKind = typeof source?.kind === "string" ? source.kind : "user";
      if (sourceKind !== "user") continue;
      questions.unshift({ seq: event.seq, text: contentLines(data.content) });
    }
    return {
      title,
      cwd: typeof meta.cwd === "string" ? meta.cwd : void 0,
      questions
    };
  }
  /**
   * Remove one session from the durable archived set. Idempotent: an id that
   * is not archived resolves without writing. Serialized through the registry
   * write chain so it cannot interleave with an in-flight archive.
   * @param sessionId - session to restore.
   */
  async restore(sessionId) {
    if (typeof sessionId !== "string" || sessionId.length === 0) throw new TypeError("sessionId must be a non-empty string");
    return this.registry.enqueueOperation(async () => {
      const state = this.registry.requireState();
      const archived = state.archivedSessionIds;
      if (!archived.includes(sessionId)) return false;
      await this.registry.setState({
        ...state,
        archivedSessionIds: archived.filter((id) => id !== sessionId)
      });
      return true;
    });
  }
  /**
   * Permanently delete an archived session: unarchive it, detach its workspace
   * accounting, and remove its on-disk log directory. Refuses live sessions.
   * @param sessionId - session to delete.
   * @returns a summary of what was removed.
   */
  async deleteSession(sessionId) {
    if (typeof sessionId !== "string" || sessionId.length === 0) throw new TypeError("sessionId must be a non-empty string");
    if (this.sessions.get(sessionId) !== void 0) {
      throw new Error(`cannot delete live session '${sessionId}'`);
    }
    let workspace;
    for (const candidate of this.registry.list()) {
      if (candidate.sessionIds.includes(sessionId)) {
        workspace = candidate;
        break;
      }
    }
    let cwd;
    if (workspace !== void 0) cwd = workspace.path;
    else {
      try {
        const inspection = await this.persistence.inspect(sessionId);
        cwd = inspection.meta?.cwd;
      } catch {
        cwd = void 0;
      }
    }
    const outcome = await this.registry.enqueueOperation(async () => {
      const state = this.registry.requireState();
      const archived = state.archivedSessionIds;
      const archivedNow = archived.includes(sessionId);
      if (archivedNow) {
        await this.registry.setState({
          ...state,
          archivedSessionIds: archived.filter((id) => id !== sessionId)
        });
      }
      if (workspace !== void 0) {
        await workspace.detachSession(sessionId);
      }
      return { archived: archivedNow, detached: workspace !== void 0 };
    });
    let removed = false;
    let path;
    if (cwd !== void 0) {
      path = sessionDirectory(cwd, sessionId);
      try {
        await rm(path, { recursive: true, force: true });
        removed = true;
      } catch {
        removed = false;
      }
    }
    return { ...outcome, removed, path };
  }
};
async function handle(archive, req, res) {
  if (req.method === "GET") {
    responseJson(res, 200, { ok: true, value: { archivedSessionIds: archive.list() } });
    return;
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    responseJson(res, 405, { ok: false, error: { code: "method-not-allowed", message: "Use GET or POST" } });
    return;
  }
  if (!sameOriginPost(req)) {
    responseJson(res, 403, { ok: false, error: { code: "origin-rejected", message: "The request must originate from this DSH Web application" } });
    return;
  }
  let parsed;
  try {
    const body = await readJson(req);
    if (!isRecord(body) || body.action !== "restore" && body.action !== "delete" && body.action !== "preview") {
      throw new TypeError('action must be "restore", "delete", or "preview"');
    }
    if (typeof body.sessionId !== "string" || body.sessionId.length === 0) throw new TypeError("sessionId is required");
    parsed = { action: body.action, sessionId: body.sessionId };
  } catch (error) {
    responseJson(res, error instanceof RangeError ? 413 : 400, { ok: false, error: { code: "invalid-request", message: publicMessage(error) } });
    return;
  }
  try {
    if (parsed.action === "restore") {
      const restored = await archive.restore(parsed.sessionId);
      responseJson(res, 200, { ok: true, value: { restored, archivedSessionIds: archive.list() } });
    } else if (parsed.action === "preview") {
      const preview = await archive.preview(parsed.sessionId);
      responseJson(res, 200, { ok: true, value: { preview } });
    } else {
      const deleted = await archive.deleteSession(parsed.sessionId);
      responseJson(res, 200, { ok: true, value: { deleted, archivedSessionIds: archive.list() } });
    }
  } catch (error) {
    const code = parsed.action === "restore" ? "restore-failed" : parsed.action === "preview" ? "preview-failed" : "delete-failed";
    responseJson(res, 400, { ok: false, error: { code, message: publicMessage(error) } });
  }
}
async function apply(ctx) {
  const archive = new WorkspaceArchive(ctx.workspaceRegistry, ctx.sessions, ctx.sessionPersistence);
  ctx.provide("workspaceArchive", archive);
  let disposeRoutes = () => {
  };
  ctx.inject(["webServer"], (webCtx) => {
    const server = webCtx.webServer;
    const detach = server.register({
      kind: "exact",
      path: ROUTE,
      handler: (req, res) => {
        void handle(archive, req, res);
      }
    });
    disposeRoutes = detach;
    webCtx.effect(() => detach, "dsh-session-archive: route");
  });
  return () => {
    disposeRoutes();
  };
}
export {
  ROUTE,
  WorkspaceArchive,
  apply,
  inject,
  name
};
//# sourceMappingURL=index.js.map
