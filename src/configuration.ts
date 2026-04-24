export interface MakeConfiguration {
  path: string
  jobs: number | null
}

export interface Settings {
  trace: string[]
  make: MakeConfiguration
  target: string | null
}
