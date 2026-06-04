// ─── Pipeline Flow ────────────────────────────────────────────────────────────

export interface ComponentStatus {
  status: string
  // producer
  messagesSent?: number
  ratePerSecond?: number
  lastEventTimestamp?: string
  // kafka
  topic?: string
  messagesInTopic?: number
  consumerLag?: number
  lastMessageAt?: string
  // spark
  processedMessages?: number
  rejectedMessages?: number
  lastBatchId?: number
  rowsPerSecond?: number
  batchDurationMs?: number
  lastBatchAt?: string
  // hdfs
  rawFiles?: number
  rejectedFiles?: number
  checkpointStatus?: string
  lastWriteTimestamp?: string
  // postgresql
  metricRows?: number
  highValueRows?: number
  lastUpdateTimestamp?: string
  // reporting-api
  requestsServed?: number
  lastRequestTimestamp?: string
  // frontend
  lastRefreshAt?: string
  [key: string]: unknown
}

export interface PipelineConnection {
  from: string
  to: string
  active: boolean
  messagesTransferred?: number
}

export interface PipelineFlowResponse {
  timestamp: string
  components: Record<string, ComponentStatus>
  connections: PipelineConnection[]
}

// ─── Metrics ──────────────────────────────────────────────────────────────────

export interface MetricsSummaryResponse {
  totalTransactions: number
  rejectedTransactions: number
  highValueTransactions: number
  totalAmountEur: number
  totalAmountGbp: number
  totalAmountUsd: number
}

export interface CurrencyMetrics {
  id?: number
  windowStart?: string
  windowEnd?: string
  currency: string
  transactionCount: number
  totalAmount: number
  averageAmount: number
  createdAt?: string
}

export interface TypeMetrics {
  id?: number
  windowStart?: string
  windowEnd?: string
  transactionType: string
  transactionCount: number
  totalAmount: number
  createdAt?: string
}

export interface CountryMetrics {
  id?: number
  windowStart?: string
  windowEnd?: string
  countryCode: string
  countryName: string
  transactionCount: number
  totalAmount: number
  averageAmount: number
  highValueCount: number
  rejectedCount: number
  lastTransactionAt?: string
  createdAt?: string
}

// ─── Country Map ──────────────────────────────────────────────────────────────

export interface CountryMapData {
  countryCode: string
  countryName: string
  transactionCount: number
  totalAmount: number
  averageAmount: number
  highValueCount: number
  rejectedCount: number
  lastTransactionAt?: string
}

export interface CountryMapDataResponse {
  countries: CountryMapData[]
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export type TransactionStatus = 'VALID' | 'REJECTED' | 'HIGH_VALUE' | 'NORMALISED' | 'UNKNOWN_TYPE'

export interface RecentTransaction {
  id?: number
  transactionId: string
  accountId: string
  customerId?: string
  transactionType: string
  amount: number
  currency: string
  merchant?: string
  countryCode?: string
  countryName?: string
  status: TransactionStatus
  rejectionReason?: string
  createdAt: string
  processedAt?: string
}

export interface HighValueTransaction {
  transactionId: string
  accountId: string
  customerId?: string
  amount: number
  currency: string
  transactionType: string
  merchant?: string
  countryCode?: string
  countryName?: string
  createdAt: string
  detectedAt: string
}

// ─── HDFS ─────────────────────────────────────────────────────────────────────

export interface HdfsStatus {
  hdfsStatus: string
  namenodeUrl: string
  rawPath: string
  rejectedPath: string
  checkpointPath: string
  rawFilesWritten: number
  rejectedFilesWritten: number
  lastBatchId?: number
  lastRecordedAt?: string
  checkpointStatus: string
  timestamp: string
}

// ─── Generator ────────────────────────────────────────────────────────────────

export interface GeneratorStatus {
  running: boolean
  eventsPerSecond?: number
  invalidPercentage?: number
  highValuePercentage?: number
  unknownTypePercentage?: number
  messagesSent?: number
  ratePerSecond?: number
  lastEventTimestamp?: string
  startedAt?: string
}

export interface GeneratorConfig {
  eventsPerSecond: number
  invalidPercentage: number
  highValuePercentage: number
  unknownTypePercentage: number
}

export interface BurstConfig {
  numberOfEvents: number
  invalidPercentage: number
  highValuePercentage: number
  unknownTypePercentage: number
}
