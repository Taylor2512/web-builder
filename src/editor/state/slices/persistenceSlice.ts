import { produce } from 'immer'
import type { StateCreator } from 'zustand'
import {
  DEFAULT_PROJECT_ID,
  PERSISTENCE_PREFERENCE_KEY,
  getActivePersistenceRepository,
  resolvePersistenceRepository,
  setActivePersistenceRepository,
  type PersistencePreference,
} from '../../persistence'
import { baseTemplate, type EditorProject } from '../../types/schema'
import { projectSnapshot } from '../helpers/projectSnapshot'
import { safeParse } from '../helpers/safeParse'
import type { EditorStore, PersistenceActions, SubmissionMap } from '../storeTypes'

const STORAGE_KEY = 'web-builder-project-v1'
const SUBMISSIONS_KEY = 'web-builder-form-submissions-v1'

const resolveInitialPreference = (): PersistencePreference => {
  const raw = localStorage.getItem(PERSISTENCE_PREFERENCE_KEY)
  if (raw === 'local' || raw === 'json-server' || raw === 'auto') return raw
  return 'auto'
}

const normalizeProject = (input: EditorProject): EditorProject => {
  const fallbackTemplate = baseTemplate()
  return {
    ...input,
    flows: input.flows ?? fallbackTemplate.flows,
    site: input.site ?? fallbackTemplate.site,
    rootId: input.rootId ?? fallbackTemplate.rootId,
    ui: {
      ...fallbackTemplate.ui,
      ...input.ui,
    },
  }
}

export const initialProject = (): EditorProject => {
  const fallbackTemplate = baseTemplate()
  const initialProjectRaw = safeParse<EditorProject>(localStorage.getItem(STORAGE_KEY), fallbackTemplate)
  return normalizeProject(initialProjectRaw)
}

export const initialSubmissions = (): SubmissionMap => safeParse<SubmissionMap>(localStorage.getItem(SUBMISSIONS_KEY), {})

export const initialPersistencePreference = resolveInitialPreference()

export const createPersistenceSlice: StateCreator<EditorStore, [], [], PersistenceActions> = (set, get) => ({
  async setPersistencePreference(preference) {
    set({ persistencePreference: preference, persistenceError: null })
    localStorage.setItem(PERSISTENCE_PREFERENCE_KEY, preference)

    try {
      const repository = await resolvePersistenceRepository(preference)
      setActivePersistenceRepository(repository)
      set({ persistenceMode: repository.mode, persistenceError: null })

      const projects = await repository.listProjects()
      const hasDefault = projects.some((project) => project.id === DEFAULT_PROJECT_ID)
      const remoteProject = hasDefault ? await repository.loadProject(DEFAULT_PROJECT_ID) : null
      if (remoteProject) {
        set({ ...normalizeProject(remoteProject), selectedNodeId: null })
        get().persistProject()
        return
      }
      get().persistProject()
    } catch {
      set({ persistenceError: 'No se pudo cambiar el modo de persistencia.' })
    }
  },

  persistProject() {
    const state = get()
    const snapshot = projectSnapshot(state)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
    localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(state.submissions))

    const repository = getActivePersistenceRepository()
    void repository
      .saveProject({
        id: DEFAULT_PROJECT_ID,
        name: state.projectName,
        data: snapshot,
      })
      .then(() => {
        set({ persistenceError: null })
      })
      .catch(() => {
        set({ persistenceError: `No se pudo guardar en modo ${repository.mode}.` })
      })
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
    set({ ...normalizeProject(payload), selectedNodeId: null })
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
    const state = get()
    const timestamp = new Date().toISOString()
    const submissionEntry = {
      pageId: state.site.activePageId,
      formId,
      timestamp,
      payload: value,
    }

    set(
      produce((state: EditorStore) => {
        const key = `${state.site.activePageId}:${formId}`
        const current = state.submissions[key] ?? []
        state.submissions[key] = [...current, submissionEntry]
      }),
    )

    const latestState = get()
    const repository = getActivePersistenceRepository()
    void repository
      .saveSubmission({
        projectId: DEFAULT_PROJECT_ID,
        pageId: latestState.site.activePageId,
        formId,
        payload: value,
        createdAt: timestamp,
      })
      .catch(() => {
        set({ persistenceError: `No se pudo guardar el envío en modo ${repository.mode}.` })
      })

    get().persistProject()
  },
})
