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
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { getPipelineFlow } from '@/lib/api'
import type { PipelineFlowResponse, ComponentStatus } from '@/types'
import StatusBadge from '@/components/StatusBadge'

function formatNum(n?: number): string {
  if (n === undefined) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

interface PipelineNodeData {
  label: string
  component?: ComponentStatus
  [key: string]: unknown
}

function PipelineNode({ data }: NodeProps) {
  const nodeData = data as PipelineNodeData
  const comp = nodeData.component
  const status = comp?.status ?? 'UNKNOWN'

  return (
    <div className="rounded-xl border border-slate-600 bg-slate-800 shadow-xl min-w-[160px]">
      <Handle type="target" position={Position.Top} className="!bg-slate-500" />
      <div className="px-4 py-3">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="font-semibold text-slate-100 text-sm">{nodeData.label}</span>
          <StatusBadge status={status} />
        </div>
        {comp && (
          <div className="space-y-0.5 text-xs text-slate-400">
            {comp.messagesSent !== undefined && (
              <div className="flex justify-between gap-3">
                <span>Sent</span>
                <span className="text-slate-200 font-mono">{formatNum(comp.messagesSent)}</span>
              </div>
            )}
            {comp.messagesReceived !== undefined && (
              <div className="flex justify-between gap-3">
                <span>Received</span>
                <span className="text-slate-200 font-mono">{formatNum(comp.messagesReceived)}</span>
              </div>
            )}
            {comp.ratePerSecond !== undefined && (
              <div className="flex justify-between gap-3">
                <span>Rate</span>
                <span className="text-slate-200 font-mono">{comp.ratePerSecond.toFixed(1)}/s</span>
              </div>
            )}
          </div>
        )}
        {!comp && (
          <p className="text-xs text-slate-600">No data</p>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-slate-500" />
    </div>
  )
}

const nodeTypes = { pipeline: PipelineNode }

const INITIAL_NODES: Node[] = [
  { id: 'producer', type: 'pipeline', position: { x: 300, y: 0 }, data: { label: 'Producer' } },
  { id: 'kafka', type: 'pipeline', position: { x: 300, y: 140 }, data: { label: 'Kafka' } },
  { id: 'spark', type: 'pipeline', position: { x: 300, y: 280 }, data: { label: 'Spark' } },
  { id: 'hdfs', type: 'pipeline', position: { x: 100, y: 420 }, data: { label: 'HDFS' } },
  { id: 'postgresql', type: 'pipeline', position: { x: 300, y: 420 }, data: { label: 'PostgreSQL' } },
  { id: 'reporting-api', type: 'pipeline', position: { x: 500, y: 420 }, data: { label: 'Reporting API' } },
  { id: 'frontend', type: 'pipeline', position: { x: 300, y: 560 }, data: { label: 'Frontend' } },
]

const EDGE_DEFINITIONS = [
  { id: 'e-producer-kafka', source: 'producer', target: 'kafka', label: 'transactions' },
  { id: 'e-kafka-spark', source: 'kafka', target: 'spark', label: 'stream' },
  { id: 'e-spark-hdfs', source: 'spark', target: 'hdfs', label: 'raw/rejected' },
  { id: 'e-spark-postgresql', source: 'spark', target: 'postgresql', label: 'enriched' },
  { id: 'e-postgresql-reporting', source: 'postgresql', target: 'reporting-api', label: 'queries' },
  { id: 'e-reporting-frontend', source: 'reporting-api', target: 'frontend', label: 'API' },
]

function buildEdges(flow: PipelineFlowResponse | null): Edge[] {
  return EDGE_DEFINITIONS.map((def) => {
    const conn = flow?.connections?.find(
      (c) => c.from === def.source && c.to === def.target
    )
    const active = conn?.active ?? (conn?.messagesTransferred !== undefined && conn.messagesTransferred > 0)

    return {
      id: def.id,
      source: def.source,
      target: def.target,
      label: def.label,
      animated: active,
      style: {
        stroke: active ? '#22c55e' : '#475569',
        strokeWidth: 2,
      },
      labelStyle: { fill: '#94a3b8', fontSize: 11 },
      labelBgStyle: { fill: '#1e293b' },
    }
  })
}

function buildNodes(flow: PipelineFlowResponse | null): Node[] {
  return INITIAL_NODES.map((node) => ({
    ...node,
    data: {
      label: node.data.label,
      component: flow?.components?.[node.id],
    },
  }))
}

function ArchitectureFlow() {
  const [flow, setFlow] = useState<PipelineFlowResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchFlow = useCallback(async () => {
    try {
      const data = await getPipelineFlow()
      setFlow(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pipeline flow')
    }
  }, [])

  useEffect(() => {
    fetchFlow()
    const interval = setInterval(fetchFlow, 1000)
    return () => clearInterval(interval)
  }, [fetchFlow])

  const nodes = buildNodes(flow)
  const edges = buildEdges(flow)

  return (
    <div className="p-6 h-screen flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Architecture</h1>
          <p className="text-slate-400 text-sm mt-1">Live data flow diagram — polling every 1s</p>
        </div>
        {error && (
          <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        {!error && (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            <span>Live</span>
            <span className="ml-4 flex items-center gap-1.5">
              <span className="inline-block w-6 h-0.5 bg-green-500" />
              <span className="text-xs">Active flow</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-6 h-0.5 bg-slate-500" />
              <span className="text-xs">Idle</span>
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 rounded-xl border border-slate-700 overflow-hidden bg-slate-900">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          proOptions={{ hideAttribution: true }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="#334155"
          />
          <Controls className="!bg-black !border-slate-600 [&_.react-flow__controls-button]:!bg-black [&_.react-flow__controls-button]:!border-slate-600 [&_.react-flow__controls-button]:!text-white [&_.react-flow__controls-button_svg]:!fill-white" />
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
