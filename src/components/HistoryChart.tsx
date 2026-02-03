import type { HistorySample } from '../types'

type LaneKey = 'processed' | 'confirmed' | 'finalized'

type Lane = {
  key: LaneKey
  label: string
  color: string
}

const LANES: Lane[] = [
  { key: 'processed', label: 'processed', color: '#a78bfa' },
  { key: 'confirmed', label: 'confirmed', color: '#60a5fa' },
  { key: 'finalized', label: 'finalized', color: '#34d399' },
]

function stepPath(
  values: number[],
  width: number,
  laneTop: number,
  laneHeight: number,
): string {
  const n = values.length
  if (n === 0) return ''

  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = Math.max(1, max - min)

  const padY = 10

  const yFor = (value: number) => {
    const normalized = (value - min) / range
    const usable = laneHeight - padY * 2
    return laneTop + padY + (1 - normalized) * usable
  }

  const xFor = (i: number) => {
    if (n === 1) return 0
    return (i / (n - 1)) * width
  }

  let d = ''
  let prevY = yFor(values[0])
  d += `M ${xFor(0).toFixed(2)} ${prevY.toFixed(2)}`

  for (let i = 1; i < n; i += 1) {
    const x = xFor(i)
    const y = yFor(values[i])
    d += ` L ${x.toFixed(2)} ${prevY.toFixed(2)} L ${x.toFixed(2)} ${y.toFixed(2)}`
    prevY = y
  }

  return d
}

export function HistoryChart({ samples }: { samples: HistorySample[] }) {
  const width = 960
  const height = 240
  const laneHeight = height / LANES.length

  if (samples.length < 2) {
    return <div className="muted">Waiting for samples…</div>
  }

  const valuesForLane = (key: LaneKey) => samples.map((s) => s[key])

  return (
    <div>
      <div className="chartWrap">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width="100%"
          height="240"
          role="img"
          aria-label="Recent slot heads by commitment"
        >
          {LANES.map((lane, i) => {
            const top = i * laneHeight
            const values = valuesForLane(lane.key)
            const d = stepPath(values, width, top, laneHeight)
            const labelY = top + 16

            return (
              <g key={lane.key}>
                <rect
                  x="0"
                  y={top}
                  width={width}
                  height={laneHeight}
                  fill="transparent"
                />
                {i === 0 ? null : (
                  <line
                    x1="0"
                    y1={top}
                    x2={width}
                    y2={top}
                    stroke="currentColor"
                    opacity="0.12"
                    strokeWidth="1"
                  />
                )}
                <text
                  x="12"
                  y={labelY}
                  fontSize="12"
                  fill="currentColor"
                  opacity="0.66"
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace"
                >
                  {lane.label}
                </text>
                <path
                  d={d}
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
}
