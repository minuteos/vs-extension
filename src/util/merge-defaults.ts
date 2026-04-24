type Plain = Record<string, unknown>

function isPlainObject(v: unknown): v is Plain {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/**
 * Deep-merge `defaults` into `value`, producing a new object where keys
 * missing from `value` fall back to those in `defaults`. Arrays are taken
 * wholesale from `value` when present.
 * @param value User-supplied partial configuration.
 * @param defaults Fallback configuration.
 * @returns A new object with defaults filled in.
 */
export function mergeDefaults<T>(value: Partial<T>, defaults: T): T {
  if (!isPlainObject(value) || !isPlainObject(defaults)) {
    return (value as T | undefined) ?? defaults
  }
  const out: Plain = { ...defaults }
  for (const k of Object.keys(value)) {
    const v = (value as Plain)[k]
    const d = (defaults as Plain)[k]
    if (isPlainObject(v) && isPlainObject(d)) {
      out[k] = mergeDefaults(v, d)
    } else if (v !== undefined) {
      out[k] = v
    }
  }
  return out as T
}
