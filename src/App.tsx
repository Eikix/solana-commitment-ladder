import './App.css'
import { HistoryChart } from './components/HistoryChart'
import { RpcConfigPanel } from './components/RpcConfigPanel'
import { StatCard } from './components/StatCard'
import { StatusBadge } from './components/StatusBadge'
import { useCommitmentLadder } from './hooks/useCommitmentLadder'
import { useLocalStorageState } from './hooks/useLocalStorageState'
import type { RpcConfig } from './types'

const DEFAULT_RPC_CONFIG: RpcConfig = {
  httpUrl: 'https://api.devnet.solana.com',
  wsUrl: 'wss://api.devnet.solana.com',
}

const RPC_CONFIG_STORAGE_KEY = 'solana-commitment-ladder:rpc-config:v1'

function formatNumber(n: number | null): string {
  return n == null ? '—' : n.toLocaleString()
}

function hostnameFromUrl(url: string): string {
  try {
    return new URL(url).host
  } catch {
    return url
  }
}

function App() {
  const [rpcConfig, setRpcConfig, { reset: resetRpcConfig }] =
    useLocalStorageState<RpcConfig>(RPC_CONFIG_STORAGE_KEY, DEFAULT_RPC_CONFIG)

  const { epochInfo, history, slots, status } = useCommitmentLadder(
    rpcConfig.httpUrl,
    rpcConfig.wsUrl,
  )

  const gapProcessedConfirmed =
    slots.processed != null && slots.confirmed != null
      ? slots.processed - slots.confirmed
      : null

  const gapProcessedFinalized =
    slots.processed != null && slots.finalized != null
      ? slots.processed - slots.finalized
      : null

  return (
    <div className="page">
      <header className="header">
        <div>
          <h1 className="title">Solana Commitment Ladder</h1>
          <p className="subtitle">
            Visualizes processed / confirmed / finalized slot heads and their
            gaps in real time. Default: Devnet. No API keys.
          </p>
        </div>
      </header>

      <section className="panel">
        <RpcConfigPanel
          key={`${rpcConfig.httpUrl}|${rpcConfig.wsUrl}`}
          value={rpcConfig}
          onApply={setRpcConfig}
          onReset={() => {
            resetRpcConfig()
          }}
        />
      </section>

      <section className="cards">
        <StatCard label="RPC status" value={<StatusBadge status={status.badge} />}>
          <div className="muted">{status.detail}</div>
        </StatCard>

        <StatCard
          label="processed"
          value={formatNumber(slots.processed)}
          subtitle="head"
        />
        <StatCard
          label="confirmed"
          value={formatNumber(slots.confirmed)}
          subtitle="head"
        />
        <StatCard
          label="finalized"
          value={formatNumber(slots.finalized)}
          subtitle="head"
        />

        <StatCard
          label="gap1"
          value={formatNumber(gapProcessedConfirmed)}
          subtitle="processed - confirmed"
        />
        <StatCard
          label="gap2"
          value={formatNumber(gapProcessedFinalized)}
          subtitle="processed - finalized"
        />

        <StatCard
          label="epoch"
          value={epochInfo == null ? '—' : epochInfo.epoch.toLocaleString()}
        >
          <div className="muted">
            {epochInfo == null
              ? '—'
              : `slotIndex ${epochInfo.slotIndex.toLocaleString()} / ${epochInfo.slotsInEpoch.toLocaleString()}`}
          </div>
        </StatCard>

        <StatCard label="RPC" value={hostnameFromUrl(rpcConfig.httpUrl)}>
          <div className="muted mono">{rpcConfig.httpUrl}</div>
        </StatCard>
      </section>

      <section className="chartSection">
        <h2 className="sectionTitle">Slot heads (recent)</h2>
        <HistoryChart samples={history} />
      </section>
    </div>
  )
}

export default App
