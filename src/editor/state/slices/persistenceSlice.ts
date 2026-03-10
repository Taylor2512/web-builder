import { produce } from 'immer'
import type { StateCreator } from 'zustand'
import { saveRemoteSubmission } from '../../api/jsonServer'
import { baseTemplate, type EditorProject } from '../../types/schema'
import { projectSnapshot } from '../helpers/projectSnapshot'
import { safeParse } from '../helpers/safeParse'
import type { EditorStore, PersistenceActions, SubmissionMap } from '../storeTypes'

export const STORAGE_KEY = 'web-builder-project-v1'
export const SUBMISSIONS_KEY = 'web-builder-form-submissions-v1'

export const initialProject = (): EditorProject => {
  const fallbackTemplate = baseTemplate()
  const initialProjectRaw = safeParse<EditorProject>(localStorage.getItem(STORAGE_KEY), fallbackTemplate)
  return {
    ...initialProjectRaw,
    flows: initialProjectRaw.flows ?? fallbackTemplate.flows,
    site: initialProjectRaw.site ?? fallbackTemplate.site,
    rootId: initialProjectRaw.rootId ?? fallbackTemplate.rootId,
  }
}

export const initialSubmissions = (): SubmissionMap => safeParse<SubmissionMap>(localStorage.getItem(SUBMISSIONS_KEY), {})

export const createPersistenceSlice: StateCreator<EditorStore, [], [], PersistenceActions> = (set, get) => ({
  persistProject() {
    const state = get()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projectSnapshot(state)))
    localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(state.submissions))
  },

  setProjectName(projectName) {
    set({ projectName })
    get().persistProject()
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
    get().persistProject()
  },

  reset() {
    set({ ...baseTemplate(), selectedNodeId: null, submissions: {} })
    get().persistProject()
  },

  setBuilderConfig(builderConfig) {
    set({ builderConfig })
  },

  submitForm(formId, value) {
    set(
      produce((state: EditorStore) => {
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
    get().persistProject()
  },
})
