import { produce } from 'immer'
import type { StateCreator } from 'zustand'
import { createId, type Node, type StyleMap } from '../../types/schema'
import { activeRootId } from '../helpers/activeRootId'
import { removeDeep } from '../helpers/removeDeep'
import type { EditorStore, NodesActions } from '../storeTypes'

export const createNodesSlice: StateCreator<EditorStore, [], [], NodesActions> = (set, get) => ({
  addNode(parentId, node, index) {
    set(
      produce((state: EditorStore) => {
        const parent = state.nodesById[parentId]
        if (!parent) return
        state.nodesById[node.id] = node
        const nextIndex = typeof index === 'number' ? index : parent.children.length
        parent.children.splice(nextIndex, 0, node.id)
        state.selectedNodeId = node.id
      }),
    )
    get().persistProject()
  },

  removeNode(id) {
    set(
      produce((state: EditorStore) => {
        if (id === activeRootId(state)) return
        Object.values(state.nodesById).forEach((node) => {
          node.children = node.children.filter((childId) => childId !== id)
        })
        removeDeep(state.nodesById, id)
        if (state.selectedNodeId === id) state.selectedNodeId = null
      }),
    )
    get().persistProject()
  },

  moveNode(id, newParentId, index) {
    set(
      produce((state: EditorStore) => {
        if (id === activeRootId(state)) return
        const parent = state.nodesById[newParentId]
        if (!parent) return
        Object.values(state.nodesById).forEach((node) => {
          node.children = node.children.filter((childId) => childId !== id)
        })
        const nextIndex = typeof index === 'number' ? index : parent.children.length
        parent.children.splice(nextIndex, 0, id)
      }),
    )
    get().persistProject()
  },

  updateNodePropsByType(id, patch) {
    set(
      produce((state: EditorStore) => {
        const node = state.nodesById[id]
        if (!node) return
        node.props = { ...node.props, ...patch } as Node['props']
      }),
    )
    get().persistProject()
  },

  updateNodeStyleByBreakpoint(id, patch, breakpoint) {
    set(
      produce((state: EditorStore) => {
        const node = state.nodesById[id]
        if (!node) return
        const bp = breakpoint ?? state.activeBreakpoint
        const stylePatch: Partial<StyleMap> = patch
        node.styleByBreakpoint[bp] = { ...node.styleByBreakpoint[bp], ...stylePatch }
      }),
    )
    get().persistProject()
  },

  duplicateNode(id) {
    set(
      produce((state: EditorStore) => {
        if (id === activeRootId(state)) return
        const cloneDeep = (nodeId: string): string => {
          const node = state.nodesById[nodeId]
          if (!node) return nodeId
          const newId = createId()
          const cloned = {
            ...structuredClone(node),
            id: newId,
            children: node.children.map(cloneDeep),
          }
          state.nodesById[newId] = cloned as Node
          return newId
        }
        const newNodeId = cloneDeep(id)
        const parent = Object.values(state.nodesById).find((n) => n.children.includes(id))
        if (parent) {
          const idx = parent.children.indexOf(id)
          parent.children.splice(idx + 1, 0, newNodeId)
        }
        state.selectedNodeId = newNodeId
      }),
    )
    get().persistProject()
  },


  toggleNodeVisibility(id) {
    set(
      produce((state: EditorStore) => {
        const node = state.nodesById[id]
        if (!node) return
        node.isHidden = !node.isHidden
      }),
    )
    get().persistProject()
  },
  moveNodeSibling(id, direction) {
    set(
      produce((state: EditorStore) => {
        const parent = Object.values(state.nodesById).find((n) => n.children.includes(id))
        if (!parent) return
        const idx = parent.children.indexOf(id)
        if (direction === 'up' && idx > 0) {
          ;[parent.children[idx - 1], parent.children[idx]] = [parent.children[idx], parent.children[idx - 1]]
        } else if (direction === 'down' && idx < parent.children.length - 1) {
          ;[parent.children[idx + 1], parent.children[idx]] = [parent.children[idx], parent.children[idx + 1]]
        }
      }),
    )
    get().persistProject()
  },
})
