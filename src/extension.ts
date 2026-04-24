import { registerCommands } from '@my/commands'
import { configureLogOutput, configureVsCodeStorage, getLog } from '@my/services'
import { configureSettings } from '@my/settings'
import { configureStatusBar } from '@my/status-bar'
import 'disposablestack/auto'
import * as vscode from 'vscode'

const log = getLog('Extension')

export function activate(context: vscode.ExtensionContext): void {
  const channel = vscode.window.createOutputChannel('minuteOS')
  context.subscriptions.push(channel)
  configureLogOutput(channel)
  configureVsCodeStorage(context)
  configureSettings(context)
  configureStatusBar(context)
  registerCommands(context)

  log.info('minuteOS extension activated')
}

export function deactivate(): void {
  log.info('minuteOS extension deactivated')
}
