import { formatTimestamp } from '../../lib/format.js'

export default function Timestamp({ seconds, className = '' }) {
  return (
    <span className={`shrink-0 text-xs font-mono text-slate-400 tabular-nums ${className}`}>
      [{formatTimestamp(seconds)}]
    </span>
  )
}
