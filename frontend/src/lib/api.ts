import type {
  PipelineFlowResponse,
  MetricsSummaryResponse,
  CountryMapDataResponse,
  RecentTransaction,
  HighValueTransaction,
  CurrencyMetrics,
  TypeMetrics,
  CountryMetrics,
  HdfsStatus,
  GeneratorStatus,
  GeneratorConfig,
  GeneratorConfigData,
  BurstConfig,
} from '@/types'

const BASE_URL = process.env.NEXT_PUBLIC_REPORTING_API_URL || 'http://localhost:8082'

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText}`)
  }
  return res.json() as Promise<T>
}

// ─── Pipeline ─────────────────────────────────────────────────────────────────

export async function getPipelineFlow(): Promise<PipelineFlowResponse> {
  return fetchJson<PipelineFlowResponse>(`${BASE_URL}/api/pipeline/flow`)
}

export async function getPipelineStatus(): Promise<Record<string, string>> {
  return fetchJson<Record<string, string>>(`${BASE_URL}/api/pipeline/status`)
}

// ─── Metrics ──────────────────────────────────────────────────────────────────

export async function getMetricsSummary(): Promise<MetricsSummaryResponse> {
  return fetchJson<MetricsSummaryResponse>(`${BASE_URL}/api/metrics/summary`)
}

export async function getMapCountries(): Promise<CountryMapDataResponse> {
  return fetchJson<CountryMapDataResponse>(`${BASE_URL}/api/metrics/map/countries`)
}

export async function getMetricsByCountry(): Promise<CountryMetrics[]> {
  return fetchJson<CountryMetrics[]>(`${BASE_URL}/api/metrics/countries`)
}

export async function getMetricsByCurrency(): Promise<CurrencyMetrics[]> {
  return fetchJson<CurrencyMetrics[]>(`${BASE_URL}/api/metrics/currency`)
}

export async function getMetricsByType(): Promise<TypeMetrics[]> {
  return fetchJson<TypeMetrics[]>(`${BASE_URL}/api/metrics/type`)
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export async function getRecentTransactions(): Promise<RecentTransaction[]> {
  return fetchJson<RecentTransaction[]>(`${BASE_URL}/api/transactions/recent`)
}

export async function getHighValueTransactions(): Promise<HighValueTransaction[]> {
  return fetchJson<HighValueTransaction[]>(`${BASE_URL}/api/transactions/high-value`)
}

// ─── Storage ──────────────────────────────────────────────────────────────────

export async function getHdfsStatus(): Promise<HdfsStatus> {
  return fetchJson<HdfsStatus>(`${BASE_URL}/api/storage/hdfs/status`)
}

// ─── Generator ────────────────────────────────────────────────────────────────

export async function startGenerator(config: GeneratorConfig): Promise<void> {
  await fetchJson<unknown>(`${BASE_URL}/api/generator/start`, {
    method: 'POST',
    body: JSON.stringify(config),
  })
}

export async function stopGenerator(): Promise<void> {
  await fetchJson<unknown>(`${BASE_URL}/api/generator/stop`, {
    method: 'POST',
  })
}

export async function getGeneratorStatus(): Promise<GeneratorStatus> {
  return fetchJson<GeneratorStatus>(`${BASE_URL}/api/generator/status`)
}

export async function generateOne(type: 'random' | 'invalid' | 'high-value' | 'unknown-type'): Promise<void> {
  await fetchJson<unknown>(`${BASE_URL}/api/generator/transaction/${type}`, {
    method: 'POST',
  })
}

export async function generateBurst(config: BurstConfig): Promise<void> {
  await fetchJson<unknown>(`${BASE_URL}/api/generator/burst`, {
    method: 'POST',
    body: JSON.stringify(config),
  })
}

// ─── Generator configuration (reference data lists) ──────────────────────────

export async function getGeneratorConfig(): Promise<GeneratorConfigData> {
  return fetchJson<GeneratorConfigData>(`${BASE_URL}/api/generator/config`)
}

export async function addMerchant(value: string): Promise<GeneratorConfigData> {
  return fetchJson<GeneratorConfigData>(`${BASE_URL}/api/generator/config/merchants`, {
    method: 'POST',
    body: JSON.stringify({ value }),
  })
}

export async function removeMerchant(value: string): Promise<GeneratorConfigData> {
  return fetchJson<GeneratorConfigData>(`${BASE_URL}/api/generator/config/merchants`, {
    method: 'DELETE',
    body: JSON.stringify({ value }),
  })
}

export async function addCountry(code: string, name: string): Promise<GeneratorConfigData> {
  return fetchJson<GeneratorConfigData>(`${BASE_URL}/api/generator/config/countries`, {
    method: 'POST',
    body: JSON.stringify({ code, name }),
  })
}

export async function removeCountry(code: string): Promise<GeneratorConfigData> {
  return fetchJson<GeneratorConfigData>(`${BASE_URL}/api/generator/config/countries`, {
    method: 'DELETE',
    body: JSON.stringify({ code }),
  })
}

export async function addUnknownType(value: string): Promise<GeneratorConfigData> {
  return fetchJson<GeneratorConfigData>(`${BASE_URL}/api/generator/config/unknown-types`, {
    method: 'POST',
    body: JSON.stringify({ value }),
  })
}

export async function removeUnknownType(value: string): Promise<GeneratorConfigData> {
  return fetchJson<GeneratorConfigData>(`${BASE_URL}/api/generator/config/unknown-types`, {
    method: 'DELETE',
    body: JSON.stringify({ value }),
  })
}
