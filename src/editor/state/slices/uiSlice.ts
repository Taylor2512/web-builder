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
    set((state) => {
      const nextOpen = !state.ui.leftPanelOpen
      return {
        ui: {
          ...state.ui,
          leftPanelOpen: nextOpen,
          activeLeftPanel: nextOpen ? (state.ui.activeLeftPanel ?? 'blocks') : null,
        },
      }
    })
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
    set((state) => ({
      ui: {
        ...state.ui,
        leftPanelWidth: clampPanelWidth(leftPanelWidth),
        leftPanelOpen: true,
        activeLeftPanel: state.ui.activeLeftPanel ?? 'blocks',
      },
    }))
    get().persistProject()
  },

  setRightPanelWidth(rightPanelWidth) {
    set((state) => ({
      ui: {
        ...state.ui,
        rightPanelWidth: clampPanelWidth(rightPanelWidth),
        rightPanelOpen: true,
      },
    }))
    get().persistProject()
  },

  toggleFocusMode() {
    set((state) => ({
      ui: {
        ...state.ui,
        focusMode: !state.ui.focusMode,
      },
    }))
    get().persistProject()
  },

  setFocusMode(focusMode) {
    set((state) => ({ ui: { ...state.ui, focusMode } }))
    get().persistProject()
  },

  setActiveLeftPanel(panel) {
    set((state) => ({
      ui: {
        ...state.ui,
        activeLeftPanel: panel,
        leftPanelOpen: panel !== null,
      },
    }))
    get().persistProject()
  },
})
