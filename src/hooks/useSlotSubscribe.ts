import { useEffect, useRef, useState } from 'react'
import { isValidWsUrl } from '../lib/rpcUrl'

type SlotNotification = {
  jsonrpc: '2.0'
  method: 'slotNotification'
  params: {
    result: { parent: number; root: number; slot: number }
    subscription: number
  }
}

export type WsStatus = {
  state: 'disabled' | 'connecting' | 'connected' | 'reconnecting'
  attempts: number
  since: number
  lastMessageAt: number | null
  lastError: string | null
}

export function useSlotSubscribe(wsUrl: string, onSlot?: (slot: number) => void) {
  const [processedSlot, setProcessedSlot] = useState<number | null>(null)
  const [status, setStatus] = useState<WsStatus>(() => ({
    state: 'connecting',
    attempts: 0,
    since: Date.now(),
    lastMessageAt: null,
    lastError: null,
  }))

  const onSlotRef = useRef(onSlot)

  useEffect(() => {
    onSlotRef.current = onSlot
  }, [onSlot])

  useEffect(() => {
    let ws: WebSocket | null = null
    let stopped = false
    let retryTimeout: number | undefined

    let attempts = 0

    const connect = () => {
      if (stopped) return

      setStatus((prev) => ({
        ...prev,
        state: attempts === 0 ? 'connecting' : 'reconnecting',
        attempts,
        since: Date.now(),
      }))

      ws = new WebSocket(wsUrl)

      const requestId = Math.floor(Math.random() * 1_000_000_000)

      ws.onopen = () => {
        ws?.send(
          JSON.stringify({
            jsonrpc: '2.0',
            id: requestId,
            method: 'slotSubscribe',
            params: [{ commitment: 'processed' }],
          }),
        )

        setStatus((prev) => ({
          ...prev,
          state: attempts === 0 ? 'connected' : 'reconnecting',
          attempts,
          since: Date.now(),
          lastError: null,
        }))
      }

      ws.onerror = () => {
        setStatus((prev) => ({
          ...prev,
          lastError: 'WebSocket error',
        }))
      }

      ws.onmessage = (event) => {
        let message: unknown
        try {
          message = JSON.parse(String(event.data)) as unknown
        } catch {
          return
        }

        if (
          typeof message === 'object' &&
          message != null &&
          'id' in message
        ) {
          return
        }

        const note = message as Partial<SlotNotification>
        const slot = note.params?.result?.slot
        if (note.method === 'slotNotification' && typeof slot === 'number') {
          attempts = 0
          onSlotRef.current?.(slot)
          setProcessedSlot(slot)
          setStatus((prev) => ({
            ...prev,
            state: 'connected',
            attempts: 0,
            lastMessageAt: Date.now(),
            lastError: null,
          }))
        }
      }

      ws.onclose = () => {
        if (stopped) return

        attempts += 1
        const backoff = Math.min(1000 * 2 ** Math.min(attempts, 4), 15_000)
        const jitter = Math.floor(Math.random() * 250)

        setStatus((prev) => ({
          ...prev,
          state: 'reconnecting',
          attempts,
          since: Date.now(),
          lastError: prev.lastError ?? 'WebSocket closed',
        }))

        retryTimeout = window.setTimeout(connect, backoff + jitter)
      }
    }

    const startTimeout = window.setTimeout(() => {
      if (stopped) return

      setProcessedSlot(null)

      if (!isValidWsUrl(wsUrl)) {
        setStatus({
          state: 'disabled',
          attempts: 0,
          since: Date.now(),
          lastMessageAt: null,
          lastError: 'Invalid WebSocket URL',
        })
        return
      }

      setStatus({
        state: 'connecting',
        attempts: 0,
        since: Date.now(),
        lastMessageAt: null,
        lastError: null,
      })

      connect()
    }, 0)

    return () => {
      stopped = true
      if (startTimeout != null) window.clearTimeout(startTimeout)
      if (retryTimeout != null) window.clearTimeout(retryTimeout)

      try {
        ws?.close()
      } catch {
        // ignore
      }
    }
  }, [wsUrl])

  return { processedSlot, status }
}
