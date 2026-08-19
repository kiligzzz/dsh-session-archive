// Ambient declarations for harness-provided modules. Kept intentionally thin:
// the plugin compiles against lightweight structural types here; the real
// harness provides the actual services at runtime.

declare module 'cordis' {
  import type { IncomingMessage, ServerResponse } from 'node:http'

  export interface EffectScope {
    effect(fn: () => () => void, label?: string): () => void
    inject(deps: readonly string[], callback: (ctx: Context) => void): void
    provide<T>(name: string, value: T): void
    [key: string]: unknown
  }

  export interface WorkspaceEntity {
    path: string
    sessionIds: string[]
    detachSession(sessionId: string): Promise<void>
  }

  export interface Context extends EffectScope {
    logger: {
      info(message: string, ...args: unknown[]): void
      warn(message: string, ...args: unknown[]): void
      error(message: string, ...args: unknown[]): void
    }
    workspaceRegistry: {
      enqueueOperation(operation: () => Promise<unknown>): Promise<unknown>
      requireState(): {
        archivedSessionIds: string[]
        workspaceIds: string[]
      }
      setState(state: unknown): Promise<void>
      sessionKnown(id: string): Promise<boolean>
      get(id: string): WorkspaceEntity | undefined
      list(): WorkspaceEntity[]
    }
    sessions: {
      get(id: string): unknown
    }
    sessionPersistence: {
      inspect(id: string, signal?: AbortSignal): Promise<{ meta?: { cwd?: string; title?: string } }>
      readFrom(id: string, fromSeq: number, signal?: AbortSignal): Promise<{
        meta: { id: string; cwd?: string; title?: string }
        events: Array<{ seq: number; type: string; data?: Record<string, unknown>; time?: number }>
      }>
    }
    webServer?: {
      register(route: { kind: 'exact' | 'prefix'; path: string; handler: (req: IncomingMessage, res: ServerResponse) => void }): () => void
    }
  }
}
