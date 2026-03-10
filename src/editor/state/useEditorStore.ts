import { create } from 'zustand'
import { defaultBuilderConfig } from '../config/loadBuilderConfig'
import { createId, createNode, type Node, type NodeType } from '../types/schema'
import { projectSnapshot } from './helpers/projectSnapshot'
import { createFlowsSlice } from './slices/flowsSlice'
import { createNodesSlice } from './slices/nodesSlice'
import { createPersistenceSlice, initialPersistencePreference, initialProject, initialSubmissions } from './slices/persistenceSlice'
import { createSiteSlice } from './slices/siteSlice'
import { createUiSlice } from './slices/uiSlice'
import type { EditorStore } from './storeTypes'

export { projectSnapshot }

const project = initialProject()

export const useEditorStore = create<EditorStore>()((...args) => ({
  ...project,
  selectedNodeId: null,
  activeBreakpoint: 'desktop',
  submissions: initialSubmissions(),
  builderConfig: defaultBuilderConfig,
  persistenceMode: 'local',
  persistencePreference: initialPersistencePreference,
  persistenceError: null,
  ...createPersistenceSlice(...args),
  ...createUiSlice(...args),
  ...createSiteSlice(...args),
  ...createNodesSlice(...args),
  ...createFlowsSlice(...args),
}))

export const buildNode = (type: NodeType): Node => createNode(type, createId()) as Node
