import { getLog } from '@my/services'
import * as vscode from 'vscode'

const log = getLog('Flash')

const MINUTE_DEBUG_ID = 'minuteos.minute-debug'
const DEBUG_TYPE = 'minute-debug'

interface FlashOptions {
  server: string | Record<string, unknown>
  smu?: string | Record<string, unknown>
  program: string
  smartLoad?: boolean
  cwd?: string
  env?: Record<string, string>
}

interface FlashResult {
  loaded: boolean
}

interface MinuteDebugApi {
  flash: (options: FlashOptions) => Promise<FlashResult>
}

export async function flashFirmware(folder: vscode.WorkspaceFolder): Promise<void> {
  const options = await resolveOptions(folder)
  if (!options) return

  const api = await activateMinuteDebug()
  if (!api) return

  log.info(`Flashing ${options.program}`)
  const result = await api.flash(options)
  if (result.loaded) {
    void vscode.window.showInformationMessage('minuteOS: firmware programmed')
  } else {
    void vscode.window.showInformationMessage('minuteOS: target already up to date')
  }
}

async function activateMinuteDebug(): Promise<MinuteDebugApi | undefined> {
  const ext = vscode.extensions.getExtension<MinuteDebugApi>(MINUTE_DEBUG_ID)
  if (!ext) {
    void vscode.window.showErrorMessage(
      `minuteOS: flashing requires the ${MINUTE_DEBUG_ID} extension to be installed.`,
    )
    return undefined
  }
  return ext.isActive ? ext.exports : ext.activate()
}

async function resolveOptions(folder: vscode.WorkspaceFolder): Promise<FlashOptions | undefined> {
  const launch = vscode.workspace.getConfiguration('launch', folder)
  const configs = launch.get<vscode.DebugConfiguration[]>('configurations') ?? []
  const candidates = configs.filter(c => c.type === DEBUG_TYPE && c.request === 'launch')

  if (candidates.length === 0) {
    void vscode.window.showErrorMessage(
      'minuteOS: no minute-debug launch configuration found in .vscode/launch.json.',
    )
    return undefined
  }

  const picked = candidates.length === 1 ? candidates[0] : await pickConfig(candidates)
  if (!picked) return undefined

  const name = typeof picked.name === 'string' ? picked.name : '<unnamed>'
  if (typeof picked.program !== 'string' || picked.program === '') {
    void vscode.window.showErrorMessage(`minuteOS: launch config "${name}" has no 'program' set.`)
    return undefined
  }
  if (picked.server === undefined || picked.server === null) {
    void vscode.window.showErrorMessage(`minuteOS: launch config "${name}" has no 'server' set.`)
    return undefined
  }

  return {
    server: picked.server as FlashOptions['server'],
    smu: picked.smu as FlashOptions['smu'],
    program: picked.program,
    smartLoad: typeof picked.smartLoad === 'boolean' ? picked.smartLoad : undefined,
    cwd: typeof picked.cwd === 'string' ? picked.cwd : undefined,
    env: picked.env as FlashOptions['env'],
  }
}

async function pickConfig(configs: vscode.DebugConfiguration[]): Promise<vscode.DebugConfiguration | undefined> {
  const pick = await vscode.window.showQuickPick(
    configs.map(c => ({
      label: typeof c.name === 'string' ? c.name : '<unnamed>',
      description: typeof c.program === 'string' ? c.program : '',
      config: c,
    })),
    { title: 'Select minuteDebug configuration to flash' },
  )
  return pick?.config
}
