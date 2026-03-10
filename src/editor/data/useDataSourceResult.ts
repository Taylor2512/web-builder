import { useEffect, useState } from 'react'
import { fetchDataSource } from './engine'

type UseDataSourceResult = {
  data: unknown
  loading: boolean
  error: string | null
  source: 'network' | 'memory-cache' | 'local-cache' | 'mock' | null
  reload: () => Promise<void>
}

export const useDataSourceResult = (dataSourceId?: string): UseDataSourceResult => {
  const [data, setData] = useState<unknown>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState<UseDataSourceResult['source']>(null)

  const load = async () => {
    if (!dataSourceId) {
      setData(null)
      setError(null)
      setSource(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await fetchDataSource(dataSourceId)
      setData(result.data)
      setSource(result.from)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load data source')
      setSource(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataSourceId])

  return {
    data,
    loading,
    error,
    source,
    reload: load,
  }
}
