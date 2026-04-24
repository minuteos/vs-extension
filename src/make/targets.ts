import { getLog } from '@my/services'
import child_process from 'child_process'
import * as vscode from 'vscode'

const log = getLog('Targets')

/**
 * Discovers minuteOS build targets by asking make for its known targets.
 * Falls back to an empty list when make can't be invoked.
 * @param cwd Working directory containing the project's Makefile.
 * @param makePath Path to the make binary.
 * @returns Alphabetically sorted list of candidate targets.
 */
export async function discoverTargets(cwd: string, makePath: string): Promise<string[]> {
  try {
    const stdout = await run(makePath, ['-pRrq', ':'], cwd)
    return parseTargets(stdout)
  } catch (err) {
    log.warn('Target discovery failed', err)
    return []
  }
}

function parseTargets(stdout: string): string[] {
  const names = new Set<string>()
  let inDatabase = false
  for (const rawLine of stdout.split('\n')) {
    const line = rawLine.trimEnd()
    if (line.startsWith('# Files')) {
      inDatabase = true
      continue
    }
    if (!inDatabase) continue
    if (line.startsWith('#') || line === '' || line.startsWith('\t')) continue
    const colon = line.indexOf(':')
    if (colon <= 0) continue
    const name = line.slice(0, colon).trim()
    if (!/^[A-Za-z0-9._/-]+$/.test(name)) continue
    if (name.startsWith('.')) continue
    names.add(name)
  }
  return [...names].sort()
}

function run(cmd: string, args: string[], cwd: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    child_process.execFile(cmd, args, { cwd, maxBuffer: 16 * 1024 * 1024 }, (err, stdout) => {
      // `make -pRrq` exits non-zero when work is needed; we still want the database.
      if (err && typeof err.code === 'string') {
        reject(new Error(err.message, { cause: err }))
        return
      }
      resolve(stdout)
    })
  })
}

export async function pickTarget(cwd: string, makePath: string): Promise<string | undefined> {
  const targets = await discoverTargets(cwd, makePath)
  if (targets.length === 0) {
    return vscode.window.showInputBox({
      prompt: 'Enter minuteOS build target',
      placeHolder: 'e.g. firmware or board-name',
    })
  }
  return vscode.window.showQuickPick(targets, {
    title: 'Select minuteOS Build Target',
    matchOnDescription: true,
  })
}
