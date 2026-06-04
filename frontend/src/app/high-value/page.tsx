'use client'

import { useEffect, useState, useCallback } from 'react'
import { TrendingUp } from 'lucide-react'
import { getHighValueTransactions } from '@/lib/api'
import type { HighValueTransaction } from '@/types'

function truncate(str: string, len = 14): string {
  if (str.length <= len) return str
  return `${str.slice(0, len)}…`
}

function formatTime(ts: string): string {
  try {
    return new Date(ts).toLocaleString()
  } catch {
    return ts
  }
}

export default function HighValuePage() {
  const [transactions, setTransactions] = useState<HighValueTransaction[]>([])
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const data = await getHighValueTransactions()
      setTransactions(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch high-value transactions')
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [fetchData])

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <TrendingUp className="h-6 w-6 text-orange-400" />
            <h1 className="text-2xl font-bold text-slate-100">High-Value Transactions</h1>
          </div>
          <p className="text-slate-400 text-sm mt-1 ml-9">Transactions flagged as high-value — polling every 5s</p>
        </div>
        <div className="flex items-center gap-4">
          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
          )}
          <span className="text-xs text-slate-500">{transactions.length} records</span>
          <div className="flex items-center gap-1.5 text-sm text-slate-500">
            <span className="h-2 w-2 rounded-full bg-orange-400 animate-pulse" />
            Live
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-orange-500/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-orange-500/10">
              <tr>
                {['Detected At', 'Transaction ID', 'Account', 'Customer', 'Amount', 'Currency', 'Type', 'Merchant', 'Country'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-orange-400/80 uppercase tracking-wider whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-600 text-sm">
                    {error ? 'Error loading data' : 'No high-value transactions detected'}
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr
                    key={tx.transactionId}
                    className="bg-slate-800 hover:bg-orange-500/5 transition-colors"
                  >
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap font-mono">
                      {formatTime(tx.detectedAt)}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-slate-400 whitespace-nowrap">
                      <span title={tx.transactionId}>{truncate(tx.transactionId)}</span>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-slate-400 whitespace-nowrap">
                      {truncate(tx.accountId, 12)}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                      {tx.customerId ? truncate(tx.customerId, 12) : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-orange-400 text-right font-mono whitespace-nowrap">
                      {tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {tx.currency}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-blue-400 whitespace-nowrap">
                      {tx.currency}
                    </td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap">
                      <span className="inline-flex items-center rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-300">
                        {tx.transactionType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                      {tx.merchant ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                      {tx.countryName ?? tx.countryCode}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETECTED badge legend */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center rounded-full border border-orange-500/30 bg-orange-500/20 px-2.5 py-0.5 text-xs font-medium text-orange-400">
          DETECTED
        </span>
        <span className="text-xs text-slate-500">
          Transactions flagged by Spark streaming job for amounts exceeding the high-value threshold
        </span>
      </div>
    </div>
  )
}
