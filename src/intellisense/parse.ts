import path from 'path'

export interface FileFlags {
  includes: string[]
  defines: string[]
  standard?: string
  compilerPath?: string
}

export interface CppConfig {
  // Per-source-file flags, keyed by absolute path. Headers and files not seen
  // in the build fall back to the union below.
  files: Map<string, FileFlags>
  compilerPath?: string
  cStandard?: string
  cppStandard?: string
  includes: string[]
  defines: string[]
}

const COMMAND_SEPARATORS = new Set(['&&', '||', ';', '|', '&'])
const COMPILER_RE = /(?:^|[/-])(?:gcc|g\+\+|clang|clang\+\+|cc|c\+\+)$/
const SOURCE_RE = /\.(?:c|cc|cpp|cxx|c\+\+|cp)$/i
const ENTERING_RE = /Entering directory ['`](.+)'/
const LEAVING_RE = /Leaving directory ['`](.+)'/

// Parse `make --dry-run -w` output into a C/C++ configuration by extracting the
// real compiler command lines. `-w` makes recursive sub-makes announce the
// directory they run in, so include/source paths resolve correctly.
export function parseDryRun(raw: string, rootDir: string): CppConfig {
  const files = new Map<string, FileFlags>()
  const includes = new Set<string>()
  const defines = new Set<string>()
  let compilerPath: string | undefined
  let cStandard: string | undefined
  let cppStandard: string | undefined

  const dirStack: string[] = []
  const cwd = () => dirStack[dirStack.length - 1] ?? rootDir

  for (const line of raw.split('\n')) {
    const entering = ENTERING_RE.exec(line)
    if (entering) {
      dirStack.push(entering[1])
      continue
    }
    if (LEAVING_RE.test(line)) {
      dirStack.pop()
      continue
    }

    // A recipe line runs in one shell, so a `cd` in it affects later commands
    // on the same line (e.g. `cd sub && gcc …`) but not the next line.
    let lineDir = cwd()
    for (const command of splitCommands(tokenize(line))) {
      if (command[0] === 'cd' && command[1]) {
        lineDir = path.resolve(lineDir, command[1])
        continue
      }
      const start = command.findIndex(isCompiler)
      if (start < 0) continue
      const flags = extractFlags(command.slice(start), lineDir)
      if (!flags) continue

      compilerPath ??= flags.compilerPath
      for (const i of flags.includes) includes.add(i)
      for (const d of flags.defines) defines.add(d)
      if (flags.standard) {
        if (flags.standard.includes('++')) {
          cppStandard ??= flags.standard
        } else {
          cStandard ??= flags.standard
        }
      }
      if (flags.source) {
        files.set(flags.source, {
          includes: flags.includes,
          defines: flags.defines,
          standard: flags.standard,
          compilerPath: flags.compilerPath,
        })
      }
    }
  }

  return {
    files,
    compilerPath,
    cStandard,
    cppStandard,
    includes: [...includes],
    defines: [...defines],
  }
}

interface ExtractedFlags extends FileFlags {
  compilerPath: string
  source?: string
}

function extractFlags(tokens: string[], dir: string): ExtractedFlags | undefined {
  const compilerPath = tokens[0]
  const includes: string[] = []
  const defines: string[] = []
  let standard: string | undefined
  let source: string | undefined
  let isCompile = false

  for (let i = 1; i < tokens.length; i++) {
    const t = tokens[i]
    if (t === '-c') {
      isCompile = true
    } else if (t === '-o') {
      i++
    } else if (t === '-isystem' || t === '-iquote' || t === '-idirafter') {
      const d = tokens[++i] as string | undefined
      if (d) includes.push(path.resolve(dir, d))
    } else if (t.startsWith('-isystem')) {
      includes.push(path.resolve(dir, t.slice('-isystem'.length)))
    } else if (t.startsWith('-I')) {
      const d = t.length > 2 ? t.slice(2) : tokens[++i] as string | undefined
      if (d) includes.push(path.resolve(dir, d))
    } else if (t.startsWith('-D')) {
      const d = t.length > 2 ? t.slice(2) : tokens[++i] as string | undefined
      if (d) defines.push(d)
    } else if (t.startsWith('-std=')) {
      standard = t.slice(5)
    } else if (!t.startsWith('-') && SOURCE_RE.test(t)) {
      source = path.resolve(dir, t)
      isCompile = true
    }
  }

  if (!isCompile) return undefined
  return { compilerPath, includes, defines, standard, source }
}

function isCompiler(token: string): boolean {
  return !token.startsWith('-') && COMPILER_RE.test(token)
}

function splitCommands(tokens: string[]): string[][] {
  const commands: string[][] = []
  let current: string[] = []
  for (const t of tokens) {
    if (COMMAND_SEPARATORS.has(t)) {
      if (current.length) commands.push(current)
      current = []
    } else {
      current.push(t)
    }
  }
  if (current.length) commands.push(current)
  return commands
}

function tokenize(line: string): string[] {
  const tokens: string[] = []
  let current = ''
  let quote: '"' | '\'' | undefined
  let started = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (quote) {
      if (ch === quote) {
        quote = undefined
      } else if (ch === '\\' && quote === '"' && i + 1 < line.length) {
        current += line[++i]
      } else {
        current += ch
      }
    } else if (ch === '"' || ch === '\'') {
      quote = ch
      started = true
    } else if (ch === '\\' && i + 1 < line.length) {
      current += line[++i]
      started = true
    } else if (/\s/.test(ch)) {
      if (started) {
        tokens.push(current)
        current = ''
        started = false
      }
    } else {
      current += ch
      started = true
    }
  }
  if (started) tokens.push(current)
  return tokens
}
