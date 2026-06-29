export interface MakeConfiguration {
  path: string
  jobs: number | null
}

export interface IntellisenseConfiguration {
  enabled: boolean
  intelliSenseMode: string
}

export interface Settings {
  trace: string[]
  make: MakeConfiguration
  config: string
  intellisense: IntellisenseConfiguration
}
