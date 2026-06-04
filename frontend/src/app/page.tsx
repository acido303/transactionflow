'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Activity,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Network,
  Map,
  Server,
  Database,
  Cpu,
  Globe,
  Layers,
} from 'lucide-react'
import StatusBadge from '@/components/StatusBadge'
import MetricCard from '@/components/MetricCard'
import { getPipelineFlow, getMetricsSummary } from '@/lib/api'
import type { PipelineFlowResponse, MetricsSummaryResponse } from '@/types'

const PIPELINE_COMPONENTS = [
  { key: 'producer', label: 'Producer', icon: Server },
  { key: 'kafka', label: 'Kafka', icon: Layers },
  { key: 'spark', label: 'Spark', icon: Cpu },
  { key: 'hdfs', label: 'HDFS', icon: Database },
  { key: 'postgresql', label: 'PostgreSQL', icon: Database },
  { key: 'reporting-api', label: 'Reporting API', icon: Globe },
]

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

function formatEur(n: number): string {
  if (n >= 1_000_000) return `€${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `€${(n / 1_000).toFixed(1)}K`
  return `€${n.toFixed(2)}`
}

export default function DashboardPage() {
  const [flow, setFlow] = useState<PipelineFlowResponse | null>(null)
  const [metrics, setMetrics] = useState<MetricsSummaryResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const [flowData, metricsData] = await Promise.all([
          getPipelineFlow(),
          getMetricsSummary(),
        ])
        setFlow(flowData)
        setMetrics(metricsData)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data')
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Pipeline Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Real-time data pipeline monitoring</p>
        </div>
        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            <AlertTriangle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
        {!error && (
          <div className="flex items-center gap-2 text-green-400 text-sm">
            <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            <span>Live — refreshing every 3s</span>
          </div>
        )}
      </div>

      {/* Pipeline Component Status */}
      <section>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Pipeline Components
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {PIPELINE_COMPONENTS.map(({ key, label, icon: Icon }) => {
            const comp = flow?.components?.[key]
            const status = comp?.status ?? 'UNKNOWN'
            return (
              <div
                key={key}
                className="rounded-lg border border-slate-700 bg-slate-800 p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-slate-700/50">
                      <Icon className="h-4 w-4 text-slate-300" />
                    </div>
                    <span className="text-sm font-medium text-slate-200">{label}</span>
                  </div>
                  <StatusBadge status={status} />
                </div>
                {comp && (
                  <div className="space-y-1">
                    {comp.messagesSent !== undefined && (
                      <p className="text-xs text-slate-500">
                        Sent: <span className="text-slate-300">{formatNumber(comp.messagesSent)}</span>
                      </p>
                    )}
                    {comp.messagesReceived !== undefined && (
                      <p className="text-xs text-slate-500">
                        Received: <span className="text-slate-300">{formatNumber(comp.messagesReceived)}</span>
                      </p>
                    )}
                    {comp.ratePerSecond !== undefined && (
                      <p className="text-xs text-slate-500">
                        Rate: <span className="text-slate-300">{comp.ratePerSecond.toFixed(1)}/s</span>
                      </p>
                    )}
                    {comp.details && (
                      <p className="text-xs text-slate-500 truncate">{comp.details}</p>
                    )}
                  </div>
                )}
                {!comp && (
                  <p className="text-xs text-slate-600">No data available</p>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* Summary Metrics */}
      <section>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Summary Metrics
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Total Transactions"
            value={metrics ? formatNumber(metrics.totalTransactions) : '—'}
            icon={<Activity className="h-5 w-5" />}
          />
          <MetricCard
            label="Rejected"
            value={metrics ? formatNumber(metrics.rejectedTransactions) : '—'}
            subLabel={metrics ? `${((metrics.rejectedTransactions / Math.max(metrics.totalTransactions, 1)) * 100).toFixed(1)}%` : undefined}
            icon={<AlertTriangle className="h-5 w-5" />}
            valueClassName="text-red-400"
          />
          <MetricCard
            label="High-Value"
            value={metrics ? formatNumber(metrics.highValueTransactions) : '—'}
            subLabel={metrics ? `${((metrics.highValueTransactions / Math.max(metrics.totalTransactions, 1)) * 100).toFixed(1)}%` : undefined}
            icon={<TrendingUp className="h-5 w-5" />}
            valueClassName="text-orange-400"
          />
          <MetricCard
            label="Total Amount (EUR)"
            value={metrics ? formatEur(metrics.totalAmountEur) : '—'}
            icon={<DollarSign className="h-5 w-5" />}
            valueClassName="text-blue-400"
          />
        </div>
      </section>

      {/* Quick Links */}
      <section>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Quick Navigation
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <Link
            href="/architecture"
            className="rounded-lg border border-slate-700 bg-slate-800 p-5 hover:border-blue-500/50 hover:bg-slate-700/50 transition-all group"
          >
            <div className="flex items-center gap-3 mb-2">
              <Network className="h-6 w-6 text-blue-400" />
              <span className="font-semibold text-slate-200">Architecture</span>
            </div>
            <p className="text-sm text-slate-400">
              Live data-flow diagram with animated edges showing real-time message throughput.
            </p>
          </Link>
          <Link
            href="/map"
            className="rounded-lg border border-slate-700 bg-slate-800 p-5 hover:border-blue-500/50 hover:bg-slate-700/50 transition-all group"
          >
            <div className="flex items-center gap-3 mb-2">
              <Map className="h-6 w-6 text-green-400" />
              <span className="font-semibold text-slate-200">World Map</span>
            </div>
            <p className="text-sm text-slate-400">
              Transaction activity heatmap by country with interactive tooltips and detail view.
            </p>
          </Link>
        </div>
      </section>
    </div>
  )
}
