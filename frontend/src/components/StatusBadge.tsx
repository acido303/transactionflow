'use client'

import clsx from 'clsx'

type Status = 'RUNNING' | 'OK' | 'ACTIVE' | 'STARTING' | 'ERROR' | 'STOPPED' | 'UNKNOWN' | string

interface StatusBadgeProps {
  status: Status
  className?: string
}

const statusStyles: Record<string, string> = {
  RUNNING: 'bg-green-500/20 text-green-400 border-green-500/30',
  OK: 'bg-green-500/20 text-green-400 border-green-500/30',
  ACTIVE: 'bg-green-500/20 text-green-400 border-green-500/30',
  STARTING: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  ERROR: 'bg-red-500/20 text-red-400 border-red-500/30',
  STOPPED: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  UNKNOWN: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const style = statusStyles[status] ?? 'bg-slate-500/20 text-slate-400 border-slate-500/30'

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        style,
        className
      )}
    >
      <span
        className={clsx('h-1.5 w-1.5 rounded-full', {
          'bg-green-400 animate-pulse': status === 'RUNNING' || status === 'OK' || status === 'ACTIVE',
          'bg-yellow-400 animate-pulse': status === 'STARTING',
          'bg-red-400': status === 'ERROR',
          'bg-slate-400': status === 'STOPPED' || status === 'UNKNOWN',
        })}
      />
      {status}
    </span>
  )
}
