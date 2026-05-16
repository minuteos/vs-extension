import { settings } from '@my/settings'
import * as vscode from 'vscode'

let configItem: vscode.StatusBarItem | undefined
let flashItem: vscode.StatusBarItem | undefined

export function configureStatusBar(context: vscode.ExtensionContext): void {
  configItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 50)
  configItem.command = 'minute.selectConfig'
  configItem.tooltip = 'minuteOS build configuration — click to change'
  context.subscriptions.push(configItem)

  flashItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 49)
  flashItem.command = 'minute.buildAndFlash'
  flashItem.tooltip = 'minuteOS: build & flash firmware'
  flashItem.text = '$(zap) Flash'
  context.subscriptions.push(flashItem)

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('minute.config')) {
        updateStatusBar()
      }
    }),
  )
  updateStatusBar()
}

export function updateStatusBar(): void {
  if (configItem) {
    configItem.text = `$(chip) minuteOS: ${settings.config}`
    configItem.show()
  }
  flashItem?.show()
}
