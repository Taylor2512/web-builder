import { produce } from 'immer'
import type { StateCreator } from 'zustand'
import { createId } from '../../types/schema'
import { createDefaultFlow, type FlowDefinition } from '../../flows/types/schema'
import type { EditorStore, FlowsActions } from '../storeTypes'

export const createFlowsSlice: StateCreator<EditorStore, [], [], FlowsActions> = (set, get) => ({
  createFlow(name) {
    set(
      produce((state: EditorStore) => {
        const id = `flow-${createId()}`
        const flow = createDefaultFlow(id, name || 'Untitled Flow')
        state.flows.flowsById[id] = flow
        state.flows.flowOrder.push(id)
        state.flows.activeFlowId = id
      }),
    )
    get().persistProject()
  },

  deleteFlow(id) {
    set(
      produce((state: EditorStore) => {
        if (!state.flows.flowsById[id]) return
        delete state.flows.flowsById[id]
        state.flows.flowOrder = state.flows.flowOrder.filter((flowId) => flowId !== id)
        if (state.flows.activeFlowId === id) {
          state.flows.activeFlowId = state.flows.flowOrder[0] ?? null
        }
      }),
    )
    get().persistProject()
  },

  selectFlow(id) {
    set(
      produce((state: EditorStore) => {
        state.flows.activeFlowId = id
      }),
    )
  },

  renameFlow(id, name) {
    set(
      produce((state: EditorStore) => {
        const flow: FlowDefinition | undefined = state.flows.flowsById[id]
        if (!flow) return
        flow.name = name
        flow.updatedAt = new Date().toISOString()
      }),
    )
    get().persistProject()
  },

  upsertFlowVariable(flowId, key, variable) {
    set(
      produce((state: EditorStore) => {
        const flow = state.flows.flowsById[flowId]
        if (!flow || !key.trim()) return
        flow.variables[key.trim()] = variable
        flow.updatedAt = new Date().toISOString()
      }),
    )
    get().persistProject()
  },

  removeFlowVariable(flowId, key) {
    set(
      produce((state: EditorStore) => {
        const flow = state.flows.flowsById[flowId]
        if (!flow) return
        delete flow.variables[key]
        flow.updatedAt = new Date().toISOString()
      }),
    )
    get().persistProject()
  },

  triggerFlowFromEvent(flowId) {
    set(
      produce((state: EditorStore) => {
        const flow = state.flows.flowsById[flowId]
        if (!flow) return
        state.flows.activeFlowId = flowId
        flow.updatedAt = new Date().toISOString()
      }),
    )
  },
})
