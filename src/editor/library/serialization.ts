import { createId, type Node, type NodeId, type NodesById } from '../types/schema'
import type { LibraryTemplate } from './types'

const cloneTemplateNode = (node: Node): Node => structuredClone(node)

const collectSubtreeIds = (nodesById: NodesById, rootNodeId: NodeId): NodeId[] => {
  const node = nodesById[rootNodeId]
  if (!node) return []
  const queue: NodeId[] = [rootNodeId]
  const collected: NodeId[] = []

  while (queue.length) {
    const currentId = queue.shift() as NodeId
    const currentNode = nodesById[currentId]
    if (!currentNode) continue
    collected.push(currentId)
    queue.push(...currentNode.children)
  }

  return collected
}

export const serializeSelectionAsTemplate = ({
  selectionId,
  sourceNodesById,
  name,
}: {
  selectionId: NodeId
  sourceNodesById: NodesById
  name: string
}): LibraryTemplate | null => {
  const source = sourceNodesById[selectionId]
  if (!source) return null

  const templateId = `tpl-${createId()}`
  const remap = new Map<NodeId, NodeId>()
  const subtreeIds = collectSubtreeIds(sourceNodesById, selectionId)

  subtreeIds.forEach((nodeId) => {
    remap.set(nodeId, createId())
  })

  const templateNodesById: NodesById = {}
  subtreeIds.forEach((nodeId) => {
    const node = sourceNodesById[nodeId]
    const mappedId = remap.get(nodeId)
    if (!node || !mappedId) return
    const cloned = cloneTemplateNode(node)
    cloned.id = mappedId
    cloned.children = cloned.children.map((childId) => remap.get(childId) ?? childId)
    templateNodesById[mappedId] = cloned
  })

  const rootNodeId = remap.get(selectionId)
  if (!rootNodeId) return null

  const timestamp = new Date().toISOString()
  return {
    id: templateId,
    name: name.trim() || source.type,
    rootNodeId,
    nodesById: templateNodesById,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

export const instantiateTemplateNodes = (template: LibraryTemplate): { rootNodeId: NodeId; nodesById: NodesById } => {
  const remap = new Map<NodeId, NodeId>()
  const templateNodeIds = Object.keys(template.nodesById)

  templateNodeIds.forEach((nodeId) => {
    remap.set(nodeId, createId())
  })

  const nodesById: NodesById = {}
  templateNodeIds.forEach((nodeId) => {
    const source = template.nodesById[nodeId]
    const mappedId = remap.get(nodeId)
    if (!source || !mappedId) return
    const cloned = cloneTemplateNode(source)
    cloned.id = mappedId
    cloned.children = cloned.children.map((childId) => remap.get(childId) ?? childId)
    nodesById[mappedId] = cloned
  })

  return {
    rootNodeId: remap.get(template.rootNodeId) ?? template.rootNodeId,
    nodesById,
  }
}
