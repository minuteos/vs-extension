import { settings } from '@my/settings'
import * as vscode from 'vscode'

let targetItem: vscode.StatusBarItem | undefined
let flashItem: vscode.StatusBarItem | undefined

export function configureStatusBar(context: vscode.ExtensionContext): void {
  targetItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 50)
  targetItem.command = 'minute.selectTarget'
  targetItem.tooltip = 'minuteOS build target — click to change'
  context.subscriptions.push(targetItem)

  flashItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 49)
  flashItem.command = 'minute.buildAndFlash'
  flashItem.tooltip = 'minuteOS: build & flash firmware'
  flashItem.text = '$(zap) Flash'
  context.subscriptions.push(flashItem)

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
  if (targetItem) {
    const target = settings.target ?? '(no target)'
    targetItem.text = `$(chip) minuteOS: ${target}`
    targetItem.show()
  }
  flashItem?.show()
}
