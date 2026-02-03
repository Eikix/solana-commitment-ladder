import type { ReactNode } from 'react'

type Props = {
  label: string
  value: ReactNode
  subtitle?: string
  children?: ReactNode
}

export function StatCard({ label, value, subtitle, children }: Props) {
  return (
    <div className="card">
      <div className="cardHeader">
        <div className="cardLabel">{label}</div>
      </div>
      <div className="cardValue">{value}</div>
      {subtitle == null ? null : <div className="cardSubtitle">{subtitle}</div>}
      {children == null ? null : <div className="cardSubtitle">{children}</div>}
    </div>
  )
}
