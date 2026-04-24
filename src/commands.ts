import { flashFirmware } from '@my/flash'
import { pickTarget, runMake } from '@my/make'
import { getLog } from '@my/services'
import { settings } from '@my/settings'
import * as vscode from 'vscode'

const log = getLog('Commands')

export function registerCommands(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('minute.build', build),
    vscode.commands.registerCommand('minute.clean', clean),
    vscode.commands.registerCommand('minute.flash', flash),
    vscode.commands.registerCommand('minute.buildAndFlash', buildAndFlash),
    vscode.commands.registerCommand('minute.selectTarget', selectTarget),
  )
}

async function build(): Promise<void> {
  const folder = requireWorkspace()
  if (!folder) return
  try {
    await runMake({ task: 'all', cwd: folder.uri.fsPath })
  } catch (err) {
    log.error('Build failed', err)
    void vscode.window.showErrorMessage(`minuteOS build failed: ${errorMessage(err)}`)
  }
}

async function clean(): Promise<void> {
  const folder = requireWorkspace()
  if (!folder) return
  try {
    await runMake({ task: 'clean', cwd: folder.uri.fsPath })
  } catch (err) {
    log.error('Clean failed', err)
    void vscode.window.showErrorMessage(`minuteOS clean failed: ${errorMessage(err)}`)
  }
}

async function flash(): Promise<void> {
  const folder = requireWorkspace()
  if (!folder) return
  try {
    await flashFirmware(folder)
  } catch (err) {
    log.error('Flash failed', err)
    void vscode.window.showErrorMessage(`minuteOS flash failed: ${errorMessage(err)}`)
  }
}

async function buildAndFlash(): Promise<void> {
  const folder = requireWorkspace()
  if (!folder) return
  try {
    await runMake({ task: 'all', cwd: folder.uri.fsPath })
    await flashFirmware(folder)
  } catch (err) {
    log.error('Build & flash failed', err)
    void vscode.window.showErrorMessage(`minuteOS build & flash failed: ${errorMessage(err)}`)
  }
}

async function selectTarget(): Promise<void> {
  const folder = requireWorkspace()
  if (!folder) return
  const target = await pickTarget(folder.uri.fsPath, settings.make.path)
  if (target === undefined) return
  await vscode.workspace.getConfiguration('minute').update(
    'target', target, vscode.ConfigurationTarget.Workspace,
  )
}

function requireWorkspace(): vscode.WorkspaceFolder | undefined {
  const folder = vscode.workspace.workspaceFolders?.[0]
  if (!folder) {
    void vscode.window.showErrorMessage('minuteOS: open a workspace folder containing a Makefile')
    return undefined
  }
  return folder
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}
