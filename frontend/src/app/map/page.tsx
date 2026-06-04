'use client'

import { useEffect, useState, useCallback } from 'react'
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps'
import { getMapCountries } from '@/lib/api'
import type { CountryMapData } from '@/types'

type Metric = 'transactionCount' | 'totalAmount' | 'averageAmount' | 'highValueCount' | 'rejectedCount'

const METRIC_OPTIONS: { key: Metric; label: string }[] = [
  { key: 'transactionCount', label: 'Transaction Count' },
  { key: 'totalAmount', label: 'Total Amount (EUR)' },
  { key: 'averageAmount', label: 'Average Amount (EUR)' },
  { key: 'highValueCount', label: 'High-Value Count' },
  { key: 'rejectedCount', label: 'Rejected Count' },
]

function getColor(value: number, max: number): string {
  if (max === 0 || value === 0) return '#1e293b'
  const ratio = Math.min(value / max, 1)
  // Blue scale: low #1e40af → high #60a5fa
  const r = Math.round(30 + ratio * (96 - 30))
  const g = Math.round(64 + ratio * (165 - 64))
  const b = Math.round(175 + ratio * (250 - 175))
  return `rgb(${r},${g},${b})`
}

function formatValue(key: Metric, value: number): string {
  if (key === 'totalAmount' || key === 'averageAmount') {
    return `€${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
  }
  return value.toLocaleString()
}

interface TooltipData {
  x: number
  y: number
  country: CountryMapData
}

export default function MapPage() {
  const [countries, setCountries] = useState<CountryMapData[]>([])
  const [topology, setTopology] = useState<object | null>(null)
  const [topoError, setTopoError] = useState(false)
  const [metric, setMetric] = useState<Metric>('transactionCount')
  const [tooltip, setTooltip] = useState<TooltipData | null>(null)
  const [selected, setSelected] = useState<CountryMapData | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Load world topology
  useEffect(() => {
    async function loadTopo() {
      try {
        const res = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
        if (!res.ok) throw new Error('Failed to load map topology')
        const data = await res.json()
        setTopology(data)
      } catch {
        setTopoError(true)
      }
    }
    loadTopo()
  }, [])

  const fetchCountries = useCallback(async () => {
    try {
      const data = await getMapCountries()
      setCountries(data.countries)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch country data')
    }
  }, [])

  useEffect(() => {
    fetchCountries()
    const interval = setInterval(fetchCountries, 5000)
    return () => clearInterval(interval)
  }, [fetchCountries])

  const maxValue = Math.max(...countries.map((c) => c[metric] as number), 1)

  const countryMap = new Map(countries.map((c) => [c.countryCode, c]))

  return (
    <div className="p-6 h-screen flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Transaction Map</h1>
          <p className="text-slate-400 text-sm mt-1">Global transaction activity — polling every 5s</p>
        </div>
        {error && (
          <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
        )}
      </div>

      {/* Metric selector */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {METRIC_OPTIONS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setMetric(key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              metric === key
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-slate-800 border-slate-600 text-slate-400 hover:text-slate-200 hover:border-slate-500'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-1 gap-4 min-h-0">
        {/* Map */}
        <div className="flex-1 rounded-xl border border-slate-700 bg-slate-900 relative overflow-hidden">
          {topoError ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-slate-400 text-lg mb-2">Map data unavailable</p>
                <p className="text-slate-600 text-sm">Could not load world topology from CDN.</p>
              </div>
            </div>
          ) : !topology ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-slate-500 text-sm">Loading map...</p>
            </div>
          ) : (
            <ComposableMap
              projection="geoNaturalEarth1"
              style={{ width: '100%', height: '100%' }}
            >
              <ZoomableGroup>
                <Geographies geography={topology}>
                  {({ geographies }) =>
                    geographies.map((geo) => {
                      // ISO numeric to alpha-2 not available in this lib directly,
                      // so we match by name using countryName
                      const geoName: string = geo.properties?.name ?? ''
                      const countryData = countries.find(
                        (c) =>
                          c.countryName?.toLowerCase() === geoName.toLowerCase() ||
                          c.countryCode === geo.id
                      )
                      const value = countryData ? (countryData[metric] as number) : 0
                      const fill = getColor(value, maxValue)

                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill={fill}
                          stroke="#0f172a"
                          strokeWidth={0.5}
                          style={{
                            default: { outline: 'none' },
                            hover: { outline: 'none', fill: '#3b82f6', cursor: countryData ? 'pointer' : 'default' },
                            pressed: { outline: 'none' },
                          }}
                          onMouseEnter={(evt) => {
                            if (countryData) {
                              setTooltip({ x: evt.clientX, y: evt.clientY, country: countryData })
                            }
                          }}
                          onMouseMove={(evt) => {
                            if (tooltip) {
                              setTooltip((prev) => prev ? { ...prev, x: evt.clientX, y: evt.clientY } : null)
                            }
                          }}
                          onMouseLeave={() => setTooltip(null)}
                          onClick={() => {
                            if (countryData) setSelected(countryData)
                          }}
                        />
                      )
                    })
                  }
                </Geographies>
              </ZoomableGroup>
            </ComposableMap>
          )}

          {/* Tooltip */}
          {tooltip && (
            <div
              className="fixed z-50 pointer-events-none bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-xs shadow-xl"
              style={{ left: tooltip.x + 12, top: tooltip.y - 10 }}
            >
              <p className="font-semibold text-slate-100 mb-1">{tooltip.country.countryName}</p>
              <p className="text-slate-400">Transactions: <span className="text-slate-200">{tooltip.country.transactionCount.toLocaleString()}</span></p>
              <p className="text-slate-400">Total: <span className="text-slate-200">€{tooltip.country.totalAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></p>
              <p className="text-slate-400">High-Value: <span className="text-orange-400">{tooltip.country.highValueCount}</span></p>
              <p className="text-slate-400">Rejected: <span className="text-red-400">{tooltip.country.rejectedCount}</span></p>
            </div>
          )}

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-slate-800/80 backdrop-blur-sm border border-slate-700 rounded-lg p-3">
            <p className="text-xs text-slate-400 mb-2">{METRIC_OPTIONS.find((m) => m.key === metric)?.label}</p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">0</span>
              <div
                className="h-3 w-24 rounded"
                style={{
                  background: 'linear-gradient(to right, #1e293b, #1e40af, #60a5fa)',
                }}
              />
              <span className="text-xs text-slate-500">{formatValue(metric, maxValue)}</span>
            </div>
          </div>
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-72 flex-shrink-0 rounded-xl border border-slate-700 bg-slate-800 p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-slate-100">{selected.countryName}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{selected.countryCode}</p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-slate-500 hover:text-slate-300 transition-colors text-lg leading-none"
              >
                ×
              </button>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Transactions', value: selected.transactionCount.toLocaleString() },
                { label: 'Total Amount', value: `€${selected.totalAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}` },
                { label: 'Average Amount', value: `€${selected.averageAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}` },
                { label: 'High-Value', value: selected.highValueCount.toLocaleString() },
                { label: 'Rejected', value: selected.rejectedCount.toLocaleString() },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-xs text-slate-400">{label}</span>
                  <span className="text-xs font-medium text-slate-200">{value}</span>
                </div>
              ))}
              {selected.lastTransactionAt && (
                <div className="pt-2 border-t border-slate-700">
                  <p className="text-xs text-slate-500">Last transaction</p>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {new Date(selected.lastTransactionAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
