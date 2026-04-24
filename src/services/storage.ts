import * as vscode from 'vscode'

let ctx: vscode.ExtensionContext | undefined

export function configureVsCodeStorage(context: vscode.ExtensionContext): void {
  ctx = context
}

export function workspaceState<T>(key: string, fallback: T): T {
  return ctx?.workspaceState.get<T>(key) ?? fallback
}

export function setWorkspaceState(key: string, value: unknown): Thenable<void> {
  if (!ctx) {
    return Promise.resolve()
  }
  return ctx.workspaceState.update(key, value)
}
