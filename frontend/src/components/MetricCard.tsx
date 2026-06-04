'use client'

import clsx from 'clsx'
import type { ReactNode } from 'react'

interface MetricCardProps {
  label: string
  value: string | number
  subLabel?: string
  icon?: ReactNode
  className?: string
  valueClassName?: string
}

export default function MetricCard({
  label,
  value,
  subLabel,
  icon,
  className,
  valueClassName,
}: MetricCardProps) {
  return (
    <div
      className={clsx(
        'rounded-lg border border-slate-700 bg-slate-800 p-4 flex items-start gap-4',
        className
      )}
    >
      {icon && (
        <div className="flex-shrink-0 p-2 rounded-lg bg-slate-700/50 text-slate-300">
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-400 truncate">{label}</p>
        <p className={clsx('text-2xl font-bold text-slate-100 mt-0.5', valueClassName)}>
          {value}
        </p>
        {subLabel && (
          <p className="text-xs text-slate-500 mt-1">{subLabel}</p>
        )}
      </div>
    </div>
  )
}
