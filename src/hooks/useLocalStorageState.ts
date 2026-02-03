import { useEffect, useState } from 'react'

function safeJsonParse<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function useLocalStorageState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    const raw = localStorage.getItem(key)
    if (raw == null) return initialValue
    return safeJsonParse<T>(raw) ?? initialValue
  })

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  const reset = () => setValue(initialValue)

  return [value, setValue, { reset }] as const
}
