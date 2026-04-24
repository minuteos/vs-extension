import { Settings } from '@my/configuration'
import { defaults } from '@my/defaults'
import { configureTrace, getLog, getTrace } from '@my/services'
import { mergeDefaults } from '@my/util'
import * as vscode from 'vscode'

const log = getLog('Settings')
const trace = getTrace('Settings')

export let settings: Settings = defaults

export function configureSettings(context: vscode.ExtensionContext): void {
  function loadConfig() {
    // eslint-disable-next-line @typescript-eslint/unbound-method, @typescript-eslint/no-unused-vars
    const { has, get, update, inspect, ...vsCfg } = vscode.workspace.getConfiguration('minute')
    settings = Object.freeze(mergeDefaults(vsCfg as Partial<Settings>, defaults))
    configureTrace(settings.trace)
    trace(settings)
  }

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('minute')) {
        log.debug('Settings changed')
        loadConfig()
      }
    }),
  )
  loadConfig()
}
