import * as vscode from 'vscode'

type TraceFn = (...args: unknown[]) => void

interface Log {
  info: TraceFn
  warn: TraceFn
  error: TraceFn
  debug: TraceFn
}

let output: vscode.OutputChannel | undefined

let enabledTraces: ReadonlySet<string> = new Set()

export function configureLogOutput(channel: vscode.OutputChannel): void {
  output = channel
}

export function configureTrace(names: readonly string[]): void {
  enabledTraces = new Set(names)
}

export function getLog(component: string): Log {
  const emit = (level: string, args: unknown[]) => {
    const line = `[${level}] ${component}: ${args.map(fmt).join(' ')}`
    if (output) {
      output.appendLine(line)
    } else {
      console.log(line)
    }
  }
  return {
    info: (...args) => { emit('info', args) },
    warn: (...args) => { emit('warn', args) },
    error: (...args) => { emit('error', args) },
    debug: (...args) => { emit('debug', args) },
  }
}

export function getTrace(component: string): TraceFn {
  return (...args) => {
    if (!enabledTraces.has(component) && !enabledTraces.has('*')) {
      return
    }
    const line = `[trace] ${component}: ${args.map(fmt).join(' ')}`
    if (output) {
      output.appendLine(line)
    } else {
      console.log(line)
    }
  }
}

function fmt(v: unknown): string {
  if (typeof v === 'string') {
    return v
  }
  try {
    return JSON.stringify(v)
  } catch {
    return String(v)
  }
}
