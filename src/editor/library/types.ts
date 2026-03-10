import type { NodeId, NodesById } from '../types/schema'

export type LibraryTemplate = {
  id: string
  name: string
  rootNodeId: NodeId
  nodesById: NodesById
  createdAt: string
  updatedAt: string
}

export type LibraryState = {
  templates: LibraryTemplate[]
}
