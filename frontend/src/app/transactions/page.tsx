'use client'

import { useEffect, useState, useCallback } from 'react'
import { getRecentTransactions } from '@/lib/api'
import type { RecentTransaction, TransactionStatus } from '@/types'
import clsx from 'clsx'

function StatusBadge({ status }: { status: TransactionStatus }) {
  const styles: Record<TransactionStatus, string> = {
    VALID: 'bg-green-500/20 text-green-400 border-green-500/30',
    REJECTED: 'bg-red-500/20 text-red-400 border-red-500/30',
    HIGH_VALUE: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    NORMALISED: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    UNKNOWN_TYPE: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  }
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        styles[status] ?? 'bg-slate-500/20 text-slate-400 border-slate-500/30'
      )}
    >
      {status}
    </span>
  )
}

function truncate(str: string, len = 12): string {
  if (str.length <= len) return str
  return `${str.slice(0, len)}…`
}

function formatTime(ts: string): string {
  try {
    return new Date(ts).toLocaleTimeString()
  } catch {
    return ts
  }
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<RecentTransaction[]>([])
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const data = await getRecentTransactions()
      setTransactions(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions')
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 2000)
    return () => clearInterval(interval)
  }, [fetchData])

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Recent Transactions</h1>
          <p className="text-slate-400 text-sm mt-1">Last transactions processed by the pipeline — polling every 2s</p>
        </div>
        <div className="flex items-center gap-4">
          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
          )}
          <span className="text-xs text-slate-500">{transactions.length} records</span>
          <div className="flex items-center gap-1.5 text-sm text-slate-500">
            <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            Live
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800/50">
              <tr>
                {['Time', 'Transaction ID', 'Account', 'Type', 'Amount', 'Currency', 'Country', 'Status'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-600 text-sm">
                    {error ? 'Error loading transactions' : 'No transactions yet'}
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr
                    key={tx.transactionId}
                    className="bg-slate-800 hover:bg-slate-700/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap font-mono">
                      {formatTime(tx.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-slate-400 whitespace-nowrap">
                      <span title={tx.transactionId}>{truncate(tx.transactionId, 14)}</span>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-slate-400 whitespace-nowrap">
                      {truncate(tx.accountId, 12)}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-300 whitespace-nowrap">
                      <span className="inline-flex items-center rounded-full bg-slate-700 px-2 py-0.5 text-xs">
                        {tx.transactionType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-200 text-right font-mono whitespace-nowrap">
                      {tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-blue-400 whitespace-nowrap">
                      {tx.currency}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                      {tx.countryName ?? tx.countryCode}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge status={tx.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
