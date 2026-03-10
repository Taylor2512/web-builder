import { baseTemplate, type EditorProject } from '../types/schema'
import { safeParse } from '../state/helpers/safeParse'
import type {
  PersistenceRepository,
  ProjectSummary,
  SaveProjectInput,
  SaveSubmissionInput,
} from './repository'

const PROJECTS_KEY = 'web-builder-projects-v1'
const SUBMISSIONS_KEY = 'web-builder-submissions-v1'
const LEGACY_PROJECT_KEY = 'web-builder-project-v1'

type LocalProjectRecord = {
  id: string
  name: string
  data: EditorProject
  updatedAt: string
}

type LocalSubmissionRecord = SaveSubmissionInput & { id: string }

const readProjects = (): LocalProjectRecord[] => safeParse<LocalProjectRecord[]>(localStorage.getItem(PROJECTS_KEY), [])
const writeProjects = (records: LocalProjectRecord[]) => localStorage.setItem(PROJECTS_KEY, JSON.stringify(records))

const readSubmissions = (): LocalSubmissionRecord[] =>
  safeParse<LocalSubmissionRecord[]>(localStorage.getItem(SUBMISSIONS_KEY), [])

const writeSubmissions = (records: LocalSubmissionRecord[]) =>
  localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(records))

const normalizeLegacyProject = (input: EditorProject): EditorProject => {
  const fallbackTemplate = baseTemplate()
  return {
    ...input,
    flows: input.flows ?? fallbackTemplate.flows,
    site: input.site ?? fallbackTemplate.site,
    rootId: input.rootId ?? fallbackTemplate.rootId,
  }
}

const readLegacyProject = (): EditorProject | null => {
  const parsed = safeParse<EditorProject | null>(localStorage.getItem(LEGACY_PROJECT_KEY), null)
  return parsed ? normalizeLegacyProject(parsed) : null
}

export const createLocalRepository = (): PersistenceRepository => ({
  mode: 'local',

  async listProjects() {
    const records = readProjects()
    return records
      .map<ProjectSummary>(({ id, name, updatedAt }) => ({ id, name, updatedAt }))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  },

  async loadProject(projectId) {
    const found = readProjects().find((record) => record.id === projectId)
    return found?.data ?? null
  },

  async saveProject(input: SaveProjectInput) {
    const records = readProjects()
    const nextRecord: LocalProjectRecord = {
      id: input.id,
      name: input.name,
      data: input.data,
      updatedAt: new Date().toISOString(),
    }
    const index = records.findIndex((record) => record.id === input.id)
    if (index === -1) {
      writeProjects([...records, nextRecord])
      return
    }
    records[index] = nextRecord
    writeProjects(records)
  },

  async saveSubmission(input: SaveSubmissionInput) {
    const records = readSubmissions()
    records.push({ ...input, id: crypto.randomUUID() })
    writeSubmissions(records)
  },
})

export const seedLocalRepository = (projectId: string) => {
  const records = readProjects()
  if (records.length > 0) return

  const legacyProject = readLegacyProject()
  records.push({
    id: projectId,
    name: 'My Web Builder Project',
    data: legacyProject ?? baseTemplate(),
    updatedAt: new Date().toISOString(),
  })
  writeProjects(records)
}
