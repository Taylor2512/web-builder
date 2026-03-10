import type { BuilderConfig } from '../config/loadBuilderConfig'
import type { PersistenceMode, PersistencePreference } from '../persistence'
import type { FlowVariable } from '../flows/types/schema'
import type { LibraryTemplate } from '../library'
import type {
  Breakpoint,
  EditorPanelId,
  EditorMode,
  EditorProject,
  Node,
  NodeId,
  PageDef,
  StyleMap,
} from '../types/schema'

export type SubmissionEntry = {
  pageId: string
  formId: string
  timestamp: string
  payload: unknown
}

export type SubmissionMap = Record<string, SubmissionEntry[]>

export type SiteActions = {
  addPage: (name: string, path: string) => void
  selectPage: (pageId: string) => void
  updatePage: (pageId: string, patch: Partial<Pick<PageDef, 'name' | 'path' | 'title' | 'meta'>>) => void
  removePage: (pageId: string) => void
}

export type NodesActions = {
  addNode: (parentId: NodeId, node: Node, index?: number) => void
  removeNode: (id: NodeId) => void
  moveNode: (id: NodeId, newParentId: NodeId, index?: number) => void
  updateNodePropsByType: (id: NodeId, patch: Partial<Node['props']>) => void
  updateNodeStyleByBreakpoint: (id: NodeId, patch: Partial<StyleMap>, breakpoint?: Breakpoint) => void
  duplicateNode: (id: NodeId) => void
  moveNodeSibling: (id: NodeId, direction: 'up' | 'down') => void
  toggleNodeVisibility: (id: NodeId) => void
  showNode: (id: NodeId) => void
  showAllNodes: () => void
}

export type FlowsActions = {
  createFlow: (name: string) => void
  deleteFlow: (id: string) => void
  selectFlow: (id: string | null) => void
  renameFlow: (id: string, name: string) => void
  upsertFlowVariable: (flowId: string, key: string, variable: FlowVariable) => void
  removeFlowVariable: (flowId: string, key: string) => void
  triggerFlowFromEvent: (flowId: string, meta?: { nodeId?: string; event?: 'click' | 'hover' | 'load' }) => void
}

export type PersistenceActions = {
  serialize: () => string
  hydrate: (json: string) => void
  reset: () => void
  submitForm: (formId: string, value: unknown) => void
  setProjectName: (name: string) => void
  setBuilderConfig: (config: BuilderConfig) => void
  persistProject: () => void
  setPersistencePreference: (preference: PersistencePreference) => Promise<void>
  saveSelectionAsTemplate: (name: string) => void
  insertTemplate: (templateId: string, parentId: NodeId, index?: number) => void
  removeTemplate: (templateId: string) => void
  undo: () => void
  redo: () => void
  createPublishSnapshot: (label?: string) => void
  restorePublishSnapshot: (snapshotId: string) => void
}

export type UIActions = {
  selectNode: (id: NodeId | null) => void
  setMode: (mode: EditorMode) => void
  setBreakpoint: (breakpoint: Breakpoint) => void
  toggleLeftPanel: () => void
  toggleRightPanel: () => void
  togglePanels: () => void
  setLeftPanelWidth: (width: number) => void
  setRightPanelWidth: (width: number) => void
  toggleFocusMode: () => void
  setFocusMode: (active: boolean) => void
  setFocusScope?: (scope: 'page' | 'node', nodeId?: NodeId | null) => void
  setActiveLeftPanel: (panel: EditorPanelId | null) => void
}

export type HistoryHookContext = {
  source: 'ui' | 'nodes' | 'site' | 'flows' | 'persistence'
  action: string
  timestamp: string
}

export type HistoryHooks = {
  beforeCommit?: (project: EditorProject, context: HistoryHookContext) => EditorProject
  afterCommit?: (project: EditorProject, context: HistoryHookContext) => void
}

export type EditorStore = EditorProject & {
  selectedNodeId: NodeId | null
  activeBreakpoint: Breakpoint
  submissions: SubmissionMap
  builderConfig: BuilderConfig
  libraryTemplates: LibraryTemplate[]
  persistenceMode: PersistenceMode
  persistencePreference: PersistencePreference
  persistenceError: string | null
  historyPast: EditorProject[]
  historyFuture: EditorProject[]
  publishSnapshots: { id: string; label: string; timestamp: string; snapshot: EditorProject }[]
  historyHooks?: HistoryHooks
} & SiteActions
  & NodesActions
  & FlowsActions
  & PersistenceActions
  & UIActions
