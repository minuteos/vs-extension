import { getLog } from '@my/services'
import { settings } from '@my/settings'
import * as vscode from 'vscode'
import {
  CppToolsApi,
  CustomConfigurationProvider,
  getCppToolsApi,
  SourceFileConfiguration,
  SourceFileConfigurationItem,
  Version,
  WorkspaceBrowseConfiguration,
} from 'vscode-cpptools'

import { CppConfig, fetchCppConfig } from './query'

const log = getLog('Intellisense')

const EXTENSION_ID = 'minuteos.minute'
const SOURCE_EXTENSIONS = new Set([
  '.c', '.cc', '.cpp', '.cxx', '.c++',
  '.h', '.hh', '.hpp', '.hxx', '.h++', '.inc',
])

class MinuteConfigProvider implements CustomConfigurationProvider {
  readonly name = 'minuteOS'
  readonly extensionId = EXTENSION_ID

  private cache: Promise<CppConfig | undefined> | undefined

  refresh(): void {
    this.cache = undefined
  }

  canProvideConfiguration(uri: vscode.Uri): Promise<boolean> {
    return isSourceUri(uri) ? this.hasConfig() : Promise.resolve(false)
  }

  async provideConfigurations(uris: vscode.Uri[]): Promise<SourceFileConfigurationItem[]> {
    const config = await this.getConfig()
    if (!config) return []
    return uris.filter(isSourceUri).map(uri => ({
      uri,
      configuration: sourceConfiguration(config, uri),
    }))
  }

  canProvideBrowseConfiguration(): Promise<boolean> {
    return this.hasConfig()
  }

  async provideBrowseConfiguration(): Promise<WorkspaceBrowseConfiguration | null> {
    const config = await this.getConfig()
    if (!config) return null
    return {
      browsePath: config.includes,
      compilerPath: config.compilerPath,
      standard: (config.cppStandard ?? config.cStandard) as WorkspaceBrowseConfiguration['standard'],
    }
  }

  canProvideBrowseConfigurationsPerFolder(): Promise<boolean> {
    return Promise.resolve(false)
  }

  provideFolderBrowseConfiguration(): Promise<WorkspaceBrowseConfiguration | null> {
    return Promise.resolve(null)
  }

  dispose(): void {
    this.cache = undefined
  }

  private async hasConfig(): Promise<boolean> {
    return (await this.getConfig()) !== undefined
  }

  private getConfig(): Promise<CppConfig | undefined> {
    if (!settings.intellisense.enabled) return Promise.resolve(undefined)
    const folder = vscode.workspace.workspaceFolders?.[0]
    if (!folder) return Promise.resolve(undefined)
    this.cache ??= fetchCppConfig(folder.uri.fsPath)
    return this.cache
  }
}

function sourceConfiguration(config: CppConfig, uri: vscode.Uri): SourceFileConfiguration {
  const intelliSenseMode = settings.intellisense.intelliSenseMode as SourceFileConfiguration['intelliSenseMode']

  // Exact flags for files the build actually compiles; headers and anything
  // else fall back to the union, with the standard picked by extension.
  const file = config.files.get(uri.fsPath)
  if (file) {
    return {
      includePath: file.includes,
      defines: file.defines,
      compilerPath: file.compilerPath ?? config.compilerPath,
      standard: file.standard as SourceFileConfiguration['standard'],
      intelliSenseMode,
    }
  }

  const standard = uri.fsPath.endsWith('.c') ? config.cStandard : config.cppStandard
  return {
    includePath: config.includes,
    defines: config.defines,
    compilerPath: config.compilerPath,
    standard: standard as SourceFileConfiguration['standard'],
    intelliSenseMode,
  }
}

function isSourceUri(uri: vscode.Uri): boolean {
  const path = uri.fsPath
  const dot = path.lastIndexOf('.')
  return dot >= 0 && SOURCE_EXTENSIONS.has(path.slice(dot).toLowerCase())
}

let api: CppToolsApi | undefined
let provider: MinuteConfigProvider | undefined

export function configureIntellisense(context: vscode.ExtensionContext): void {
  void initialize(context)
}

// Drop the cached configuration and ask cpptools to re-query the provider.
export function refreshIntellisense(): void {
  provider?.refresh()
  if (api && provider) {
    api.didChangeCustomConfiguration(provider)
    api.didChangeCustomBrowseConfiguration(provider)
  }
}

async function initialize(context: vscode.ExtensionContext): Promise<void> {
  api = await getCppToolsApi(Version.latest)
  if (!api) {
    log.info('cpptools not available — IntelliSense integration disabled')
    return
  }
  context.subscriptions.push(api)

  provider = new MinuteConfigProvider()
  context.subscriptions.push(provider)
  api.registerCustomConfigurationProvider(provider)
  api.notifyReady(provider)
  log.info('Registered cpptools configuration provider')

  const watcher = vscode.workspace.createFileSystemWatcher('**/{Makefile,*.mk,minuteos.json}')
  watcher.onDidChange(refreshIntellisense)
  watcher.onDidCreate(refreshIntellisense)
  watcher.onDidDelete(refreshIntellisense)
  context.subscriptions.push(
    watcher,
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('minute.config') || e.affectsConfiguration('minute.intellisense')) {
        refreshIntellisense()
      }
    }),
  )
}
