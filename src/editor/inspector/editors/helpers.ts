import { useCallback } from 'react'

type UpdateProps = (id: string, patch: Record<string, unknown>) => void

export function useNodePropUpdater(nodeId: string, updateProps: UpdateProps) {
  return useCallback((patch: Record<string, unknown>) => {
    updateProps(nodeId, patch)
  }, [nodeId, updateProps])
}
