import { create } from 'zustand'
import { produce } from 'immer'
import {
  baseTemplate,
  createId,
  createNode,
  type Breakpoint,
  type EditorMode,
  type EditorProject,
  type Node,
  type NodeId,
  type NodeType,
  type NodesById,
} from '../types/schema'

const STORAGE_KEY = 'web-builder-project-v1'
const SUBMISSIONS_KEY = 'web-builder-form-submissions-v1'

type SubmissionMap = Record<string, unknown[]>

type EditorState = EditorProject & {
  selectedNodeId: NodeId | null
  activeBreakpoint: Breakpoint
  submissions: SubmissionMap
  addNode: (parentId: NodeId, node: Node, index?: number) => void
  removeNode: (id: NodeId) => void
  moveNode: (id: NodeId, newParentId: NodeId, index?: number) => void
  updateProps: (id: NodeId, patch: Record<string, unknown>) => void
  updateStyle: (id: NodeId, patch: Record<string, string | number | undefined>, breakpoint?: Breakpoint) => void
  selectNode: (id: NodeId | null) => void
  setMode: (mode: EditorMode) => void
  setBreakpoint: (breakpoint: Breakpoint) => void
  setProjectName: (name: string) => void
  serialize: () => string
  hydrate: (json: string) => void
  reset: () => void
  submitForm: (formId: string, value: unknown) => void
}

const safeParse = <T>(value: string | null, fallback: T): T => {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

const removeDeep = (nodesById: NodesById, id: NodeId) => {
  const node = nodesById[id]
  if (!node) return
  for (const childId of node.children) removeDeep(nodesById, childId)
  delete nodesById[id]
}

const withAutosave = (state: EditorState) => {
  const payload: EditorProject = {
    projectName: state.projectName,
    rootId: state.rootId,
    nodesById: state.nodesById,
    mode: state.mode,
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(state.submissions))
}

const initialProject = safeParse<EditorProject>(localStorage.getItem(STORAGE_KEY), baseTemplate())
const initialSubmissions = safeParse<SubmissionMap>(localStorage.getItem(SUBMISSIONS_KEY), {})

export const useEditorStore = create<EditorState>((set, get) => ({
  ...initialProject,
  selectedNodeId: null,
  activeBreakpoint: 'desktop',
  submissions: initialSubmissions,

  addNode(parentId, node, index) {
    set(
      produce((state: EditorState) => {
        const parent = state.nodesById[parentId]
        if (!parent) return
        state.nodesById[node.id] = node
        const nextIndex = typeof index === 'number' ? index : parent.children.length
        parent.children.splice(nextIndex, 0, node.id)
        state.selectedNodeId = node.id
      }),
    )
    withAutosave(get())
  },

  removeNode(id) {
    set(
      produce((state: EditorState) => {
        if (id === state.rootId) return
        Object.values(state.nodesById).forEach((node) => {
          node.children = node.children.filter((childId) => childId !== id)
        })
        removeDeep(state.nodesById, id)
        if (state.selectedNodeId === id) state.selectedNodeId = null
      }),
    )
    withAutosave(get())
  },

  moveNode(id, newParentId, index) {
    set(
      produce((state: EditorState) => {
        if (id === state.rootId) return
        const parent = state.nodesById[newParentId]
        if (!parent) return
        Object.values(state.nodesById).forEach((node) => {
          node.children = node.children.filter((childId) => childId !== id)
        })
        const nextIndex = typeof index === 'number' ? index : parent.children.length
        parent.children.splice(nextIndex, 0, id)
      }),
    )
    withAutosave(get())
  },

  updateProps(id, patch) {
    set(
      produce((state: EditorState) => {
        const node = state.nodesById[id]
        if (!node) return
        node.props = { ...node.props, ...patch } as Node['props']
      }),
    )
    withAutosave(get())
  },

  updateStyle(id, patch, breakpoint) {
    set(
      produce((state: EditorState) => {
        const node = state.nodesById[id]
        if (!node) return
        const bp = breakpoint ?? state.activeBreakpoint
        node.styleByBreakpoint[bp] = { ...node.styleByBreakpoint[bp], ...patch }
      }),
    )
    withAutosave(get())
  },

  selectNode(id) {
    set({ selectedNodeId: id })
  },

  setMode(mode) {
    set({ mode })
    withAutosave(get())
  },

  setBreakpoint(activeBreakpoint) {
    set({ activeBreakpoint })
  },

  setProjectName(projectName) {
    set({ projectName })
    withAutosave(get())
  },

  serialize() {
    const state = get()
    return JSON.stringify(
      {
        projectName: state.projectName,
        rootId: state.rootId,
        nodesById: state.nodesById,
        mode: state.mode,
      },
      null,
      2,
    )
  },

  hydrate(json) {
    const payload = safeParse<EditorProject>(json, baseTemplate())
    set({ ...payload, selectedNodeId: null })
    withAutosave(get())
  },

  reset() {
    set({ ...baseTemplate(), selectedNodeId: null, submissions: {} })
    withAutosave(get())
  },

  submitForm(formId, value) {
    set(
      produce((state: EditorState) => {
        const key = `${state.rootId}:${formId}`
        const current = state.submissions[key] ?? []
        state.submissions[key] = [...current, value]
      }),
    )
    withAutosave(get())
  },
}))

export const buildNode = (type: NodeType): Node => createNode(type, createId()) as Node
