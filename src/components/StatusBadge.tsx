import type { RpcBadge } from '../types'

type Props = {
  status: RpcBadge
}

export function StatusBadge({ status }: Props) {
  const className =
    status === 'OK'
      ? 'badge badgeOk'
      : status === 'Degraded'
        ? 'badge badgeDegraded'
        : 'badge badgeReconnecting'

  return (
    <span className={className} title={status}>
      <span className="dot" aria-hidden="true" />
      {status}
    </span>
  )
}
