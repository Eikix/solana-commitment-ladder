export type RpcConfig = {
  httpUrl: string
  wsUrl: string
}

export type Commitment = 'processed' | 'confirmed' | 'finalized'

export type EpochInfo = {
  epoch: number
  slotIndex: number
  slotsInEpoch: number
}

export type HistorySample = {
  ts: number
  processed: number
  confirmed: number
  finalized: number
}

export type RpcBadge = 'OK' | 'Degraded' | 'Reconnecting'
