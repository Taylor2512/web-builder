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
import {
  instantiateTemplateNodes,
  loadLibraryState,
  saveLibraryState,
  serializeSelectionAsTemplate,
  type LibraryTemplate,
} from '../library'
import { ensureUniquePath, normalizePagePath } from './sitePaths'

const STORAGE_KEY = 'web-builder-project-v1'
const SUBMISSIONS_KEY = 'web-builder-form-submissions-v1'

type SubmissionMap = Record<string, unknown[]>

type PublishSnapshot = { id: string; label: string; timestamp: string; project: EditorProject }

type EditorState = EditorProject & {
  selectedNodeId: NodeId | null
  activeBreakpoint: Breakpoint
  submissions: SubmissionMap
  builderConfig: BuilderConfig
  libraryTemplates: LibraryTemplate[]
  historyPast: EditorProject[]
  historyFuture: EditorProject[]
  publishSnapshots: PublishSnapshot[]
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
  toggleLeftPanel: () => void
  toggleRightPanel: () => void
  togglePanels: () => void
  setLeftPanelWidth: (width: number) => void
  setRightPanelWidth: (width: number) => void
  toggleFocusMode: () => void
  setFocusMode: (active: boolean) => void
  setProjectName: (name: string) => void
  setActiveLeftPanel: (panel: 'blocks' | 'layers' | 'pages' | 'design' | null) => void
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
  updatePage: (pageId: string, patch: Partial<Pick<PageDef, 'name' | 'path' | 'title' | 'meta'>>) => void
  removePage: (pageId: string) => void
  duplicateNode: (id: NodeId) => void
  moveNodeSibling: (id: NodeId, direction: 'up' | 'down') => void
  toggleNodeVisibility: (id: NodeId) => void
  showNode: (id: NodeId) => void
  showAllNodes: () => void
  saveSelectionAsTemplate: (name: string) => void
  insertTemplate: (templateId: string, parentId: NodeId, index?: number) => void
  removeTemplate: (templateId: string) => void
  undo: () => void
  redo: () => void
  createPublishSnapshot: (label?: string) => void
  restorePublishSnapshot: (snapshotId: string) => void
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

const normalizeSite = (project: EditorProject): EditorProject['site'] => {
  const pages = (project.site?.pages ?? []).map((page) => ({
    ...page,
    path: normalizePagePath(page.path || page.id, page.id),
    meta: page.meta ? { ...page.meta } : undefined,
  }))

  if (!pages.length) {
    const fallback = baseTemplate().site
    return fallback
  }

  const activePageId = pages.some((page) => page.id === project.site.activePageId)
    ? project.site.activePageId
    : pages[0].id

  return { pages, activePageId }
}

const clampPanelWidth = (width: number) => Math.max(180, Math.min(width, 520))

const normalizeUi = (project: EditorProject): EditorProject['ui'] => {
  const fallback = baseTemplate().ui
  return {
    leftPanelOpen: project.ui?.leftPanelOpen ?? fallback.leftPanelOpen,
    rightPanelOpen: project.ui?.rightPanelOpen ?? fallback.rightPanelOpen,
    leftPanelWidth: clampPanelWidth(project.ui?.leftPanelWidth ?? fallback.leftPanelWidth),
    rightPanelWidth: clampPanelWidth(project.ui?.rightPanelWidth ?? fallback.rightPanelWidth),
    focusMode: project.ui?.focusMode ?? fallback.focusMode,
    activeLeftPanel: (project.ui?.activeLeftPanel ?? fallback.activeLeftPanel) as 'blocks' | 'layers' | 'pages' | 'design' | null,
  }
}

export const projectSnapshot = (state: EditorProject): EditorProject => ({
  projectName: state.projectName,
  rootId: activeRootId(state),
  nodesById: state.nodesById,
  mode: state.mode,
  flows: state.flows,
  site: state.site,
  ui: state.ui,
})

type StoreSetter = (
  partial:
    | EditorState
    | Partial<EditorState>
    | ((state: EditorState) => EditorState | Partial<EditorState>),
  replace?: false,
) => void

const withAutosave = (state: EditorState, set: StoreSetter) => {
  const payload: EditorProject = projectSnapshot(state)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(state.submissions))
  saveLibraryState({ templates: state.libraryTemplates })

  set(
    produce((draft: EditorState) => {
      const last = draft.historyPast[draft.historyPast.length - 1]
      const isSame = last ? JSON.stringify(last) === JSON.stringify(payload) : false
      if (!isSame) {
        draft.historyPast.push(structuredClone(payload))
        if (draft.historyPast.length > 80) draft.historyPast.shift()
      }
      draft.historyFuture = []
    }),
  )
}

const fallbackTemplate = baseTemplate()
const initialProjectRaw = safeParse<EditorProject>(localStorage.getItem(STORAGE_KEY), fallbackTemplate)
const initialProject: EditorProject = {
  ...initialProjectRaw,
  flows: initialProjectRaw.flows ?? fallbackTemplate.flows,
  site: normalizeSite(initialProjectRaw),
  rootId: initialProjectRaw.rootId ?? fallbackTemplate.rootId,
  ui: normalizeUi(initialProjectRaw),
}
const initialSubmissions = safeParse<SubmissionMap>(localStorage.getItem(SUBMISSIONS_KEY), {})
const initialLibrary = loadLibraryState()

const PUBLICATION_SNAPSHOTS_KEY = 'web-builder-publication-snapshots-v1'
const initialHistory = [structuredClone(initialProject)]
const initialPublishSnapshots = safeParse<PublishSnapshot[]>(localStorage.getItem(PUBLICATION_SNAPSHOTS_KEY), [])

const persistPublicationSnapshots = (snapshots: PublishSnapshot[]) => {
  localStorage.setItem(PUBLICATION_SNAPSHOTS_KEY, JSON.stringify(snapshots))
}

export const useEditorStore = create<EditorState>((set, get) => ({
  ...initialProject,
  selectedNodeId: null,
  activeBreakpoint: 'desktop',
  submissions: initialSubmissions,
  libraryTemplates: initialLibrary.templates,
  builderConfig: defaultBuilderConfig,
  historyPast: initialHistory,
  historyFuture: [],
  publishSnapshots: initialPublishSnapshots,

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
    withAutosave(get(), set)
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
    withAutosave(get(), set)
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
    withAutosave(get(), set)
  },

  updateProps(id, patch) {
    set(
      produce((state: EditorState) => {
        const node = state.nodesById[id]
        if (!node) return
        node.props = { ...node.props, ...patch } as Node['props']
      }),
    )
    withAutosave(get(), set)
  },


  replaceProps(id, nextProps) {
    set(
      produce((state: EditorState) => {
        const node = state.nodesById[id]
        if (!node) return
        node.props = nextProps as Node['props']
      }),
    )
    withAutosave(get(), set)
  },

  setCustomCss(id, customCss) {
    set(
      produce((state: EditorState) => {
        const node = state.nodesById[id]
        if (!node) return
        node.customCss = customCss
      }),
    )
    withAutosave(get(), set)
  },

  setBindings(id, bindings) {
    set(
      produce((state: EditorState) => {
        const node = state.nodesById[id]
        if (!node) return
        node.bindings = bindings
      }),
    )
    withAutosave(get(), set)
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
    withAutosave(get(), set)
  },

  selectNode(id) {
    set({ selectedNodeId: id })
  },

  setMode(mode) {
    set({ mode })
    withAutosave(get(), set)
  },

  setBreakpoint(activeBreakpoint) {
    set({ activeBreakpoint })
  },

  toggleLeftPanel() {
    set((state) => ({ ui: { ...state.ui, leftPanelOpen: !state.ui.leftPanelOpen } }))
    withAutosave(get(), set)
  },

  toggleRightPanel() {
    set((state) => ({ ui: { ...state.ui, rightPanelOpen: !state.ui.rightPanelOpen } }))
    withAutosave(get(), set)
  },

  togglePanels() {
    const { leftPanelOpen, rightPanelOpen } = get().ui
    const nextOpen = !(leftPanelOpen && rightPanelOpen)
    set((state) => ({ ui: { ...state.ui, leftPanelOpen: nextOpen, rightPanelOpen: nextOpen } }))
    withAutosave(get(), set)
  },

  setLeftPanelWidth(width) {
    set((state) => ({ ui: { ...state.ui, leftPanelWidth: clampPanelWidth(width) } }))
    withAutosave(get(), set)
  },

  setRightPanelWidth(width) {
    set((state) => ({ ui: { ...state.ui, rightPanelWidth: clampPanelWidth(width) } }))
    withAutosave(get(), set)
  },

  toggleFocusMode() {
    set((state) => ({ ui: { ...state.ui, focusMode: !state.ui.focusMode } }))
    withAutosave(get(), set)
  },

  setFocusMode(focusMode) {
    set((state) => ({ ui: { ...state.ui, focusMode } }))
    withAutosave(get(), set)
  },

  setActiveLeftPanel(panel) {
    set((state) => ({
      ui: {
        ...state.ui,
        activeLeftPanel: panel,
        leftPanelOpen: panel !== null,
      },
    }))
    withAutosave(get(), set)
  },

  setProjectName(projectName) {
    set({ projectName })
    withAutosave(get(), set)
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
      site: normalizeSite(payload),
      ui: normalizeUi(payload),
    }
    set({ ...ensured, selectedNodeId: null })
    withAutosave(get(), set)
  },

  reset() {
    set({ ...baseTemplate(), selectedNodeId: null, submissions: {} })
    withAutosave(get(), set)
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
    withAutosave(get(), set)
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
    withAutosave(get(), set)
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
    withAutosave(get(), set)
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
    withAutosave(get(), set)
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
    withAutosave(get(), set)
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
        const normalized = normalizePagePath(path || name || pageId, pageId)
        const safePath = ensureUniquePath(normalized, state.site.pages)
        const pageName = name || 'New Page'
        const nextPage: PageDef = {
          id: pageId,
          name: pageName,
          path: safePath,
          rootId: root.id,
          title: pageName,
          meta: { description: '', ogTitle: pageName, ogDescription: '', noIndex: false },
        }
        state.site.pages.push(nextPage)
        state.site.activePageId = pageId
        state.rootId = root.id
      }),
    )
    withAutosave(get(), set)
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
        if (patch.path !== undefined) {
          const normalized = normalizePagePath(patch.path, page.name || page.id)
          page.path = ensureUniquePath(normalized, state.site.pages, page.id)
        }
        if (patch.title !== undefined) page.title = patch.title
        if (patch.meta !== undefined) page.meta = { ...page.meta, ...patch.meta }
      }),
    )
    withAutosave(get(), set)
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
    withAutosave(get(), set)
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
    withAutosave(get(), set)
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
    withAutosave(get(), set)
  },


  toggleNodeVisibility(id) {
    set(
      produce((state: EditorState) => {
        const node = state.nodesById[id]
        if (!node) return
        node.isHidden = !node.isHidden
      }),
    )
    withAutosave(get(), set)
  },

  showNode(id) {
    set(
      produce((state: EditorState) => {
        const node = state.nodesById[id]
        if (!node) return
        node.isHidden = false
      }),
    )
    withAutosave(get(), set)
  },

  showAllNodes() {
    set(
      produce((state: EditorState) => {
        Object.values(state.nodesById).forEach((node) => {
          node.isHidden = false
        })
      }),
    )
    withAutosave(get(), set)
  },

  undo() {
    const state = get()
    if (state.historyPast.length < 2) return
    const current = state.historyPast[state.historyPast.length - 1]
    const previous = state.historyPast[state.historyPast.length - 2]
    set(
      produce((draft: EditorState) => {
        draft.projectName = previous.projectName
        draft.rootId = previous.rootId
        draft.nodesById = structuredClone(previous.nodesById)
        draft.mode = previous.mode
        draft.flows = structuredClone(previous.flows)
        draft.site = structuredClone(previous.site)
        draft.ui = structuredClone(previous.ui)
        draft.selectedNodeId = null
        draft.historyPast = draft.historyPast.slice(0, -1)
        draft.historyFuture = [structuredClone(current), ...draft.historyFuture]
      }),
    )
    const latest = get()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projectSnapshot(latest)))
  },

  redo() {
    const state = get()
    if (!state.historyFuture.length) return
    const next = state.historyFuture[0]
    set(
      produce((draft: EditorState) => {
        draft.projectName = next.projectName
        draft.rootId = next.rootId
        draft.nodesById = structuredClone(next.nodesById)
        draft.mode = next.mode
        draft.flows = structuredClone(next.flows)
        draft.site = structuredClone(next.site)
        draft.ui = structuredClone(next.ui)
        draft.selectedNodeId = null
        draft.historyPast.push(structuredClone(next))
        draft.historyFuture = draft.historyFuture.slice(1)
      }),
    )
    const latest = get()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projectSnapshot(latest)))
  },

  createPublishSnapshot(label) {
    const state = get()
    const snapshot: PublishSnapshot = {
      id: `pub-${createId()}`,
      label: label?.trim() || `Snapshot ${new Date().toLocaleString()}`,
      timestamp: new Date().toISOString(),
      project: projectSnapshot(state),
    }
    set(
      produce((draft: EditorState) => {
        draft.publishSnapshots = [snapshot, ...draft.publishSnapshots].slice(0, 20)
      }),
    )
    persistPublicationSnapshots(get().publishSnapshots)
  },

  restorePublishSnapshot(snapshotId) {
    const snapshot = get().publishSnapshots.find((item) => item.id === snapshotId)
    if (!snapshot) return
    set(
      produce((draft: EditorState) => {
        draft.projectName = snapshot.project.projectName
        draft.rootId = snapshot.project.rootId
        draft.nodesById = structuredClone(snapshot.project.nodesById)
        draft.mode = snapshot.project.mode
        draft.flows = structuredClone(snapshot.project.flows)
        draft.site = structuredClone(snapshot.project.site)
        draft.ui = structuredClone(snapshot.project.ui)
        draft.selectedNodeId = null
      }),
    )
    withAutosave(get(), set)
  },

  saveSelectionAsTemplate(name) {
    set(
      produce((state: EditorState) => {
        const selectionId = state.selectedNodeId
        if (!selectionId || selectionId === activeRootId(state)) return
        const serialized = serializeSelectionAsTemplate({
          selectionId,
          sourceNodesById: state.nodesById,
          name,
        })
        if (!serialized) return
        state.libraryTemplates.unshift(serialized)
      }),
    )
    withAutosave(get(), set)
  },

  insertTemplate(templateId, parentId, index) {
    set(
      produce((state: EditorState) => {
        const template = state.libraryTemplates.find((item) => item.id === templateId)
        const parent = state.nodesById[parentId]
        if (!template || !parent) return
        const templateRoot = template.nodesById[template.rootNodeId]
        if (!templateRoot) return

        const allowedParents = state.builderConfig.constraints.allowedParents[templateRoot.type]
        if (allowedParents && !allowedParents.includes(parent.type)) return

        const maxChildren = state.builderConfig.constraints.maxChildren[parent.type]
        if (typeof maxChildren === 'number' && parent.children.length >= maxChildren) return

        const instance = instantiateTemplateNodes(template)
        Object.assign(state.nodesById, instance.nodesById)

        if (typeof index === 'number') parent.children.splice(index, 0, instance.rootNodeId)
        else parent.children.push(instance.rootNodeId)
      }),
    )
    withAutosave(get(), set)
  },

  removeTemplate(templateId) {
    set(
      produce((state: EditorState) => {
        state.libraryTemplates = state.libraryTemplates.filter((template) => template.id !== templateId)
      }),
    )
    withAutosave(get(), set)
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
    withAutosave(get(), set)
  },
}))

export const buildNode = (type: NodeType): Node => createNode(type, createId()) as Node
