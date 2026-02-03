import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getEpochInfo, getSlot } from '../lib/solanaRpc'
import type { EpochInfo, HistorySample, RpcBadge } from '../types'
import { useSlotSubscribe, type WsStatus } from './useSlotSubscribe'

type Slots = {
  processed: number | null
  confirmed: number | null
  finalized: number | null
}

type RpcStatus = {
  badge: RpcBadge
  detail: string
}

const HISTORY_MAX = 600

const WS_STALE_MS = 10_000
const POLL_BASE_MS = 850
const POLL_MAX_MS = 8_000

const EPOCH_BASE_MS = 25_000
const EPOCH_MAX_MS = 2 * 60_000

export function useCommitmentLadder(httpUrl: string, wsUrl: string) {
  const wsStatusRef = useRef<WsStatus | null>(null)

  const processedRef = useRef<number | null>(null)
  const processedFallbackRef = useRef<number | null>(null)
  const confirmedRef = useRef<number | null>(null)
  const finalizedRef = useRef<number | null>(null)

  const lastSampleKeyRef = useRef<string | null>(null)

  const [processedFallback, setProcessedFallback] = useState<number | null>(null)
  const [confirmed, setConfirmed] = useState<number | null>(null)
  const [finalized, setFinalized] = useState<number | null>(null)

  const [epochInfo, setEpochInfo] = useState<EpochInfo | null>(null)
  const [history, setHistory] = useState<HistorySample[]>([])

  const [lastSlotPollSuccessAt, setLastSlotPollSuccessAt] = useState<number | null>(
    null,
  )
  const [lastSlotPollErrorAt, setLastSlotPollErrorAt] = useState<number | null>(null)

  const [now, setNow] = useState(() => Date.now())

  const recordSample = useCallback((forceWsProcessed: boolean) => {
    const currentWs = wsStatusRef.current
    const wsFreshNow =
      forceWsProcessed ||
      (currentWs?.state === 'connected' &&
        currentWs.lastMessageAt != null &&
        Date.now() - currentWs.lastMessageAt < WS_STALE_MS)

    const processed = wsFreshNow ? processedRef.current : processedFallbackRef.current
    const currentConfirmed = confirmedRef.current
    const currentFinalized = finalizedRef.current

    if (processed == null || currentConfirmed == null || currentFinalized == null) return

    const key = `${processed}|${currentConfirmed}|${currentFinalized}`
    if (lastSampleKeyRef.current === key) return
    lastSampleKeyRef.current = key

    setHistory((prev) => {
      const next = [...prev, { ts: Date.now(), processed, confirmed: currentConfirmed, finalized: currentFinalized }]
      if (next.length > HISTORY_MAX) next.splice(0, next.length - HISTORY_MAX)
      return next
    })
  }, [])

  const onProcessedSlot = useCallback(
    (slot: number) => {
      processedRef.current = slot
      recordSample(true)
    },
    [recordSample],
  )

  const { processedSlot, status: wsStatus } = useSlotSubscribe(wsUrl, onProcessedSlot)

  useEffect(() => {
    wsStatusRef.current = wsStatus
  }, [wsStatus])

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    let cancelled = false
    let timeoutId: number | undefined

    let delayMs = POLL_BASE_MS

    const loop = async () => {
      const startedAt = Date.now()

      try {
        const currentWsStatus = wsStatusRef.current
        const wsFresh =
          currentWsStatus?.state === 'connected' &&
          currentWsStatus.lastMessageAt != null &&
          startedAt - currentWsStatus.lastMessageAt < WS_STALE_MS

        const [nextConfirmed, nextFinalized, processedFallbackMaybe] =
          await Promise.all([
            getSlot(httpUrl, 'confirmed'),
            getSlot(httpUrl, 'finalized'),
            wsFresh
              ? Promise.resolve<number | null>(null)
              : getSlot(httpUrl, 'processed'),
          ])

        if (cancelled) return

        confirmedRef.current = nextConfirmed
        finalizedRef.current = nextFinalized
        setConfirmed(nextConfirmed)
        setFinalized(nextFinalized)

        if (processedFallbackMaybe != null) {
          processedFallbackRef.current = processedFallbackMaybe
          setProcessedFallback(processedFallbackMaybe)
        }

        setLastSlotPollSuccessAt(Date.now())
        setLastSlotPollErrorAt(null)

        delayMs = POLL_BASE_MS
        recordSample(false)
      } catch {
        if (cancelled) return
        setLastSlotPollErrorAt(Date.now())
        delayMs = Math.min(
          Math.round(delayMs * 1.7 + Math.random() * 250),
          POLL_MAX_MS,
        )
      }

      if (cancelled) return
      const elapsed = Date.now() - startedAt
      const nextDelay = Math.max(0, delayMs - elapsed)
      timeoutId = window.setTimeout(loop, nextDelay)
    }

    void loop()

    return () => {
      cancelled = true
      if (timeoutId != null) window.clearTimeout(timeoutId)
    }
  }, [httpUrl, recordSample])

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()

    let timeoutId: number | undefined
    let delayMs = EPOCH_BASE_MS

    const loop = async () => {
      const startedAt = Date.now()

      try {
        const info = await getEpochInfo(httpUrl, 'processed', controller.signal)
        if (cancelled) return
        setEpochInfo(info)
        delayMs = EPOCH_BASE_MS
      } catch {
        if (cancelled) return
        delayMs = Math.min(
          Math.round(delayMs * 1.6 + Math.random() * 500),
          EPOCH_MAX_MS,
        )
      }

      if (cancelled) return
      const elapsed = Date.now() - startedAt
      const nextDelay = Math.max(0, delayMs - elapsed)
      timeoutId = window.setTimeout(loop, nextDelay)
    }

    void loop()

    return () => {
      cancelled = true
      controller.abort()
      if (timeoutId != null) window.clearTimeout(timeoutId)
    }
  }, [httpUrl])

  const wsFreshUi =
    wsStatus.state === 'connected' &&
    wsStatus.lastMessageAt != null &&
    now - wsStatus.lastMessageAt < WS_STALE_MS

  const slots: Slots = useMemo(
    () => ({
      processed: wsFreshUi && processedSlot != null ? processedSlot : processedFallback,
      confirmed,
      finalized,
    }),
    [confirmed, finalized, processedFallback, processedSlot, wsFreshUi],
  )

  const status: RpcStatus = useMemo(() => {
    const pollFresh =
      lastSlotPollSuccessAt != null && now - lastSlotPollSuccessAt < 5_000

    if (!pollFresh) {
      return {
        badge: 'Reconnecting',
        detail: lastSlotPollErrorAt == null ? 'Polling…' : 'RPC errors; backing off',
      }
    }

    if (wsFreshUi) {
      return { badge: 'OK', detail: 'WebSocket + polling healthy' }
    }

    if (wsStatus.state === 'disabled') {
      return {
        badge: 'Degraded',
        detail: wsStatus.lastError ?? 'WebSocket disabled; polling-only mode',
      }
    }

    if (wsStatus.state === 'connecting' || wsStatus.state === 'reconnecting') {
      return {
        badge: 'Degraded',
        detail: wsStatus.lastError ?? 'WebSocket reconnecting; polling-only mode',
      }
    }

    return {
      badge: 'Degraded',
      detail: wsStatus.lastError ?? 'WebSocket stale; polling-only mode',
    }
  }, [
    lastSlotPollErrorAt,
    lastSlotPollSuccessAt,
    now,
    wsFreshUi,
    wsStatus.lastError,
    wsStatus.state,
  ])

  return { slots, epochInfo, history, status }
}
