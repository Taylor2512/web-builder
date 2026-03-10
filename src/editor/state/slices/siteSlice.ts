import { produce } from 'immer'
import type { StateCreator } from 'zustand'
import { createId, createNode, type PageDef } from '../../types/schema'
import { ensureUniquePath, normalizePagePath } from '../sitePaths'
import type { EditorStore, SiteActions } from '../storeTypes'

export const createSiteSlice: StateCreator<EditorStore, [], [], SiteActions> = (set, get) => ({
  addPage(name, path) {
    set(
      produce((state: EditorStore) => {
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
          meta: {
            description: '',
            ogTitle: pageName,
            ogDescription: '',
            noIndex: false,
          },
        }
        state.site.pages.push(nextPage)
        state.site.activePageId = pageId
        state.rootId = root.id
      }),
    )
    get().persistProject()
  },

  selectPage(pageId) {
    set(
      produce((state: EditorStore) => {
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
      produce((state: EditorStore) => {
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
    get().persistProject()
  },

  removePage(pageId) {
    set(
      produce((state: EditorStore) => {
        if (state.site.pages.length <= 1) return
        const page = state.site.pages.find((item) => item.id === pageId)
        if (!page) return
        state.site.pages = state.site.pages.filter((item) => item.id !== pageId)
        const next = state.site.pages[0]
        state.site.activePageId = next.id
        state.rootId = next.rootId
      }),
    )
    get().persistProject()
  },
})
