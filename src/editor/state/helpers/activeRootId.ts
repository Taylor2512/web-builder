import type { EditorProject } from '../../types/schema'

export const activeRootId = (state: EditorProject) => {
  const activePage = state.site.pages.find((page) => page.id === state.site.activePageId)
  return activePage?.rootId ?? state.rootId
}
