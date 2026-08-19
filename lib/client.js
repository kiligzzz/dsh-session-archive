window.__ModuleLoader__.load({ id: "@dsh-external/dsh-session-archive", factory: (require) => {
var module = { exports: {} }; var exports = module.exports;
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.tsx
var index_exports = {};
__export(index_exports, {
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(index_exports);
var import_react = require("react");
var import_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
var import_jsx_runtime = require("react/jsx-runtime");
var NS = "session-archive";
var ROUTE = "/_dsh/session-archive";
var en = {
  nav: "Archived sessions",
  open: "Archived sessions",
  empty: "No archived sessions.",
  searchPlaceholder: "Search by title\u2026",
  searchEmpty: "No sessions match.",
  restore: "Restore",
  restoring: "Restoring\u2026",
  restored: "Restored",
  delete: "Delete",
  deleting: "Deleting\u2026",
  deleteTitle: "Delete session",
  deleteWarning: "This permanently deletes the session and its log from disk. This cannot be undone.",
  deleteConfirm: "Delete",
  deleteFailed: "Delete failed",
  failed: "Action failed",
  untitled: "Untitled session",
  ungrouped: "Ungrouped",
  now: "now",
  close: "Close",
  title: "Archived sessions",
  intro: "These sessions are hidden from every list. Restore one to bring it back into its directory, or delete it permanently.",
  preview: "Preview",
  previewTitle: "Session preview",
  previewNote: "Showing user questions only.",
  previewLoading: "Loading\u2026",
  previewEmpty: "No questions to show.",
  previewFailed: "Preview failed"
};
function relativeTimeLabel(updatedAt, now, locale) {
  const diff = Math.max(0, now - updatedAt);
  const min = Math.floor(diff / 6e4);
  if (min < 1) return locale === "zh" ? "\u521A\u521A" : "now";
  if (min < 60) return locale === "zh" ? `${min}\u5206\u949F\u524D` : `${min}min`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return locale === "zh" ? `${hours}\u5C0F\u65F6\u524D` : `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return locale === "zh" ? `${days}\u5929\u524D` : `${days}d`;
  const months = Math.floor(days / 30);
  if (months < 12) return locale === "zh" ? `${months}\u4E2A\u6708\u524D` : `${months}mo`;
  const years = Math.floor(months / 12);
  return locale === "zh" ? `${years}\u5E74\u524D` : `${years}y`;
}
function absoluteTimeLabel(updatedAt) {
  const d = new Date(updatedAt);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
var zh = {
  nav: "\u5DF2\u5F52\u6863\u4F1A\u8BDD",
  open: "\u5DF2\u5F52\u6863\u4F1A\u8BDD",
  empty: "\u8FD8\u6CA1\u6709\u5DF2\u5F52\u6863\u7684\u4F1A\u8BDD\u3002",
  searchPlaceholder: "\u6309\u6807\u9898\u641C\u7D22\u2026",
  searchEmpty: "\u6CA1\u6709\u5339\u914D\u7684\u4F1A\u8BDD\u3002",
  restore: "\u6062\u590D",
  restoring: "\u6062\u590D\u4E2D\u2026",
  restored: "\u5DF2\u6062\u590D",
  delete: "\u5220\u9664",
  deleting: "\u5220\u9664\u4E2D\u2026",
  deleteTitle: "\u5220\u9664\u4F1A\u8BDD",
  deleteWarning: "\u8FD9\u5C06\u4ECE\u78C1\u76D8\u4E0A\u6C38\u4E45\u5220\u9664\u8BE5\u4F1A\u8BDD\u53CA\u5176\u65E5\u5FD7\uFF0C\u4E14\u65E0\u6CD5\u64A4\u9500\u3002",
  deleteConfirm: "\u5220\u9664",
  deleteFailed: "\u5220\u9664\u5931\u8D25",
  failed: "\u64CD\u4F5C\u5931\u8D25",
  untitled: "\u672A\u547D\u540D\u4F1A\u8BDD",
  ungrouped: "\u672A\u5206\u7EC4",
  now: "\u521A\u521A",
  close: "\u5173\u95ED",
  title: "\u5DF2\u5F52\u6863\u4F1A\u8BDD",
  intro: "\u8FD9\u4E9B\u4F1A\u8BDD\u5DF2\u4ECE\u6240\u6709\u5217\u8868\u4E2D\u9690\u85CF\u3002\u6062\u590D\u4E00\u4E2A\u5373\u53EF\u628A\u5B83\u653E\u56DE\u539F\u76EE\u5F55\uFF0C\u6216\u6C38\u4E45\u5220\u9664\u5B83\u3002",
  preview: "\u9884\u89C8",
  previewTitle: "\u4F1A\u8BDD\u9884\u89C8",
  previewNote: "\u4EC5\u5C55\u793A\u7528\u6237\u95EE\u9898\u3002",
  previewLoading: "\u52A0\u8F7D\u4E2D\u2026",
  previewEmpty: "\u6CA1\u6709\u53EF\u663E\u793A\u7684\u95EE\u9898\u3002",
  previewFailed: "\u9884\u89C8\u5931\u8D25"
};
async function postAction(action, sessionId) {
  let response;
  try {
    response = await fetch(ROUTE, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, sessionId })
    });
  } catch {
    return { ok: false, error: { code: "network", message: "Network request failed" } };
  }
  let body;
  try {
    body = await response.json();
  } catch {
    return { ok: false, error: { code: "unparseable", message: "Non-JSON response" } };
  }
  if (response.ok && body?.ok === true) return body;
  const failure = body;
  return {
    ok: false,
    error: {
      code: failure.error?.code ?? "http",
      message: failure.error?.message ?? `HTTP ${response.status}`
    }
  };
}
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
async function postPreview(sessionId) {
  let response;
  try {
    response = await fetch(ROUTE, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "preview", sessionId })
    });
  } catch {
    return { ok: false, error: "Network request failed" };
  }
  let body;
  try {
    body = await response.json();
  } catch {
    return { ok: false, error: "Non-JSON response" };
  }
  if (response.ok && isRecord(body) && body.ok === true && isRecord(body.value)) {
    return { ok: true, preview: body.value.preview };
  }
  const failure = body;
  return { ok: false, error: failure.error?.message ?? `HTTP ${response.status}` };
}
function folderOf(id, workspaces) {
  for (const workspace of workspaces) {
    if (workspace.sessionIds.includes(id)) return workspace;
  }
  return void 0;
}
function buildGroups(archivedIds, byId, workspaces, t) {
  const groups = /* @__PURE__ */ new Map();
  const ungrouped = { key: "ungrouped", label: t("ungrouped"), sessions: [] };
  for (const id of archivedIds) {
    const summary = byId[id];
    if (summary === void 0) continue;
    const title = summary.title !== void 0 && summary.title.length > 0 ? summary.title : t("untitled");
    const workspace = folderOf(id, workspaces);
    const group = workspace === void 0 ? ungrouped : groups.get(workspace.workspaceId) ?? {
      key: workspace.workspaceId,
      label: workspace.title,
      path: workspace.path,
      sessions: []
    };
    if (workspace !== void 0) groups.set(workspace.workspaceId, group);
    group.sessions.push({ summary, title, updatedAt: summary.updatedAt });
  }
  const ordered = [];
  for (const workspace of workspaces) {
    const group = groups.get(workspace.workspaceId);
    if (group !== void 0 && group.sessions.length > 0) ordered.push(group);
  }
  if (ungrouped.sessions.length > 0) ordered.push(ungrouped);
  for (const group of ordered) {
    group.sessions.sort((a, b) => (b.updatedAt ?? -Infinity) - (a.updatedAt ?? -Infinity));
  }
  return ordered;
}
function matchesTitle(value, query) {
  return value.toLowerCase().includes(query);
}
function ArchivedRow({ title, updatedAt, busy, restored, onPreview, onRestore, onDeleteRequest, t }) {
  const now = Date.now();
  const locale = t("now") === "\u521A\u521A" ? "zh" : "en";
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { className: "dsa-row", "data-restored": restored || void 0, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.StateDot, { state: restored ? "ready" : "archived" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "button",
      {
        type: "button",
        className: "dsa-row-main",
        title: t("preview"),
        disabled: restored,
        onClick: onPreview,
        children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: title })
      }
    ),
    updatedAt !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "time",
      {
        className: "dsa-row-time",
        dateTime: new Date(updatedAt).toISOString(),
        title: absoluteTimeLabel(updatedAt),
        children: relativeTimeLabel(updatedAt, now, locale)
      }
    ) : null,
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { size: "sm", variant: "outline", disabled: busy || restored, onClick: onRestore, children: restored ? t("restored") : busy ? t("restoring") : t("restore") }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "button",
      {
        type: "button",
        className: "dsa-delete-btn",
        "aria-label": t("delete"),
        title: t("delete"),
        disabled: busy || restored,
        onClick: onDeleteRequest,
        children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.IconTrashOutline16, {})
      }
    )
  ] });
}
function PreviewModal({ session, loading, error, preview, onClose, t }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    import_dsh_client_ui_primitives.Modal,
    {
      open: true,
      className: "dsa-preview-modal",
      contentClassName: "dsa-preview-content",
      onClose,
      title: t("previewTitle"),
      closeLabel: t("close"),
      children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsa-preview", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { className: "dsa-preview-head", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: preview?.title ?? session.title }),
          preview?.cwd !== void 0 && preview.cwd.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: preview.cwd }) : null,
          preview !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsa-preview-count", children: preview.questions.length }) : null
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "dsa-preview-note", children: t("previewNote") }),
        loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "dsa-preview-empty", children: t("previewLoading") }) : error !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { className: "dsa-error", children: [
          t("previewFailed"),
          ": ",
          error
        ] }) : preview === void 0 || preview.questions.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "dsa-preview-empty", children: t("previewEmpty") }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", { className: "dsa-questions", children: preview.questions.map((question, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { className: "dsa-question", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsa-question-index", children: index + 1 }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "dsa-question-text", children: question.text.map((line, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: line }, i)) })
        ] }, question.seq)) })
      ] })
    }
  );
}
function PanelBody({ useWorkspaces, useSessions, t }) {
  const archivedIds = useWorkspaces((state) => state.archivedSessionIds);
  const byId = useSessions((state) => state.byId);
  const workspaces = useWorkspaces((state) => state.items);
  const [query, setQuery] = (0, import_react.useState)("");
  const [collapsed, setCollapsed] = (0, import_react.useState)(/* @__PURE__ */ new Set());
  const [busy, setBusy] = (0, import_react.useState)(null);
  const [restoredIds, setRestoredIds] = (0, import_react.useState)([]);
  const [deletedIds, setDeletedIds] = (0, import_react.useState)([]);
  const [confirmingDelete, setConfirmingDelete] = (0, import_react.useState)(null);
  const [error, setError] = (0, import_react.useState)(void 0);
  const [previewing, setPreviewing] = (0, import_react.useState)(null);
  const [previewLoading, setPreviewLoading] = (0, import_react.useState)(false);
  const [previewData, setPreviewData] = (0, import_react.useState)(void 0);
  const [previewError, setPreviewError] = (0, import_react.useState)(void 0);
  const groups = (0, import_react.useMemo)(
    () => buildGroups(archivedIds ?? [], byId, workspaces, t),
    [archivedIds, byId, workspaces, t]
  );
  if (groups.length === 0) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "dsa-empty", children: t("empty") });
  }
  const restore = (id) => {
    setBusy(id);
    setError(void 0);
    void postAction("restore", id).then((result) => {
      setBusy(null);
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      setRestoredIds((ids) => ids.includes(id) ? ids : [...ids, id]);
    });
  };
  const openPreview = (id, title) => {
    setPreviewing({ id, title });
    setPreviewLoading(true);
    setPreviewData(void 0);
    setPreviewError(void 0);
    void postPreview(id).then((result) => {
      setPreviewLoading(false);
      if (!result.ok) {
        setPreviewError(result.error);
        return;
      }
      setPreviewData(result.preview);
    });
  };
  const deleteSession = (id) => {
    setConfirmingDelete(null);
    setBusy(id);
    setError(void 0);
    void postAction("delete", id).then((result) => {
      setBusy(null);
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      setDeletedIds((ids) => ids.includes(id) ? ids : [...ids, id]);
      window.location.reload();
    });
  };
  const toggleGroup = (key) => {
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };
  const q = query.trim().toLowerCase();
  const visible = q.length === 0 ? groups : groups.map((group) => ({
    ...group,
    sessions: group.sessions.filter(({ title }) => matchesTitle(title, q))
  })).filter((group) => group.sessions.length > 0);
  const confirmTarget = confirmingDelete === null ? void 0 : visible.flatMap((group) => group.sessions).find(({ summary }) => summary.id === confirmingDelete);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsa-body", children: [
    error === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsa-error", children: [
      t("failed"),
      ": ",
      error
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      import_dsh_client_ui_primitives.Input,
      {
        className: "dsa-search",
        value: query,
        onChange: (event) => {
          setQuery(event.target.value);
        },
        placeholder: t("searchPlaceholder")
      }
    ),
    visible.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "dsa-empty", children: t("searchEmpty") }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsa-groups", children: visible.map((group) => {
      const isCollapsed = collapsed.has(group.key);
      const groupSessions = group.sessions.filter(({ summary }) => !deletedIds.includes(summary.id));
      if (groupSessions.length === 0) return null;
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { className: "dsa-group", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
          "button",
          {
            type: "button",
            className: "dsa-group-head",
            "aria-expanded": !isCollapsed,
            onClick: () => {
              toggleGroup(group.key);
            },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsa-chevron", "data-open": !isCollapsed || void 0, "aria-hidden": "true", children: "\u25B8" }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: group.label }),
              group.path !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: group.path }) : null,
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsa-group-count", children: groupSessions.length })
            ]
          }
        ),
        !isCollapsed ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { className: "dsa-list", children: groupSessions.map(({ summary, title, updatedAt }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          ArchivedRow,
          {
            title,
            updatedAt,
            busy: busy === summary.id,
            restored: restoredIds.includes(summary.id),
            onPreview: () => {
              openPreview(summary.id, title);
            },
            onRestore: () => {
              restore(summary.id);
            },
            onDeleteRequest: () => {
              setConfirmingDelete(summary.id);
            },
            t
          },
          summary.id
        )) }) : null
      ] }, group.key);
    }) }),
    confirmTarget === void 0 || confirmingDelete === null ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      import_dsh_client_ui_primitives.Modal,
      {
        open: true,
        className: "dsa-delete-modal",
        onClose: () => {
          setConfirmingDelete(null);
        },
        title: t("deleteTitle"),
        closeLabel: t("close"),
        footer: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.Button, { variant: "outline", onClick: () => {
            setConfirmingDelete(null);
          }, children: t("close") }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            import_dsh_client_ui_primitives.Button,
            {
              variant: "primary",
              className: "dsa-delete-confirm",
              disabled: busy === confirmingDelete,
              onClick: () => {
                deleteSession(confirmingDelete);
              },
              children: busy === confirmingDelete ? t("deleting") : t("deleteConfirm")
            }
          )
        ] }),
        children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsa-delete-warning", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: confirmTarget.title }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: t("deleteWarning") })
        ] })
      }
    ),
    previewing === null ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      PreviewModal,
      {
        session: previewing,
        loading: previewLoading,
        error: previewError,
        preview: previewData,
        onClose: () => {
          setPreviewing(null);
        },
        t
      }
    )
  ] });
}
function ArchiveIcon() {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", { viewBox: "0 0 16 16", width: "15", height: "15", "aria-hidden": "true", fill: "none", stroke: "currentColor", strokeWidth: "1.35", strokeLinecap: "round", strokeLinejoin: "round", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M2.5 3h11v3h-11V3Z" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M3 6h10v7H3V6Z" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M6.5 9h3" })
  ] });
}
function FooterEntry({ useWorkspaces, useSessions, t, wide, ...rest }) {
  const [open, setOpen] = (0, import_react.useState)(false);
  const narrow = wide === false;
  const translate = t ?? ((key) => en[key]);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: narrow ? "dsa-footer-wrap dsa-narrow" : "dsa-footer-wrap", children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      import_dsh_client_ui_primitives.Button,
      {
        variant: "ghost",
        className: "dsa-footer-entry",
        onClick: () => {
          setOpen(true);
        },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsa-footer-icon", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArchiveIcon, {}) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsa-footer-label", children: translate("open") })
        ]
      }
    ) }),
    open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      import_dsh_client_ui_primitives.Modal,
      {
        open: true,
        className: "dsa-modal",
        contentClassName: "dsa-modal-content",
        onClose: () => {
          setOpen(false);
        },
        title: translate("title"),
        closeLabel: translate("close"),
        description: translate("intro"),
        children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PanelBody, { useWorkspaces, useSessions, t: translate })
      }
    ) : null
  ] });
}
var CSS = `
/* \u771F\u6B63\u7684\u5E03\u5C40\u5BB9\u5668\u662F sidebar \u5BBF\u4E3B\u7684 footerActions div\uFF08display:flex\uFF0C\u9ED8\u8BA4 row\uFF09\u3002
   slot wrapper [data-slot] \u672C\u8EAB\u662F display:contents\uFF08\u4E0D\u751F\u6210\u76D2\u5B50\uFF09\uFF0C\u76F4\u63A5\u5199\u5728\u5B83\u8EAB\u4E0A\u7684
   flex \u5C5E\u6027\u662F\u7A7A\u64CD\u4F5C\uFF0C\u5FC5\u987B\u7528 :has() \u9009\u4E2D\u5176\u7236\u5BB9\u5668\u3002
   \u5782\u76F4\u5806\u53E0\u540E\uFF0Ccordis-panel / \u63D2\u4EF6\u5E02\u573A / \u5DF2\u5F52\u6863\u4F1A\u8BDD \u4E09\u4E2A width:100% \u7684\u6574\u884C\u6309\u94AE\u5404\u5360
   \u4E00\u884C\uFF0C\u4EFB\u4F55\u4E00\u65B9\uFF08\u5305\u62EC\u4E34\u65F6\u6302\u8F7D\u7684 Cordis \u9762\u677F\uFF09\u90FD\u4E0D\u4F1A\u518D\u628A\u5176\u4ED6\u6761\u76EE\u6324\u51FA\u89C6\u53E3\uFF1B
   \u7A84 rail \u6A21\u5F0F\u4E0B\u6761\u76EE\u5404\u81EA\u662F 36px \u5706\u5F62\u56FE\u6807\uFF0C\u7AD6\u6392\u540C\u6837\u4E0D\u6EA2\u51FA\u3002 */
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
`;
function installStyles() {
  const id = "@dsh-external/dsh-session-archive/client";
  const existing = document.querySelector(`style[data-plugin-css="${id}"]`);
  if (existing !== null) return () => {
  };
  const style = document.createElement("style");
  style.dataset.plugin = "@dsh-external/dsh-session-archive";
  style.dataset.pluginCss = id;
  style.textContent = CSS;
  document.head.appendChild(style);
  return () => {
    style.remove();
  };
}
var inject = ["slots", "locale"];
function apply(ctx) {
  ctx.effect(installStyles, "@dsh-external/dsh-session-archive: styles");
  ctx.effect(() => ctx.locale.register(NS, { en, zh }), "@dsh-external/dsh-session-archive: locale");
  const t = ctx.locale.bind(NS);
  ctx.slots.inject("sidebar.footer.action", () => ctx.slots.register({
    name: "sidebar.footer.action",
    id: "session-archive",
    // 排在插件市场（community-market order=10）上方、Cordis 面板（默认 order=0）下方。
    order: 5,
    label: () => t("nav"),
    inject: () => ({ t })
  }, FooterEntry));
}

return module.exports; } });
