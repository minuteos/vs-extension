import { queryMake } from '@my/make'
import { getLog, getTrace } from '@my/services'

import { CppConfig, parseDryRun } from './parse'

const log = getLog('Intellisense')
const trace = getTrace('intellisense')

// Ask make what it *would* compile, without building, and read the flags off
// the real compiler command lines. Works with any Makefile — no project-side
// cooperation required.
//   -B  consider everything out of date, so commands print even if built
//   -n  dry run, don't execute
//   -w  announce sub-make directories, so relative paths resolve correctly
const DRY_RUN_ARGS = ['-B', '-n', '-w', 'all']

export { CppConfig } from './parse'

export async function fetchCppConfig(cwd: string): Promise<CppConfig | undefined> {
  let raw: string
  try {
    raw = await queryMake(DRY_RUN_ARGS, cwd)
  } catch (err) {
    log.debug('make dry-run failed', err)
    return undefined
  }

  const config = parseDryRun(raw, cwd)
  trace('parsed', config.files.size, 'files,', config.includes.length, 'include dirs')
  if (config.files.size === 0 && config.includes.length === 0) {
    log.warn('Could not derive any C/C++ configuration from the build')
    return undefined
  }
  return config
}
