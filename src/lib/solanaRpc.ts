import type { Commitment, EpochInfo } from '../types'

type JsonRpcError = {
  code: number
  message: string
  data?: unknown
}

type JsonRpcSuccess<T> = {
  jsonrpc: '2.0'
  id: number
  result: T
}

type JsonRpcFailure = {
  jsonrpc: '2.0'
  id: number
  error: JsonRpcError
}

type JsonRpcResponse<T> = JsonRpcSuccess<T> | JsonRpcFailure

let nextRpcId = 1

export async function rpcRequest<T>(
  httpUrl: string,
  method: string,
  params: unknown[] = [],
  signal?: AbortSignal,
): Promise<T> {
  const id = nextRpcId++

  const res = await fetch(httpUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id, method, params }),
    signal,
  })

  if (!res.ok) {
    throw new Error(`RPC HTTP error: ${res.status} ${res.statusText}`)
  }

  const payload = (await res.json()) as JsonRpcResponse<T>

  if ('error' in payload) {
    throw new Error(payload.error.message || 'RPC error')
  }

  return payload.result
}

export async function getSlot(
  httpUrl: string,
  commitment: Commitment,
  signal?: AbortSignal,
): Promise<number> {
  return rpcRequest<number>(httpUrl, 'getSlot', [{ commitment }], signal)
}

export async function getEpochInfo(
  httpUrl: string,
  commitment: Commitment = 'processed',
  signal?: AbortSignal,
): Promise<EpochInfo> {
  const info = await rpcRequest<EpochInfo>(
    httpUrl,
    'getEpochInfo',
    [{ commitment }],
    signal,
  )

  return {
    epoch: info.epoch,
    slotIndex: info.slotIndex,
    slotsInEpoch: info.slotsInEpoch,
  }
}
