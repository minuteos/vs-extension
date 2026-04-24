import { settings } from '@my/settings'
import * as vscode from 'vscode'

let item: vscode.StatusBarItem | undefined

export function configureStatusBar(context: vscode.ExtensionContext): void {
  item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 50)
  item.command = 'minute.selectTarget'
  item.tooltip = 'minuteOS build target — click to change'
  context.subscriptions.push(item)

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('minute.target')) {
        updateStatusBar()
      }
    }),
  )
  updateStatusBar()
}

export function updateStatusBar(): void {
  if (!item) return
  const target = settings.target ?? '(no target)'
  item.text = `$(chip) minuteOS: ${target}`
  item.show()
}
