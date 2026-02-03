export function deriveWsUrlFromHttp(httpUrl: string): string {
  try {
    const url = new URL(httpUrl)
    if (url.protocol === 'https:') url.protocol = 'wss:'
    if (url.protocol === 'http:') url.protocol = 'ws:'
    return url.toString()
  } catch {
    return httpUrl
  }
}

export function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function isValidWsUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'ws:' || url.protocol === 'wss:'
  } catch {
    return false
  }
}
