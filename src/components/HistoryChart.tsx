import { memo, useMemo } from 'react'
import type { HistorySample } from '../types'

type LaneKey = 'processed' | 'confirmed' | 'finalized'

type Lane = {
  key: LaneKey
  label: string
  color: string
}

type Props = {
  samples: HistorySample[]
}

const LANES: Lane[] = [
  { key: 'processed', label: 'processed', color: '#a78bfa' },
  { key: 'confirmed', label: 'confirmed', color: '#60a5fa' },
  { key: 'finalized', label: 'finalized', color: '#34d399' },
]

const CHART_WIDTH = 960
const CHART_HEIGHT = 240
const LANE_HEIGHT = CHART_HEIGHT / LANES.length
const PAD_Y = 10

function minMax(values: number[]): { min: number; max: number } {
  let min = values[0]
  let max = values[0]

  for (let i = 1; i < values.length; i += 1) {
    const v = values[i]
    if (v < min) min = v
    if (v > max) max = v
  }

  return { min, max }
}

function stepPath(
  values: number[],
  width: number,
  laneTop: number,
  laneHeight: number,
): string {
  const n = values.length
  if (n === 0) return ''

  const { min, max } = minMax(values)
  const range = Math.max(1, max - min)
  const usable = laneHeight - PAD_Y * 2

  const yFor = (value: number) => {
    const normalized = (value - min) / range
    return laneTop + PAD_Y + (1 - normalized) * usable
  }

  const xFor = (i: number) => {
    if (n === 1) return 0
    return (i / (n - 1)) * width
  }

  let d = ''
  let prevY = yFor(values[0])
  d += `M ${xFor(0).toFixed(1)} ${prevY.toFixed(1)}`

  for (let i = 1; i < n; i += 1) {
    const x = xFor(i)
    const y = yFor(values[i])
    d += ` L ${x.toFixed(1)} ${prevY.toFixed(1)} L ${x.toFixed(1)} ${y.toFixed(1)}`
    prevY = y
  }

  return d
}

export const HistoryChart = memo(function HistoryChart({ samples }: Props) {
  const computed = useMemo(() => {
    const n = samples.length
    if (n < 2) return null

    const processed: number[] = new Array(n)
    const confirmed: number[] = new Array(n)
    const finalized: number[] = new Array(n)

    for (let i = 0; i < n; i += 1) {
      const sample = samples[i]
      processed[i] = sample.processed
      confirmed[i] = sample.confirmed
      finalized[i] = sample.finalized
    }

    const byKey: Record<LaneKey, number[]> = {
      processed,
      confirmed,
      finalized,
    }

    return LANES.map((lane, i) => {
      const top = i * LANE_HEIGHT
      return {
        ...lane,
        top,
        labelY: top + 16,
        d: stepPath(byKey[lane.key], CHART_WIDTH, top, LANE_HEIGHT),
      }
    })
  }, [samples])

  if (computed == null) return <div className="muted">Waiting for samples…</div>

  return (
    <div>
      <div className="chartWrap">
        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          width="100%"
          height="240"
          role="img"
          aria-label="Recent slot heads by commitment"
        >
          {computed.map((lane, i) => {
            return (
              <g key={lane.key}>
                <rect
                  x="0"
                  y={lane.top}
                  width={CHART_WIDTH}
                  height={LANE_HEIGHT}
                  fill="transparent"
                />
                {i === 0 ? null : (
                  <line
                    x1="0"
                    y1={lane.top}
                    x2={CHART_WIDTH}
                    y2={lane.top}
                    stroke="currentColor"
                    opacity="0.12"
                    strokeWidth="1"
                  />
                )}
                <text
                  x="12"
                  y={lane.labelY}
                  fontSize="12"
                  fill="currentColor"
                  opacity="0.66"
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace"
                >
                  {lane.label}
                </text>
                <path
                  d={lane.d}
                  fill="none"
                  stroke={lane.color}
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            )
          })}
        </svg>
      </div>

      <div className="chartLegend">
        {LANES.map((lane) => (
          <div key={lane.key} className="legendItem">
            <span className="legendSwatch" style={{ background: lane.color }} />
            <span>{lane.label}</span>
          </div>
        ))}
        <div style={{ marginLeft: 'auto' }}>
          samples: {samples.length.toLocaleString()} (ring buffer)
        </div>
      </div>
    </div>
  )
})
