import type { DataSourceDef, DataSourceFetchResult } from './types'

type CacheEntry = {
  value: unknown
  expiresAt: number
}

type DataSourceResolver = (id: string) => DataSourceDef | undefined

const DEFAULT_TIMEOUT = 8_000
const DEFAULT_RETRIES = 1
const DEFAULT_RETRY_DELAY = 300
const LOCAL_CACHE_PREFIX = 'web-builder-ds-cache:'

const memoryCache = new Map<string, CacheEntry>()

let resolver: DataSourceResolver = () => undefined

export const setDataSourceResolver = (nextResolver: DataSourceResolver) => {
  resolver = nextResolver
}

const localKey = (id: string) => `${LOCAL_CACHE_PREFIX}${id}`

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const readLocalCache = (id: string): CacheEntry | null => {
  const raw = localStorage.getItem(localKey(id))
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as CacheEntry
    if (parsed.expiresAt <= Date.now()) {
      localStorage.removeItem(localKey(id))
      return null
    }
    return parsed
  } catch {
    localStorage.removeItem(localKey(id))
    return null
  }
}

const writeCache = (id: string, data: unknown, ttl: number, useLocalStorageCache: boolean) => {
  if (ttl <= 0) return
  const entry: CacheEntry = {
    value: data,
    expiresAt: Date.now() + ttl,
  }
  memoryCache.set(id, entry)
  if (useLocalStorageCache) {
    localStorage.setItem(localKey(id), JSON.stringify(entry))
  }
}

export const fetchDataSource = async (id: string): Promise<DataSourceFetchResult> => {
  const def = resolver(id)
  if (!def) throw new Error(`Data source not found: ${id}`)

  const ttl = def.cacheTTL ?? 0
  const useLocalStorageCache = def.useLocalStorageCache ?? true

  if (ttl > 0) {
    const inMemory = memoryCache.get(id)
    if (inMemory && inMemory.expiresAt > Date.now()) {
      return { data: inMemory.value, from: 'memory-cache' }
    }

    if (useLocalStorageCache) {
      const inLocalStorage = readLocalCache(id)
      if (inLocalStorage) {
        memoryCache.set(id, inLocalStorage)
        return { data: inLocalStorage.value, from: 'local-cache' }
      }
    }
  }

  const retries = Math.max(0, def.retryCount ?? DEFAULT_RETRIES)
  const retryDelay = Math.max(100, def.retryDelayMs ?? DEFAULT_RETRY_DELAY)
  let lastError: unknown = null

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), def.timeoutMs ?? DEFAULT_TIMEOUT)

    try {
      const response = await fetch(def.url, {
        method: def.method ?? 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(def.headers ?? {}),
        },
        body: def.body ? JSON.stringify(def.body) : undefined,
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error(`Data source request failed with status ${response.status}`)
      }

      const payload = (await response.json()) as unknown
      writeCache(id, payload, ttl, useLocalStorageCache)
      return { data: payload, from: 'network' }
    } catch (error) {
      lastError = error
      if (attempt < retries) {
        await wait(retryDelay * (attempt + 1))
      }
    } finally {
      clearTimeout(timeout)
    }
  }

  if (def.mockData !== undefined) {
    writeCache(id, def.mockData, ttl, useLocalStorageCache)
    return { data: def.mockData, from: 'mock' }
  }

  throw lastError instanceof Error ? lastError : new Error(`Unable to fetch data source ${id}`)
}
