import type { EditorProject } from '../../types/schema'
import { activeRootId } from './activeRootId'

export const projectSnapshot = (state: EditorProject): EditorProject => ({
  projectName: state.projectName,
  rootId: activeRootId(state),
  nodesById: state.nodesById,
  mode: state.mode,
  flows: state.flows,
  site: state.site,
  ui: state.ui,
})
