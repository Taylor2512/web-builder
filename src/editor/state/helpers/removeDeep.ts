import type { NodeId, NodesById } from '../../types/schema'

export const removeDeep = (nodesById: NodesById, id: NodeId) => {
  const node = nodesById[id]
  if (!node) return
  for (const childId of node.children) removeDeep(nodesById, childId)
  delete nodesById[id]
}
