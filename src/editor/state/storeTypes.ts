import type { BuilderConfig } from '../config/loadBuilderConfig'
import type { FlowVariable } from '../flows/types/schema'
import type {
  Breakpoint,
  EditorMode,
  EditorProject,
  Node,
  NodeId,
  PageDef,
  StyleMap,
} from '../types/schema'

export type SubmissionMap = Record<string, unknown[]>

export type SiteActions = {
  addPage: (name: string, path: string) => void
  selectPage: (pageId: string) => void
  updatePage: (pageId: string, patch: Partial<Pick<PageDef, 'name' | 'path' | 'title'>>) => void
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
}

export type FlowsActions = {
  createFlow: (name: string) => void
  deleteFlow: (id: string) => void
  selectFlow: (id: string | null) => void
  renameFlow: (id: string, name: string) => void
  upsertFlowVariable: (flowId: string, key: string, variable: FlowVariable) => void
  removeFlowVariable: (flowId: string, key: string) => void
}

export type PersistenceActions = {
  serialize: () => string
  hydrate: (json: string) => void
  reset: () => void
  submitForm: (formId: string, value: unknown) => void
  setProjectName: (name: string) => void
  setBuilderConfig: (config: BuilderConfig) => void
  persistProject: () => void
}

export type UIActions = {
  selectNode: (id: NodeId | null) => void
  setMode: (mode: EditorMode) => void
  setBreakpoint: (breakpoint: Breakpoint) => void
}

export type EditorStore = EditorProject & {
  selectedNodeId: NodeId | null
  activeBreakpoint: Breakpoint
  submissions: SubmissionMap
  builderConfig: BuilderConfig
} & SiteActions
  & NodesActions
  & FlowsActions
  & PersistenceActions
  & UIActions
