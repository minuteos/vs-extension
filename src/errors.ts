export class MinuteError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message)
    this.name = 'MinuteError'
  }
}

export class BuildError extends MinuteError {
  constructor(message: string, readonly exitCode: number | null, cause?: unknown) {
    super(message, cause)
    this.name = 'BuildError'
  }
}
