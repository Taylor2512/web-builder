import type {
  PersistenceRepository,
  ProjectSummary,
  SaveProjectInput,
  SaveSubmissionInput,
} from './repository'

const API_BASE = import.meta.env.VITE_JSON_SERVER_URL ?? 'http://localhost:3001'
const headers = { 'Content-Type': 'application/json' }

type JsonProjectRecord = SaveProjectInput & { updatedAt: string }
type JsonSubmissionRecord = SaveSubmissionInput & { id?: string }

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...headers,
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    const error = new Error(`json-server request failed (${response.status}) ${path}`) as Error & { status?: number }
    error.status = response.status
    throw error
  }

  return (await response.json()) as T
}

export const pingJsonServer = async () => {
  await request<unknown[]>('/projects?_limit=1')
}

export const createJsonServerRepository = (): PersistenceRepository => ({
  mode: 'json-server',

  async listProjects() {
    const records = await request<JsonProjectRecord[]>('/projects')
    return records
      .map<ProjectSummary>(({ id, name, updatedAt }) => ({ id, name, updatedAt }))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  },

  async loadProject(projectId) {
    try {
      const record = await request<JsonProjectRecord>(`/projects/${projectId}`)
      return record.data
    } catch (error) {
      if (typeof error === 'object' && error && 'status' in error && error.status === 404) return null
      throw error
    }
  },

  async saveProject(input: SaveProjectInput) {
    const payload: JsonProjectRecord = {
      ...input,
      updatedAt: new Date().toISOString(),
    }

    await request<JsonProjectRecord>(`/projects/${input.id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  },

  async saveSubmission(input: SaveSubmissionInput) {
    await request<JsonSubmissionRecord>('/submissions', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  },
})
