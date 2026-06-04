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
  Plus,
  X,
  Store,
  Globe,
  Tag,
} from 'lucide-react'
import {
  startGenerator,
  stopGenerator,
  getGeneratorStatus,
  generateOne,
  generateBurst,
  getGeneratorConfig,
  addMerchant,
  removeMerchant,
  addCountry,
  removeCountry,
  addUnknownType,
  removeUnknownType,
} from '@/lib/api'
import type { GeneratorStatus, GeneratorConfigData } from '@/types'
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

function ListEditor({
  title,
  description,
  icon,
  items,
  onAdd,
  onRemove,
  placeholder,
  accentColor,
}: {
  title: string
  description: string
  icon: React.ReactNode
  items: string[]
  onAdd: (value: string) => Promise<void>
  onRemove: (value: string) => Promise<void>
  placeholder: string
  accentColor: string
}) {
  const [newValue, setNewValue] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleAdd() {
    if (!newValue.trim() || busy) return
    setBusy(true)
    try {
      await onAdd(newValue.trim())
      setNewValue('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <span className={accentColor}>{icon}</span>
        <div>
          <h3 className="font-semibold text-slate-200">{title}</h3>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
        <span className="ml-auto text-xs text-slate-500">{items.length} items</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className="inline-flex items-center gap-1.5 rounded-full bg-slate-700 px-3 py-1 text-xs text-slate-200"
          >
            {item}
            <button
              onClick={() => onRemove(item)}
              className="text-slate-400 hover:text-red-400 transition-colors"
              title="Remove"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        {items.length === 0 && <span className="text-xs text-slate-600 italic">No items</span>}
      </div>

      <div className="flex gap-2">
        <input
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder={placeholder}
          className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
        <button
          onClick={handleAdd}
          disabled={busy || !newValue.trim()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add
        </button>
      </div>
    </div>
  )
}

function CountryEditor({
  countries,
  onAdd,
  onRemove,
}: {
  countries: { code: string; name: string }[]
  onAdd: (code: string, name: string) => Promise<void>
  onRemove: (code: string) => Promise<void>
}) {
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleAdd() {
    if (!code.trim() || !name.trim() || busy) return
    setBusy(true)
    try {
      await onAdd(code.trim().toUpperCase(), name.trim())
      setCode('')
      setName('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-green-400"><Globe className="h-5 w-5" /></span>
        <div>
          <h3 className="font-semibold text-slate-200">Countries</h3>
          <p className="text-xs text-slate-500">ISO codes used for the world map activity</p>
        </div>
        <span className="ml-auto text-xs text-slate-500">{countries.length} items</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {countries.map((c) => (
          <span
            key={c.code}
            className="inline-flex items-center gap-1.5 rounded-full bg-slate-700 px-3 py-1 text-xs text-slate-200"
          >
            <span className="font-mono text-blue-400">{c.code}</span>
            {c.name}
            <button
              onClick={() => onRemove(c.code)}
              className="text-slate-400 hover:text-red-400 transition-colors"
              title="Remove"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        {countries.length === 0 && <span className="text-xs text-slate-600 italic">No countries</span>}
      </div>

      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Code (e.g. NZ)"
          maxLength={2}
          className="w-28 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 uppercase focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Country name (e.g. New Zealand)"
          className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
        <button
          onClick={handleAdd}
          disabled={busy || !code.trim() || !name.trim()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add
        </button>
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

  // Reference data config
  const [config, setConfig] = useState<GeneratorConfigData | null>(null)

  const fetchStatus = useCallback(async () => {
    try {
      const s = await getGeneratorStatus()
      setStatus(s)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch status')
    }
  }, [])

  const fetchConfig = useCallback(async () => {
    try {
      const c = await getGeneratorConfig()
      setConfig(c)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch config')
    }
  }, [])

  useEffect(() => {
    fetchStatus()
    fetchConfig()
    const interval = setInterval(fetchStatus, 2000)
    return () => clearInterval(interval)
  }, [fetchStatus, fetchConfig])

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

      {/* Reference data editors */}
      <div className="pt-2">
        <h2 className="text-lg font-semibold text-slate-100">Reference Data</h2>
        <p className="text-slate-400 text-sm mt-0.5 mb-4">
          Values the generator draws from when building transactions. Changes apply immediately.
        </p>

        <div className="space-y-4">
          {config && (
            <>
              <ListEditor
                title="Merchants"
                description="Used for CARD_PAYMENT transactions"
                icon={<Store className="h-5 w-5" />}
                accentColor="text-blue-400"
                items={config.merchants}
                placeholder="Add a merchant (e.g. IKEA)"
                onAdd={async (v) => setConfig(await addMerchant(v))}
                onRemove={async (v) => setConfig(await removeMerchant(v))}
              />

              <CountryEditor
                countries={config.countries}
                onAdd={async (code, name) => setConfig(await addCountry(code, name))}
                onRemove={async (code) => setConfig(await removeCountry(code))}
              />

              <ListEditor
                title="Unknown Transaction Types"
                description="Unsupported types normalised to UNKNOWN by Spark"
                icon={<Tag className="h-5 w-5" />}
                accentColor="text-yellow-400"
                items={config.unknownTypes}
                placeholder="Add a type (e.g. WISE_TRANSFER)"
                onAdd={async (v) => setConfig(await addUnknownType(v))}
                onRemove={async (v) => setConfig(await removeUnknownType(v))}
              />

              {/* Fixed lists — read only */}
              <div className="rounded-lg border border-slate-700 bg-slate-800 p-5 space-y-3">
                <h3 className="font-semibold text-slate-200">Fixed Values</h3>
                <p className="text-xs text-slate-500 -mt-2">
                  These are validated by the Spark pipeline and cannot be changed at runtime.
                </p>
                <div className="flex gap-8">
                  <div>
                    <p className="text-xs text-slate-500 mb-1.5">Currencies</p>
                    <div className="flex gap-2">
                      {config.currencies.map((c) => (
                        <span key={c} className="rounded-full bg-slate-700 px-3 py-1 text-xs font-mono text-blue-400">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1.5">Valid Transaction Types</p>
                    <div className="flex flex-wrap gap-2">
                      {config.validTypes.map((t) => (
                        <span key={t} className="rounded-full bg-slate-700 px-3 py-1 text-xs text-slate-300">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
          {!config && (
            <p className="text-sm text-slate-600">Loading reference data…</p>
          )}
        </div>
      </div>
    </div>
  )
}
