'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Play,
  Square,
  Zap,
  AlertTriangle,
  TrendingUp,
  HelpCircle,
  Shuffle,
} from 'lucide-react'
import {
  startGenerator,
  stopGenerator,
  getGeneratorStatus,
  generateOne,
  generateBurst,
} from '@/lib/api'
import type { GeneratorStatus } from '@/types'
import StatusBadge from '@/components/StatusBadge'

function NumberInput({
  label,
  value,
  onChange,
  min,
  max,
  step,
  suffix,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
  suffix?: string
}) {
  return (
    <div>
      <label className="block text-xs text-slate-400 mb-1">{label}</label>
      <div className="flex items-center">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          min={min}
          max={max}
          step={step ?? 1}
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
        {suffix && <span className="ml-2 text-xs text-slate-500 whitespace-nowrap">{suffix}</span>}
      </div>
    </div>
  )
}

export default function GeneratorPage() {
  const [status, setStatus] = useState<GeneratorStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [actionMsg, setActionMsg] = useState<string | null>(null)

  // Continuous generator config
  const [eventsPerSecond, setEventsPerSecond] = useState(5)
  const [invalidPct, setInvalidPct] = useState(10)
  const [highValuePct, setHighValuePct] = useState(5)
  const [unknownTypePct, setUnknownTypePct] = useState(3)

  // Burst config
  const [burstCount, setBurstCount] = useState(50)
  const [burstInvalidPct, setBurstInvalidPct] = useState(10)
  const [burstHighValuePct, setBurstHighValuePct] = useState(5)
  const [burstUnknownTypePct, setBurstUnknownTypePct] = useState(3)

  const fetchStatus = useCallback(async () => {
    try {
      const s = await getGeneratorStatus()
      setStatus(s)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch status')
    }
  }, [])

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 2000)
    return () => clearInterval(interval)
  }, [fetchStatus])

  function showMsg(msg: string) {
    setActionMsg(msg)
    setTimeout(() => setActionMsg(null), 3000)
  }

  async function handleStart() {
    try {
      await startGenerator({ eventsPerSecond, invalidPercentage: invalidPct, highValuePercentage: highValuePct, unknownTypePercentage: unknownTypePct })
      showMsg('Generator started')
      fetchStatus()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start generator')
    }
  }

  async function handleStop() {
    try {
      await stopGenerator()
      showMsg('Generator stopped')
      fetchStatus()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop generator')
    }
  }

  async function handleGenerateOne(type: 'random' | 'invalid' | 'high-value' | 'unknown-type') {
    try {
      await generateOne(type)
      showMsg(`Generated 1 ${type} transaction`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate transaction')
    }
  }

  async function handleBurst() {
    try {
      await generateBurst({
        numberOfEvents: burstCount,
        invalidPercentage: burstInvalidPct,
        highValuePercentage: burstHighValuePct,
        unknownTypePercentage: burstUnknownTypePct,
      })
      showMsg(`Burst of ${burstCount} transactions sent`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send burst')
    }
  }

  const isRunning = status?.running ?? false

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Data Generator</h1>
        <p className="text-slate-400 text-sm mt-1">Control the transaction event producer</p>
      </div>

      {/* Status bar */}
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-xs text-slate-500 mb-1">Status</p>
            <StatusBadge status={isRunning ? 'RUNNING' : 'STOPPED'} />
          </div>
          {status?.messagesSent !== undefined && (
            <div>
              <p className="text-xs text-slate-500 mb-1">Messages Sent</p>
              <p className="text-sm font-semibold text-slate-200">{status.messagesSent.toLocaleString()}</p>
            </div>
          )}
          {status?.ratePerSecond !== undefined && (
            <div>
              <p className="text-xs text-slate-500 mb-1">Rate</p>
              <p className="text-sm font-semibold text-slate-200">{status.ratePerSecond.toFixed(1)}/s</p>
            </div>
          )}
        </div>
        {(error || actionMsg) && (
          <p className={`text-sm ${error ? 'text-red-400' : 'text-green-400'}`}>
            {error || actionMsg}
          </p>
        )}
      </div>

      {/* Continuous generator */}
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-5 space-y-4">
        <h2 className="font-semibold text-slate-200">Continuous Generator</h2>
        <div className="grid grid-cols-2 gap-4">
          <NumberInput label="Events per second" value={eventsPerSecond} onChange={setEventsPerSecond} min={1} max={1000} />
          <NumberInput label="Invalid %" value={invalidPct} onChange={setInvalidPct} min={0} max={100} suffix="%" />
          <NumberInput label="High-Value %" value={highValuePct} onChange={setHighValuePct} min={0} max={100} suffix="%" />
          <NumberInput label="Unknown Type %" value={unknownTypePct} onChange={setUnknownTypePct} min={0} max={100} suffix="%" />
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleStart}
            disabled={isRunning}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Play className="h-4 w-4" />
            Start Generator
          </button>
          <button
            onClick={handleStop}
            disabled={!isRunning}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Square className="h-4 w-4" />
            Stop Generator
          </button>
        </div>
      </div>

      {/* Individual generate */}
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-5 space-y-4">
        <h2 className="font-semibold text-slate-200">Generate Single Transaction</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleGenerateOne('random')}
            className="flex items-center gap-2 px-4 py-3 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 text-sm hover:bg-blue-600/30 transition-colors"
          >
            <Shuffle className="h-4 w-4" />
            Generate Random
          </button>
          <button
            onClick={() => handleGenerateOne('invalid')}
            className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-600/20 border border-red-500/30 text-red-400 text-sm hover:bg-red-600/30 transition-colors"
          >
            <AlertTriangle className="h-4 w-4" />
            Generate Invalid
          </button>
          <button
            onClick={() => handleGenerateOne('high-value')}
            className="flex items-center gap-2 px-4 py-3 rounded-lg bg-orange-600/20 border border-orange-500/30 text-orange-400 text-sm hover:bg-orange-600/30 transition-colors"
          >
            <TrendingUp className="h-4 w-4" />
            Generate High-Value
          </button>
          <button
            onClick={() => handleGenerateOne('unknown-type')}
            className="flex items-center gap-2 px-4 py-3 rounded-lg bg-yellow-600/20 border border-yellow-500/30 text-yellow-400 text-sm hover:bg-yellow-600/30 transition-colors"
          >
            <HelpCircle className="h-4 w-4" />
            Generate Unknown Type
          </button>
        </div>
      </div>

      {/* Burst */}
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-5 space-y-4">
        <h2 className="font-semibold text-slate-200">Burst</h2>
        <div className="grid grid-cols-2 gap-4">
          <NumberInput label="Number of events" value={burstCount} onChange={setBurstCount} min={1} max={10000} />
          <NumberInput label="Invalid %" value={burstInvalidPct} onChange={setBurstInvalidPct} min={0} max={100} suffix="%" />
          <NumberInput label="High-Value %" value={burstHighValuePct} onChange={setBurstHighValuePct} min={0} max={100} suffix="%" />
          <NumberInput label="Unknown Type %" value={burstUnknownTypePct} onChange={setBurstUnknownTypePct} min={0} max={100} suffix="%" />
        </div>
        <button
          onClick={handleBurst}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-500 transition-colors"
        >
          <Zap className="h-4 w-4" />
          Generate Burst
        </button>
      </div>
    </div>
  )
}
