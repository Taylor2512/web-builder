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
  type PageDef,
} from '../types/schema'
import { defaultBuilderConfig, type BuilderConfig } from '../config/loadBuilderConfig'
import { createDefaultFlow, type FlowDefinition, type FlowVariable } from '../flows/types/schema'
import { saveRemoteSubmission } from '../api/jsonServer'
import { fetchDataSource, setDataSourceResolver } from '../data/engine'
import type { DataSourceConnectionTest, DataSourceDef } from '../data/types'

const STORAGE_KEY = 'web-builder-project-v1'
const SUBMISSIONS_KEY = 'web-builder-form-submissions-v1'
const DATA_SOURCES_KEY = 'web-builder-data-sources-v1'

type SubmissionMap = Record<string, unknown[]>

type EditorState = EditorProject & {
  selectedNodeId: NodeId | null
  activeBreakpoint: Breakpoint
  submissions: SubmissionMap
  dataSources: Record<string, DataSourceDef>
  builderConfig: BuilderConfig
  addNode: (parentId: NodeId, node: Node, index?: number) => void
  removeNode: (id: NodeId) => void
  moveNode: (id: NodeId, newParentId: NodeId, index?: number) => void
  updateProps: (id: NodeId, patch: Record<string, unknown>) => void
  replaceProps: (id: NodeId, nextProps: unknown) => void
  setCustomCss: (id: NodeId, customCss: string) => void
  setBindings: (id: NodeId, bindings: { id: string; targetPath: string; sourcePath: string }[]) => void
  updateStyle: (id: NodeId, patch: Record<string, string | number | undefined>, breakpoint?: Breakpoint) => void
  selectNode: (id: NodeId | null) => void
  setMode: (mode: EditorMode) => void
  setBreakpoint: (breakpoint: Breakpoint) => void
  setProjectName: (name: string) => void
  serialize: () => string
  hydrate: (json: string) => void
  reset: () => void
  submitForm: (formId: string, value: unknown) => void
  setBuilderConfig: (config: BuilderConfig) => void
  createFlow: (name: string) => void
  deleteFlow: (id: string) => void
  selectFlow: (id: string | null) => void
  renameFlow: (id: string, name: string) => void
  upsertFlowVariable: (flowId: string, key: string, variable: FlowVariable) => void
  removeFlowVariable: (flowId: string, key: string) => void
  addPage: (name: string, path: string) => void
  selectPage: (pageId: string) => void
  updatePage: (pageId: string, patch: Partial<Pick<PageDef, 'name' | 'path' | 'title'>>) => void
  removePage: (pageId: string) => void
  duplicateNode: (id: NodeId) => void
  moveNodeSibling: (id: NodeId, direction: 'up' | 'down') => void
  upsertDataSource: (dataSource: DataSourceDef) => void
  removeDataSource: (id: string) => void
  testDataSourceConnection: (id: string) => Promise<DataSourceConnectionTest>
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

const activeRootId = (state: EditorProject) => {
  const activePage = state.site.pages.find((page) => page.id === state.site.activePageId)
  return activePage?.rootId ?? state.rootId
}

export const projectSnapshot = (state: EditorProject): EditorProject => ({
  projectName: state.projectName,
  rootId: activeRootId(state),
  nodesById: state.nodesById,
  mode: state.mode,
  flows: state.flows,
  site: state.site,
})

const withAutosave = (state: EditorState) => {
  const payload: EditorProject = projectSnapshot(state)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(state.submissions))
  localStorage.setItem(DATA_SOURCES_KEY, JSON.stringify(state.dataSources))
}

const fallbackTemplate = baseTemplate()
const initialProjectRaw = safeParse<EditorProject>(localStorage.getItem(STORAGE_KEY), fallbackTemplate)
const initialProject: EditorProject = {
  ...initialProjectRaw,
  flows: initialProjectRaw.flows ?? fallbackTemplate.flows,
  site: initialProjectRaw.site ?? fallbackTemplate.site,
  rootId: initialProjectRaw.rootId ?? fallbackTemplate.rootId,
}
const initialSubmissions = safeParse<SubmissionMap>(localStorage.getItem(SUBMISSIONS_KEY), {})
const initialDataSources = safeParse<Record<string, DataSourceDef>>(localStorage.getItem(DATA_SOURCES_KEY), {})

setDataSourceResolver((id) => useEditorStore.getState().dataSources[id])

export const useEditorStore = create<EditorState>((set, get) => ({
  ...initialProject,
import { defaultBuilderConfig } from '../config/loadBuilderConfig'
import { createId, createNode, type Node, type NodeType } from '../types/schema'
import { projectSnapshot } from './helpers/projectSnapshot'
import { createFlowsSlice } from './slices/flowsSlice'
import { createNodesSlice } from './slices/nodesSlice'
import { createPersistenceSlice, initialProject, initialSubmissions } from './slices/persistenceSlice'
import { createSiteSlice } from './slices/siteSlice'
import { createUiSlice } from './slices/uiSlice'
import type { EditorStore } from './storeTypes'

export { projectSnapshot }

const project = initialProject()

export const useEditorStore = create<EditorStore>()((...args) => ({
  ...project,
  selectedNodeId: null,
  activeBreakpoint: 'desktop',
  submissions: initialSubmissions,
  dataSources: initialDataSources,
  submissions: initialSubmissions(),
  builderConfig: defaultBuilderConfig,

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
        if (id === activeRootId(state)) return
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


  replaceProps(id, nextProps) {
    set(
      produce((state: EditorState) => {
        const node = state.nodesById[id]
        if (!node) return
        node.props = nextProps as Node['props']
      }),
    )
    withAutosave(get())
  },

  setCustomCss(id, customCss) {
    set(
      produce((state: EditorState) => {
        const node = state.nodesById[id]
        if (!node) return
        node.customCss = customCss
      }),
    )
    withAutosave(get())
  },

  setBindings(id, bindings) {
    set(
      produce((state: EditorState) => {
        const node = state.nodesById[id]
        if (!node) return
        node.bindings = bindings
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
    return JSON.stringify(projectSnapshot(state), null, 2)
  },

  hydrate(json) {
    const payload = safeParse<EditorProject>(json, baseTemplate())
    const ensured = {
      ...payload,
      flows: payload.flows ?? baseTemplate().flows,
      site: payload.site ?? baseTemplate().site,
    }
    set({ ...ensured, selectedNodeId: null })
    withAutosave(get())
  },

  reset() {
    set({ ...baseTemplate(), selectedNodeId: null, submissions: {}, dataSources: {} })
    withAutosave(get())
  },

  setBuilderConfig(builderConfig) {
    set({ builderConfig })
  },

  createFlow(name) {
    set(
      produce((state: EditorState) => {
        const id = `flow-${createId()}`
        const flow = createDefaultFlow(id, name || 'Untitled Flow')
        state.flows.flowsById[id] = flow
        state.flows.flowOrder.push(id)
        state.flows.activeFlowId = id
      }),
    )
    withAutosave(get())
  },

  deleteFlow(id) {
    set(
      produce((state: EditorState) => {
        if (!state.flows.flowsById[id]) return
        delete state.flows.flowsById[id]
        state.flows.flowOrder = state.flows.flowOrder.filter((flowId) => flowId !== id)
        if (state.flows.activeFlowId === id) {
          state.flows.activeFlowId = state.flows.flowOrder[0] ?? null
        }
      }),
    )
    withAutosave(get())
  },

  selectFlow(id) {
    set(
      produce((state: EditorState) => {
        state.flows.activeFlowId = id
      }),
    )
  },

  renameFlow(id, name) {
    set(
      produce((state: EditorState) => {
        const flow: FlowDefinition | undefined = state.flows.flowsById[id]
        if (!flow) return
        flow.name = name
        flow.updatedAt = new Date().toISOString()
      }),
    )
    withAutosave(get())
  },

  upsertFlowVariable(flowId, key, variable) {
    set(
      produce((state: EditorState) => {
        const flow = state.flows.flowsById[flowId]
        if (!flow || !key.trim()) return
        flow.variables[key.trim()] = variable
        flow.updatedAt = new Date().toISOString()
      }),
    )
    withAutosave(get())
  },

  removeFlowVariable(flowId, key) {
    set(
      produce((state: EditorState) => {
        const flow = state.flows.flowsById[flowId]
        if (!flow) return
        delete flow.variables[key]
        flow.updatedAt = new Date().toISOString()
      }),
    )
    withAutosave(get())
  },

  addPage(name, path) {
    set(
      produce((state: EditorState) => {
        const root = createNode('page', `page-root-${createId()}`)
        const section = createNode('section')
        section.children = []
        root.children = [section.id]
        state.nodesById[root.id] = root
        state.nodesById[section.id] = section

        const pageId = `page-${createId()}`
        const safePath = path.startsWith('/') ? path : `/${path || pageId}`
        const nextPage: PageDef = { id: pageId, name: name || 'New Page', path: safePath, rootId: root.id, title: name || 'New Page' }
        state.site.pages.push(nextPage)
        state.site.activePageId = pageId
        state.rootId = root.id
      }),
    )
    withAutosave(get())
  },

  selectPage(pageId) {
    set(
      produce((state: EditorState) => {
        const page = state.site.pages.find((item) => item.id === pageId)
        if (!page) return
        state.site.activePageId = pageId
        state.rootId = page.rootId
        state.selectedNodeId = null
      }),
    )
  },

  updatePage(pageId, patch) {
    set(
      produce((state: EditorState) => {
        const page = state.site.pages.find((item) => item.id === pageId)
        if (!page) return
        if (patch.name !== undefined) page.name = patch.name
        if (patch.path !== undefined) page.path = patch.path.startsWith('/') ? patch.path : `/${patch.path}`
        if (patch.title !== undefined) page.title = patch.title
      }),
    )
    withAutosave(get())
  },

  removePage(pageId) {
    set(
      produce((state: EditorState) => {
        if (state.site.pages.length <= 1) return
        const page = state.site.pages.find((item) => item.id === pageId)
        if (!page) return
        state.site.pages = state.site.pages.filter((item) => item.id !== pageId)
        const next = state.site.pages[0]
        state.site.activePageId = next.id
        state.rootId = next.rootId
      }),
    )
    withAutosave(get())
  },

  duplicateNode(id) {
    set(
      produce((state: EditorState) => {
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
    withAutosave(get())
  },

  moveNodeSibling(id, direction) {
    set(
      produce((state: EditorState) => {
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
    withAutosave(get())
  },

  upsertDataSource(dataSource) {
    set(
      produce((state: EditorState) => {
        state.dataSources[dataSource.id] = dataSource
      }),
    )
    withAutosave(get())
  },

  removeDataSource(id) {
    set(
      produce((state: EditorState) => {
        delete state.dataSources[id]
      }),
    )
    withAutosave(get())
  },

  async testDataSourceConnection(id) {
    try {
      const result = await fetchDataSource(id)
      return { ok: true, message: `Connection successful (${result.from})` }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Connection failed'
      return { ok: false, message }
    }
  },

  submitForm(formId, value) {
    set(
      produce((state: EditorState) => {
        const key = `${state.site.activePageId}:${formId}`
        const current = state.submissions[key] ?? []
        state.submissions[key] = [...current, value]
      }),
    )
    const state = get()
    void saveRemoteSubmission({
      pageId: state.site.activePageId,
      formId,
      payload: value,
      createdAt: new Date().toISOString(),
    }).catch(() => {
      // keep local submission even if json-server is down
    })
    withAutosave(get())
  },
  ...createPersistenceSlice(...args),
  ...createUiSlice(...args),
  ...createSiteSlice(...args),
  ...createNodesSlice(...args),
  ...createFlowsSlice(...args),
}))

export const buildNode = (type: NodeType): Node => createNode(type, createId()) as Node
