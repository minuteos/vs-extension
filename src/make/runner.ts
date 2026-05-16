import { BuildError } from '@my/errors'
import { getLog, getTrace } from '@my/services'
import { settings } from '@my/settings'
import child_process from 'child_process'
import * as vscode from 'vscode'

const log = getLog('Make')
const trace = getTrace('Make')

interface RunOptions {
  task: string
  cwd: string
}

let output: vscode.OutputChannel | undefined
let running: Promise<void> | undefined

function channel(): vscode.OutputChannel {
  output ??= vscode.window.createOutputChannel('minuteOS: make')
  return output
}

export function runMake(options: RunOptions): Promise<void> {
  if (running) {
    log.warn('A make invocation is already in progress')
    return running
  }
  const task = invoke(options).finally(() => {
    running = undefined
  })
  running = task
  return task
}

async function invoke({ task, cwd }: RunOptions): Promise<void> {
  const args: string[] = []
  if (settings.make.jobs != null) {
    args.push(`-j${String(settings.make.jobs)}`)
  } else {
    args.push('-j')
  }
  args.push(`CONFIG=${settings.config}`)
  args.push(task)

  const out = channel()
  out.show(true)
  out.appendLine(`\n> ${settings.make.path} ${args.join(' ')}  (cwd: ${cwd})`)
  trace('spawn', settings.make.path, args, cwd)

  await new Promise<void>((resolve, reject) => {
    const proc = child_process.spawn(settings.make.path, args, {
      cwd,
      env: process.env,
    })
    proc.stdout.on('data', (chunk: Buffer) => {
      out.append(chunk.toString())
    })
    proc.stderr.on('data', (chunk: Buffer) => {
      out.append(chunk.toString())
    })
    proc.on('error', (err) => {
      reject(new BuildError(`Failed to spawn ${settings.make.path}`, null, err))
    })
    proc.on('close', (code) => {
      out.appendLine(`\n> exit ${String(code)}`)
      if (code === 0) {
        resolve()
      } else {
        reject(new BuildError(`make exited with code ${String(code)}`, code))
      }
    })
  })
}
