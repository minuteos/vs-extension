import { pickTarget, runMake } from '@my/make'
import { getLog } from '@my/services'
import { settings } from '@my/settings'
import * as vscode from 'vscode'

const log = getLog('Commands')

export function registerCommands(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('minute.build', build),
    vscode.commands.registerCommand('minute.clean', clean),
    vscode.commands.registerCommand('minute.selectTarget', selectTarget),
  )
}

async function build(): Promise<void> {
  const cwd = requireWorkspace()
  if (!cwd) return
  try {
    await runMake({ task: 'all', cwd })
  } catch (err) {
    log.error('Build failed', err)
    void vscode.window.showErrorMessage(`minuteOS build failed: ${errorMessage(err)}`)
  }
}

async function clean(): Promise<void> {
  const cwd = requireWorkspace()
  if (!cwd) return
  try {
    await runMake({ task: 'clean', cwd })
  } catch (err) {
    log.error('Clean failed', err)
    void vscode.window.showErrorMessage(`minuteOS clean failed: ${errorMessage(err)}`)
  }
}

async function selectTarget(): Promise<void> {
  const cwd = requireWorkspace()
  if (!cwd) return
  const target = await pickTarget(cwd, settings.make.path)
  if (target === undefined) return
  await vscode.workspace.getConfiguration('minute').update(
    'target', target, vscode.ConfigurationTarget.Workspace,
  )
}

function requireWorkspace(): string | undefined {
  const folder = vscode.workspace.workspaceFolders?.[0]
  if (!folder) {
    void vscode.window.showErrorMessage('minuteOS: open a workspace folder containing a Makefile')
    return undefined
  }
  return folder.uri.fsPath
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}
