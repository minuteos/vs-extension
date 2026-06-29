import { Settings } from '@my/configuration'

export const defaults: Settings = {
  trace: [],
  make: {
    path: 'make',
    jobs: null,
  },
  config: 'Release',
  intellisense: {
    enabled: true,
    intelliSenseMode: 'gcc-arm',
  },
}
