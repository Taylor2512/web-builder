export type DataSourceMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export type DataSourceDef = {
  id: string
  name: string
  url: string
  method?: DataSourceMethod
  headers?: Record<string, string>
  body?: unknown
  timeoutMs?: number
  retryCount?: number
  retryDelayMs?: number
  cacheTTL?: number
  useLocalStorageCache?: boolean
  mockData?: unknown
}

export type DataSourceFetchResult = {
  data: unknown
  from: 'network' | 'memory-cache' | 'local-cache' | 'mock'
}

export type DataSourceConnectionTest = {
  ok: boolean
  message: string
}

export type CollectionField = {
  path: string
  sampleType: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null' | 'unknown'
}

export type CollectionMapping = {
  labelPath?: string
  valuePath?: string
}
