'use client'

import { useEffect, useState, useCallback } from 'react'
import { Database, FolderOpen, Clock, CheckCircle, XCircle } from 'lucide-react'
import { getHdfsStatus } from '@/lib/api'
import type { HdfsStatus, HdfsPathInfo } from '@/types'
import StatusBadge from '@/components/StatusBadge'

function formatBytes(bytes?: number): string {
  if (bytes === undefined) return '—'
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(2)} GB`
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(2)} MB`
  if (bytes >= 1_024) return `${(bytes / 1_024).toFixed(1)} KB`
  return `${bytes} B`
}

function formatTime(ts?: string): string {
  if (!ts) return '—'
  try {
    return new Date(ts).toLocaleString()
  } catch {
    return ts
  }
}

interface PathCardProps {
  title: string
  description: string
  icon: React.ReactNode
  info?: HdfsPathInfo
  accentColor?: string
}

function PathCard({ title, description, icon, info, accentColor = 'border-slate-700' }: PathCardProps) {
  return (
    <div className={`rounded-lg border ${accentColor} bg-slate-800 p-5`}>
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 rounded-lg bg-slate-700/50 text-slate-300 flex-shrink-0">
          {icon}
        </div>
        <div>
          <h3 className="font-semibold text-slate-200">{title}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        </div>
      </div>

      {info ? (
        <div className="space-y-3">
          {info.path && (
            <div>
              <p className="text-xs text-slate-500 mb-1">HDFS Path</p>
              <p className="text-xs font-mono text-blue-400 bg-slate-900 rounded px-2 py-1.5 break-all">
                {info.path}
              </p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            {info.fileCount !== undefined && (
              <div>
                <p className="text-xs text-slate-500">File Count</p>
                <p className="text-sm font-semibold text-slate-200 mt-0.5">{info.fileCount.toLocaleString()}</p>
              </div>
            )}
            {info.totalSize !== undefined && (
              <div>
                <p className="text-xs text-slate-500">Total Size</p>
                <p className="text-sm font-semibold text-slate-200 mt-0.5">{formatBytes(info.totalSize)}</p>
              </div>
            )}
          </div>
          {info.lastWrite && (
            <div>
              <p className="text-xs text-slate-500">Last Write</p>
              <p className="text-xs text-slate-300 mt-0.5">{formatTime(info.lastWrite)}</p>
            </div>
          )}
          {info.status && (
            <div>
              <p className="text-xs text-slate-500 mb-1">Status</p>
              <StatusBadge status={info.status as 'OK' | 'ERROR' | 'RUNNING'} />
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-slate-600">No data available</p>
      )}
    </div>
  )
}

export default function HdfsPage() {
  const [status, setStatus] = useState<HdfsStatus | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const data = await getHdfsStatus()
      setStatus(data)
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

  const isAvailable = status?.isAvailable ?? false

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Database className="h-6 w-6 text-slate-300" />
            <h1 className="text-2xl font-bold text-slate-100">HDFS Storage</h1>
          </div>
          <p className="text-slate-400 text-sm mt-1 ml-9">Hadoop distributed file system status — polling every 10s</p>
        </div>
        <div className="flex items-center gap-4">
          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
          )}
          <div className="flex items-center gap-2">
            {isAvailable ? (
              <CheckCircle className="h-4 w-4 text-green-400" />
            ) : (
              <XCircle className="h-4 w-4 text-red-400" />
            )}
            <span className={`text-sm ${isAvailable ? 'text-green-400' : 'text-red-400'}`}>
              {status ? (isAvailable ? 'Available' : 'Unavailable') : 'Checking…'}
            </span>
          </div>
        </div>
      </div>

      {/* Overall status banner */}
      <div className={`rounded-lg border p-4 flex items-center justify-between ${
        isAvailable
          ? 'border-green-500/20 bg-green-500/5'
          : 'border-red-500/20 bg-red-500/5'
      }`}>
        <div className="flex items-center gap-3">
          {isAvailable ? (
            <CheckCircle className="h-5 w-5 text-green-400" />
          ) : (
            <XCircle className="h-5 w-5 text-red-400" />
          )}
          <div>
            <p className={`font-medium text-sm ${isAvailable ? 'text-green-400' : 'text-red-400'}`}>
              HDFS {isAvailable ? 'is available and accepting writes' : 'is not available'}
            </p>
            {status?.lastCheckpoint && (
              <p className="text-xs text-slate-500 mt-0.5">
                Last checkpoint: {formatTime(status.lastCheckpoint)}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Clock className="h-3.5 w-3.5" />
          <span>Refreshes every 10s</span>
        </div>
      </div>

      {/* Path cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <PathCard
          title="Raw Transactions"
          description="All raw incoming transactions stored as Parquet"
          icon={<FolderOpen className="h-5 w-5" />}
          info={status?.raw}
          accentColor="border-blue-500/20"
        />
        <PathCard
          title="Rejected Transactions"
          description="Invalid and rejected transactions for audit"
          icon={<FolderOpen className="h-5 w-5" />}
          info={status?.rejected}
          accentColor="border-red-500/20"
        />
        <PathCard
          title="Checkpoints"
          description="Spark Structured Streaming checkpoint data"
          icon={<Database className="h-5 w-5" />}
          info={status?.checkpoints}
          accentColor="border-purple-500/20"
        />
      </div>

      {/* Checkpoint status */}
      {status?.lastCheckpoint && (
        <section>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Checkpoint Info</h2>
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <CheckCircle className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200">Last Successful Checkpoint</p>
                <p className="text-xs text-slate-500 mt-0.5">{formatTime(status.lastCheckpoint)}</p>
              </div>
              <div className="ml-auto">
                <StatusBadge status="OK" />
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
