import { useMemo, useState } from 'react'
import { deriveWsUrlFromHttp, isValidHttpUrl, isValidWsUrl } from '../lib/rpcUrl'
import type { RpcConfig } from '../types'

type Props = {
  value: RpcConfig
  onApply: (next: RpcConfig) => void
  onReset: () => void
}

function normalize(url: string): string {
  return url.trim()
}

export function RpcConfigPanel({ value, onApply, onReset }: Props) {
  const [httpUrl, setHttpUrl] = useState(() => value.httpUrl)
  const [wsUrl, setWsUrl] = useState(() => value.wsUrl)
  const [error, setError] = useState<string | null>(null)

  const derivedWsUrl = useMemo(() => deriveWsUrlFromHttp(httpUrl), [httpUrl])

  const onConnect = () => {
    const next: RpcConfig = {
      httpUrl: normalize(httpUrl),
      wsUrl: normalize(wsUrl),
    }

    if (!isValidHttpUrl(next.httpUrl)) {
      setError('HTTP RPC URL must be a valid http(s) URL.')
      return
    }
    if (!isValidWsUrl(next.wsUrl)) {
      setError('WS URL must be a valid ws(s) URL.')
      return
    }

    setError(null)
    onApply(next)
  }

  return (
    <div>
      <div className="formRow">
        <div className="formLabel">HTTP RPC</div>
        <input
          className="input"
          value={httpUrl}
          onChange={(e) => setHttpUrl(e.target.value)}
          spellCheck={false}
          inputMode="url"
          placeholder="https://api.devnet.solana.com"
          aria-label="HTTP RPC URL"
        />
      </div>

      <div className="formRow" style={{ marginTop: 10 }}>
        <div className="formLabel">WebSocket</div>
        <input
          className="input"
          value={wsUrl}
          onChange={(e) => setWsUrl(e.target.value)}
          spellCheck={false}
          inputMode="url"
          placeholder="wss://api.devnet.solana.com"
          aria-label="WebSocket URL"
        />
      </div>

      <div className="formActions">
        <button className="btn btnPrimary" type="button" onClick={onConnect}>
          Connect
        </button>
        <button
          className="btn"
          type="button"
          onClick={() => setWsUrl(derivedWsUrl)}
          title="Derive WS URL from the HTTP URL (http→ws, https→wss)"
        >
          Use derived WS
        </button>
        <button className="btn" type="button" onClick={onReset}>
          Reset to Devnet
        </button>
        <div className="muted" style={{ marginLeft: 'auto' }}>
          Saved to localStorage (non-secret).
        </div>
      </div>

      {error == null ? null : <div className="error">{error}</div>}
    </div>
  )
}
