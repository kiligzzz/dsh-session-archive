# @dsh-external/dsh-session-archive

A DeepSeek Harness Web-plugin that surfaces the registry-global **archived
session set** and lets you restore (unarchive) sessions.

The harness workspace registry keeps an `archivedSessionIds` list that hides
sessions from every grouping surface (workspace groups, Ungrouped, content
search, flat list), but ships no UI to view or restore them. This plugin adds
that missing capability as a **sidebar-footer entry** that opens a panel of
all archived sessions, each with a one-click Restore.

## What it adds

- **Sidebar footer → “Archived sessions”** — an icon entry that opens a wide,
  fixed-size panel listing every archived session, **grouped by owning
  workspace directory** (Ungrouped last), with **collapsible directory
  groups** and a **live title search**.
- **Read-only preview per session** — clicking a session title opens a large
  modal rendering the full conversation (user/assistant bubbles, tool calls)
  from the on-disk log. Purely observational: the archived state is never
  touched, so you can inspect contents before deciding to restore or delete.
- **Restore per session** — calls a same-origin host route that durably
  removes the id from the archived set (idempotent, serialized through the
  workspace-registry write chain); the session reappears in its grouping.
- **Delete per session (with confirmation)** — a trash action next to
  Restore opens a confirmation dialog; confirming permanently removes the
  session from the archived set, detaches its workspace accounting, and
  deletes its on-disk log directory. Live sessions are refused.
- Host service `workspaceArchive` (`list()` / `preview(sessionId)` /
  `restore(sessionId)` / `deleteSession(sessionId)`) exposed to sibling host
  plugins.

## Install

Prereq: a DeepSeek Harness Web profile (`dsh` available, `pnpm` on PATH).

```sh
dsh plugin --profile web add https://github.com/kiligzzz/dsh-session-archive
```

Restart the Web profile (host and browser bundles are scanned at boot), then
refresh the page. Its bundle id appears in `__DSH_BOOT__` and a
`sidebar.footer.action` entry appears at the bottom of the sidebar.

Install from a local checkout instead:

```sh
pnpm --dir <this-checkout> install   # dev deps (esbuild) only if rebuilding
pnpm --dir <this-checkout> run build # optional — lib/ build artifacts are committed
dsh plugin --profile web add "$PWD"
```

## Remove

```sh
dsh plugin --profile web remove @dsh-external/dsh-session-archive
```

## How it works

- **host** (`src/index.ts`): a cordis plugin injecting `workspaceRegistry`
  (and optionally `webServer`). `WorkspaceArchive.restore()` mirrors the
  registry’s own `archiveSession` write path: `enqueueOperation` →
  `requireState` → `setState({ ...state, archivedSessionIds: filtered })`,
  so the change is serialized and atomically persisted to the workspace domain
  (`~/.dsh/storages/workspace.json`). A same-origin route
  `/_dsh/session-archive` exposes `GET` (list) and `POST {action:'restore'}`.
- **client** (`src/client/index.tsx`): registers a `sidebar.footer.action`
  entry; the panel reads `archivedSessionIds` / session titles from the shared
  `useWorkspaces` / `useSessions` stores and POSTs to the host route on
  restore, then the workspace baseline refreshes.

## License

MIT
