'use client'

import { useEffect, useState, useCallback } from 'react'
import { getMetricsByCurrency, getMetricsByType, getMetricsByCountry } from '@/lib/api'
import type { CurrencyMetrics, TypeMetrics, CountryMetrics } from '@/types'

function formatEur(n: number): string {
  if (n >= 1_000_000) return `€${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `€${(n / 1_000).toFixed(1)}K`
  return `€${n.toFixed(2)}`
}

function TableHeader({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
      {children}
    </th>
  )
}

function TableCell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={`px-4 py-3 text-sm text-slate-300 ${className ?? ''}`}>
      {children}
    </td>
  )
}

export default function MetricsPage() {
  const [currencies, setCurrencies] = useState<CurrencyMetrics[]>([])
  const [types, setTypes] = useState<TypeMetrics[]>([])
  const [countries, setCountries] = useState<CountryMetrics[]>([])
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const [cur, typ, cou] = await Promise.all([
        getMetricsByCurrency(),
        getMetricsByType(),
        getMetricsByCountry(),
      ])
      setCurrencies(cur)
      setTypes(typ)
      setCountries(cou)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics')
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [fetchData])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Metrics</h1>
          <p className="text-slate-400 text-sm mt-1">Breakdown by currency, type and country — polling every 5s</p>
        </div>
        {error && (
          <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
        )}
        {!error && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            Live
          </div>
        )}
      </div>

      {/* By Currency */}
      <section>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">By Currency</h2>
        <div className="rounded-lg border border-slate-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-800/50">
              <tr>
                <TableHeader>Currency</TableHeader>
                <TableHeader>Count</TableHeader>
                <TableHeader>Total Amount</TableHeader>
                <TableHeader>Average Amount</TableHeader>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {currencies.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-600 text-sm">No data available</td>
                </tr>
              ) : (
                currencies.map((row) => (
                  <tr key={row.currency} className="bg-slate-800 hover:bg-slate-700/50 transition-colors">
                    <TableCell>
                      <span className="font-mono font-semibold text-blue-400">{row.currency}</span>
                    </TableCell>
                    <TableCell>{row.transactionCount.toLocaleString()}</TableCell>
                    <TableCell>{formatEur(row.totalAmount)}</TableCell>
                    <TableCell>{formatEur(row.averageAmount)}</TableCell>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* By Type */}
      <section>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">By Transaction Type</h2>
        <div className="rounded-lg border border-slate-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-800/50">
              <tr>
                <TableHeader>Type</TableHeader>
                <TableHeader>Count</TableHeader>
                <TableHeader>Total Amount</TableHeader>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {types.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-slate-600 text-sm">No data available</td>
                </tr>
              ) : (
                types.map((row) => (
                  <tr key={row.transactionType} className="bg-slate-800 hover:bg-slate-700/50 transition-colors">
                    <TableCell>
                      <span className="inline-flex items-center rounded-full bg-slate-700 px-2.5 py-0.5 text-xs font-medium text-slate-300">
                        {row.transactionType}
                      </span>
                    </TableCell>
                    <TableCell>{row.transactionCount.toLocaleString()}</TableCell>
                    <TableCell>{formatEur(row.totalAmount)}</TableCell>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* By Country */}
      <section>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">By Country</h2>
        <div className="rounded-lg border border-slate-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-800/50">
              <tr>
                <TableHeader>Country</TableHeader>
                <TableHeader>Count</TableHeader>
                <TableHeader>Total Amount</TableHeader>
                <TableHeader>High-Value</TableHeader>
                <TableHeader>Rejected</TableHeader>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {countries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-600 text-sm">No data available</td>
                </tr>
              ) : (
                countries.map((row) => (
                  <tr key={row.countryCode} className="bg-slate-800 hover:bg-slate-700/50 transition-colors">
                    <TableCell>
                      <div>
                        <span className="text-slate-200">{row.countryName}</span>
                        <span className="ml-2 text-xs text-slate-500">{row.countryCode}</span>
                      </div>
                    </TableCell>
                    <TableCell>{row.transactionCount.toLocaleString()}</TableCell>
                    <TableCell>{formatEur(row.totalAmount)}</TableCell>
                    <TableCell>
                      <span className="text-orange-400">{row.highValueCount.toLocaleString()}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-red-400">{row.rejectedCount.toLocaleString()}</span>
                    </TableCell>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
