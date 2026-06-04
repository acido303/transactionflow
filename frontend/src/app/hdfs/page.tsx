'use client'

import { useEffect, useState, useCallback } from 'react'
import { Database, FolderOpen, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { getHdfsStatus } from '@/lib/api'
import type { HdfsStatus } from '@/types'


function formatTime(ts?: string | null): string {
  if (!ts) return '—'
  try { return new Date(ts).toLocaleString() } catch { return ts }
}

function StatRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-slate-700/50 last:border-0">
      <span className="text-xs text-slate-500">{label}</span>
      <span className={`text-xs ${mono ? 'font-mono text-blue-400' : 'text-slate-200 font-medium'}`}>
        {value}
      </span>
    </div>
  )
}

interface PathCardProps {
  title: string
  description: string
  path: string
  fileCount: number
  lastWrite?: string | null
  statusText?: string
  accent: string
  iconColor: string
}

function PathCard({ title, description, path, fileCount, lastWrite, statusText, accent, iconColor }: PathCardProps) {
  return (
    <div className={`rounded-lg border ${accent} bg-slate-800 p-5`}>
      <div className="flex items-start gap-3 mb-4">
        <div className={`p-2 rounded-lg bg-slate-700/50 flex-shrink-0 ${iconColor}`}>
          <FolderOpen className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-200">{title}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        </div>
      </div>

      <div className="space-y-0">
        <StatRow label="HDFS Path" value={path} mono />
        <StatRow label="Files written" value={fileCount.toLocaleString()} />
        {statusText && <StatRow label="Status" value={statusText} />}
        {lastWrite && <StatRow label="Last write" value={formatTime(lastWrite)} />}
      </div>
    </div>
  )
}

export default function HdfsPage() {
  const [status, setStatus] = useState<HdfsStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const data = await getHdfsStatus()
      setStatus(data)
      setLastRefresh(new Date())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch HDFS status')
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [fetchData])

  const isRunning = status?.hdfsStatus === 'RUNNING'

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Database className="h-6 w-6 text-slate-300" />
            <h1 className="text-2xl font-bold text-slate-100">HDFS Storage</h1>
          </div>
          <p className="text-slate-400 text-sm mt-1 ml-9">
            Hadoop distributed file system status — polling every 10s
          </p>
        </div>
        <div className="flex items-center gap-4">
          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Clock className="h-3.5 w-3.5" />
            <span>
              {lastRefresh ? `Updated ${lastRefresh.toLocaleTimeString()}` : 'Loading…'}
            </span>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-1.5 rounded border border-slate-600 bg-slate-800 px-2.5 py-1.5 text-xs text-slate-300 hover:bg-slate-700 transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            Refresh
          </button>
        </div>
      </div>

      {/* Status banner */}
      <div className={`rounded-lg border p-4 flex items-center justify-between ${
        isRunning
          ? 'border-green-500/20 bg-green-500/5'
          : 'border-amber-500/20 bg-amber-500/5'
      }`}>
        <div className="flex items-center gap-3">
          {isRunning ? (
            <CheckCircle className="h-5 w-5 text-green-400" />
          ) : (
            <XCircle className="h-5 w-5 text-amber-400" />
          )}
          <div>
            <p className={`font-medium text-sm ${isRunning ? 'text-green-400' : 'text-amber-400'}`}>
              {isRunning ? 'HDFS is active — Spark is writing data' : 'Waiting for Spark to write first batch'}
            </p>
            {status?.namenodeUrl && (
              <p className="text-xs text-slate-500 mt-0.5 font-mono">{status.namenodeUrl}</p>
            )}
          </div>
        </div>
        {status && (
          <div className="text-right text-xs text-slate-500 space-y-0.5">
            <p>Batch #{status.lastBatchId ?? '—'}</p>
            <p>Checkpoint: <span className={status.checkpointStatus === 'ACTIVE' ? 'text-green-400' : 'text-slate-400'}>
              {status.checkpointStatus ?? '—'}
            </span></p>
          </div>
        )}
      </div>

      {/* Path cards */}
      {status ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <PathCard
            title="Raw Transactions"
            description="Valid transactions stored as partitioned Parquet"
            path={status.rawPath}
            fileCount={status.rawFilesWritten ?? 0}
            lastWrite={status.lastRecordedAt}
            accent="border-blue-500/20"
            iconColor="text-blue-400"
          />
          <PathCard
            title="Rejected Transactions"
            description="Invalid records stored as JSON for audit"
            path={status.rejectedPath}
            fileCount={status.rejectedFilesWritten ?? 0}
            lastWrite={status.lastRecordedAt}
            accent="border-red-500/20"
            iconColor="text-red-400"
          />
          <PathCard
            title="Checkpoints"
            description="Spark Structured Streaming recovery data"
            path={status.checkpointPath}
            fileCount={0}
            statusText={status.checkpointStatus ?? '—'}
            lastWrite={status.lastRecordedAt}
            accent="border-purple-500/20"
            iconColor="text-purple-400"
          />
        </div>
      ) : (
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-12 text-center text-slate-500 text-sm">
          {error ? error : 'Loading HDFS status…'}
        </div>
      )}

      {/* HDFS paths reference */}
      {status && (
        <section>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
            HDFS Path Reference
          </h2>
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-4 space-y-2">
            {[
              { label: 'Raw',         path: status.rawPath },
              { label: 'Rejected',    path: status.rejectedPath },
              { label: 'Checkpoints', path: status.checkpointPath },
            ].map(({ label, path }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="text-xs text-slate-500 w-24 flex-shrink-0">{label}</span>
                <code className="text-xs font-mono text-blue-400 bg-slate-900 rounded px-2 py-1 flex-1 break-all">
                  {path}
                </code>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
