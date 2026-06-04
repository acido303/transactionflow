'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  Node,
  Edge,
  Background,
  Controls,
  BackgroundVariant,
  Handle,
  Position,
  NodeProps,
  useNodesState,
  useEdgesState,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { getPipelineFlow } from '@/lib/api'
import type { PipelineFlowResponse, ComponentStatus } from '@/types'
import StatusBadge from '@/components/StatusBadge'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatNum(n?: number): string {
  if (n === undefined || n === null) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

function formatTime(ts?: string | null): string {
  if (!ts) return '—'
  try {
    return new Date(ts).toLocaleTimeString()
  } catch {
    return ts
  }
}

function formatRate(n?: number): string {
  if (n === undefined || n === null) return '—'
  return `${n.toFixed(1)}/s`
}

// ─── Per-node metric definitions ─────────────────────────────────────────────

type MetricRow = { label: string; value: string; highlight?: boolean }

function getMetrics(id: string, comp: ComponentStatus): MetricRow[] {
  switch (id) {
    case 'producer':
      return [
        { label: 'Messages sent', value: formatNum(comp.messagesSent as number), highlight: true },
        { label: 'Rate',          value: formatRate(comp.ratePerSecond as number) },
        { label: 'Last event',    value: formatTime(comp.lastEventTimestamp as string) },
      ]
    case 'kafka':
      return [
        { label: 'Topic',         value: (comp.topic as string) ?? '—' },
        { label: 'Messages',      value: formatNum(comp.messagesInTopic as number), highlight: true },
        { label: 'Consumer lag',  value: formatNum(comp.consumerLag as number) },
        { label: 'Last message',  value: formatTime(comp.lastMessageAt as string) },
      ]
    case 'spark':
      return [
        { label: 'Processed',     value: formatNum(comp.processedMessages as number), highlight: true },
        { label: 'Rejected',      value: formatNum(comp.rejectedMessages as number) },
        { label: 'Batch #',       value: comp.lastBatchId !== undefined ? String(comp.lastBatchId) : '—' },
        { label: 'Throughput',    value: formatRate(comp.rowsPerSecond as number) },
        { label: 'Duration',      value: comp.batchDurationMs ? `${comp.batchDurationMs} ms` : '—' },
        { label: 'Last batch',    value: formatTime(comp.lastBatchAt as string) },
      ]
    case 'hdfs':
      return [
        { label: 'Raw files',     value: formatNum(comp.rawFiles as number), highlight: true },
        { label: 'Rejected files',value: formatNum(comp.rejectedFiles as number) },
        { label: 'Checkpoint',    value: (comp.checkpointStatus as string) ?? '—' },
        { label: 'Last write',    value: formatTime(comp.lastWriteTimestamp as string) },
      ]
    case 'postgresql':
      return [
        { label: 'Metric rows',   value: formatNum(comp.metricRows as number), highlight: true },
        { label: 'High-value',    value: formatNum(comp.highValueRows as number) },
        { label: 'Last update',   value: formatTime(comp.lastUpdateTimestamp as string) },
      ]
    case 'reporting-api':
      return [
        { label: 'Requests served', value: formatNum(comp.requestsServed as number), highlight: true },
        { label: 'Last request',    value: formatTime(comp.lastRequestTimestamp as string) },
      ]
    case 'frontend':
      return [
        { label: 'Last refresh',  value: formatTime(comp.lastRefreshAt as string) },
      ]
    default:
      return []
  }
}

function statusBorderColor(status: string): string {
  switch (status) {
    case 'RUNNING': return '#22c55e'
    case 'OK':      return '#22c55e'
    case 'ACTIVE':  return '#22c55e'
    case 'STARTING':return '#f59e0b'
    case 'ERROR':   return '#ef4444'
    case 'STOPPED': return '#ef4444'
    default:        return '#475569'
  }
}

// ─── Node component ───────────────────────────────────────────────────────────

interface PipelineNodeData {
  label: string
  nodeId: string
  component?: ComponentStatus
  [key: string]: unknown
}

function PipelineNode({ data }: NodeProps) {
  const nodeData = data as PipelineNodeData
  const comp = nodeData.component
  const status = comp?.status ?? 'UNKNOWN'
  const metrics = comp ? getMetrics(nodeData.nodeId, comp) : []
  const topColor = statusBorderColor(status)

  return (
    <div
      className="rounded-xl border border-slate-600 bg-slate-800 shadow-xl"
      style={{ minWidth: 210, borderTopColor: topColor, borderTopWidth: 3 }}
    >
      <Handle type="target" position={Position.Top} className="!bg-slate-500" />

      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-2">
        <span className="font-semibold text-slate-100 text-sm tracking-wide">
          {nodeData.label}
        </span>
        <StatusBadge status={status} />
      </div>

      {/* Divider */}
      <div className="h-px bg-slate-700 mx-3" />

      {/* Metrics */}
      <div className="px-4 py-2.5 space-y-1">
        {metrics.length === 0 && (
          <p className="text-xs text-slate-600 italic">No data yet</p>
        )}
        {metrics.map((m) => (
          <div key={m.label} className="flex items-center justify-between gap-4">
            <span className="text-xs text-slate-500">{m.label}</span>
            <span
              className={`text-xs font-mono ${
                m.highlight ? 'text-slate-100 font-semibold' : 'text-slate-300'
              }`}
            >
              {m.value}
            </span>
          </div>
        ))}
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-slate-500" />
    </div>
  )
}

const nodeTypes = { pipeline: PipelineNode }

// ─── Node layout ──────────────────────────────────────────────────────────────

const INITIAL_NODES: Node[] = [
  { id: 'producer',      type: 'pipeline', position: { x: 280, y: 0   }, data: { label: 'Producer Service',  nodeId: 'producer'      } },
  { id: 'kafka',         type: 'pipeline', position: { x: 280, y: 160 }, data: { label: 'Kafka',             nodeId: 'kafka'         } },
  { id: 'spark',         type: 'pipeline', position: { x: 280, y: 340 }, data: { label: 'Spark Streaming',   nodeId: 'spark'         } },
  { id: 'hdfs',          type: 'pipeline', position: { x: 40,  y: 520 }, data: { label: 'HDFS',              nodeId: 'hdfs'          } },
  { id: 'postgresql',    type: 'pipeline', position: { x: 280, y: 520 }, data: { label: 'PostgreSQL',        nodeId: 'postgresql'    } },
  { id: 'reporting-api', type: 'pipeline', position: { x: 520, y: 520 }, data: { label: 'Reporting API',     nodeId: 'reporting-api' } },
  { id: 'frontend',      type: 'pipeline', position: { x: 280, y: 700 }, data: { label: 'Frontend',          nodeId: 'frontend'      } },
]

const EDGE_DEFINITIONS = [
  { id: 'e-producer-kafka',      source: 'producer',      target: 'kafka',         label: 'messages/s'   },
  { id: 'e-kafka-spark',         source: 'kafka',         target: 'spark',         label: 'consume'      },
  { id: 'e-spark-hdfs',          source: 'spark',         target: 'hdfs',          label: 'raw/rejected' },
  { id: 'e-spark-postgresql',    source: 'spark',         target: 'postgresql',    label: 'metrics'      },
  { id: 'e-postgresql-reporting',source: 'postgresql',    target: 'reporting-api', label: 'query'        },
  { id: 'e-reporting-frontend',  source: 'reporting-api', target: 'frontend',      label: 'REST/1s poll' },
]

// ─── Edge + node builders ────────────────────────────────────────────────────

function buildEdges(flow: PipelineFlowResponse | null): Edge[] {
  return EDGE_DEFINITIONS.map((def) => {
    const conn = flow?.connections?.find(
      (c) => c.from === def.source && c.to === def.target
    )
    const active = conn?.active ?? false

    return {
      id: def.id,
      source: def.source,
      target: def.target,
      label: def.label,
      animated: active,
      style: { stroke: active ? '#22c55e' : '#475569', strokeWidth: 2 },
      labelStyle: { fill: '#64748b', fontSize: 10 },
      labelBgStyle: { fill: '#0f172a', fillOpacity: 0.8 },
      labelBgPadding: [4, 2] as [number, number],
    }
  })
}

// ─── Layout persistence ───────────────────────────────────────────────────────

const LAYOUT_KEY = 'transactionflow:architecture:positions'

function loadSavedPositions(): Record<string, { x: number; y: number }> | null {
  try {
    const raw = localStorage.getItem(LAYOUT_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function savePositions(nodes: Node[]) {
  const positions: Record<string, { x: number; y: number }> = {}
  nodes.forEach((n) => { positions[n.id] = n.position })
  localStorage.setItem(LAYOUT_KEY, JSON.stringify(positions))
}

function getInitialNodes(): Node[] {
  const saved = loadSavedPositions()
  if (!saved) return INITIAL_NODES
  return INITIAL_NODES.map((node) => ({
    ...node,
    position: saved[node.id] ?? node.position,
  }))
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function ArchitectureFlow() {
  const [nodes, setNodes, onNodesChange] = useNodesState(getInitialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const fetchFlow = useCallback(async () => {
    try {
      const data = await getPipelineFlow()
      // Update only component data — positions are managed by the user
      setNodes((current) =>
        current.map((node) => ({
          ...node,
          data: { ...node.data, component: data.components?.[node.id] },
        }))
      )
      setEdges(buildEdges(data))
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pipeline flow')
    }
  }, [setNodes, setEdges])

  useEffect(() => {
    fetchFlow()
    const interval = setInterval(fetchFlow, 1000)
    return () => clearInterval(interval)
  }, [fetchFlow])

  // Persist positions after the user finishes dragging a node
  const onNodeDragStop = useCallback(() => {
    setNodes((current) => {
      savePositions(current)
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
      return current
    })
  }, [setNodes])

  const resetLayout = useCallback(() => {
    localStorage.removeItem(LAYOUT_KEY)
    setNodes(INITIAL_NODES.map((n) => ({ ...n })))
  }, [setNodes])

  return (
    <div className="p-6 h-screen flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Architecture</h1>
          <p className="text-slate-400 text-sm mt-1">Live data flow — polling every 1s</p>
        </div>
        <div className="flex items-center gap-6 text-xs text-slate-400">
          {error ? (
            <span className="text-red-400 bg-red-500/10 border border-red-500/20 rounded px-2 py-1">
              {error}
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              Live
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-5 h-0.5 bg-green-500" />
            Active flow
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-5 h-0.5 bg-slate-500" />
            Idle
          </span>
          {saved && (
            <span className="text-green-400 flex items-center gap-1">
              <span>✓</span> Layout saved
            </span>
          )}
          <button
            onClick={resetLayout}
            className="ml-2 rounded border border-slate-600 bg-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-700 hover:text-slate-100 transition-colors"
          >
            Reset layout
          </button>
        </div>
      </div>

      <div className="flex-1 rounded-xl border border-slate-700 overflow-hidden bg-slate-900">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeDragStop={onNodeDragStop}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          nodesDraggable={true}
          nodesConnectable={false}
          elementsSelectable={true}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#1e293b" />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  )
}

export default function ArchitecturePage() {
  return (
    <ReactFlowProvider>
      <ArchitectureFlow />
    </ReactFlowProvider>
  )
}
