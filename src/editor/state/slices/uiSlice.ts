import type { StateCreator } from 'zustand'
import type { EditorStore, UIActions } from '../storeTypes'

export const createUiSlice: StateCreator<EditorStore, [], [], UIActions> = (set, get) => ({
  selectNode(id) {
    set({ selectedNodeId: id })
  },

  setMode(mode) {
    set({ mode })
    get().persistProject()
  },

  setBreakpoint(activeBreakpoint) {
    set({ activeBreakpoint })
  },
})
