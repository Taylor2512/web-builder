import type { StateCreator } from 'zustand'
import type { EditorStore, UIActions } from '../storeTypes'

const clampPanelWidth = (width: number) => Math.max(180, Math.min(width, 520))

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

  toggleLeftPanel() {
    set((state) => ({ ui: { ...state.ui, leftPanelOpen: !state.ui.leftPanelOpen } }))
    get().persistProject()
  },

  toggleRightPanel() {
    set((state) => ({ ui: { ...state.ui, rightPanelOpen: !state.ui.rightPanelOpen } }))
    get().persistProject()
  },

  togglePanels() {
    const { leftPanelOpen, rightPanelOpen } = get().ui
    const nextOpen = !(leftPanelOpen && rightPanelOpen)
    set((state) => ({
      ui: {
        ...state.ui,
        leftPanelOpen: nextOpen,
        rightPanelOpen: nextOpen,
      },
    }))
    get().persistProject()
  },

  setLeftPanelWidth(leftPanelWidth) {
    set((state) => ({ ui: { ...state.ui, leftPanelWidth: clampPanelWidth(leftPanelWidth) } }))
    get().persistProject()
  },

  setRightPanelWidth(rightPanelWidth) {
    set((state) => ({ ui: { ...state.ui, rightPanelWidth: clampPanelWidth(rightPanelWidth) } }))
    get().persistProject()
  },
})
