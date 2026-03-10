import type { BuilderConfig } from '../config/loadBuilderConfig'
import type { EditorProject } from '../types/schema'

const API_BASE =
  import.meta.env.VITE_JSON_SERVER_URL ?? (import.meta.env.PROD ? '/api' : 'http://localhost:3001')
const PROJECT_ID = 'p1'

type ProjectRecord = {
  id: string
  name: string
  data: EditorProject
  updatedAt: string
}

type SubmissionRecord = {
  id?: string
  pageId: string
  formId: string
  payload: unknown
  createdAt: string
}

const headers = { 'Content-Type': 'application/json' }

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...headers,
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    throw new Error(`json-server request failed (${response.status}) ${path}`)
  }

  return (await response.json()) as T
}

export const loadRemoteProject = async () => request<ProjectRecord>(`/projects/${PROJECT_ID}`)

export const saveRemoteProject = async (project: EditorProject, projectName: string) => {
  const payload: ProjectRecord = {
    id: PROJECT_ID,
    name: projectName,
    data: project,
    updatedAt: new Date().toISOString(),
  }

  return request<ProjectRecord>(`/projects/${PROJECT_ID}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export const saveRemoteSubmission = async (input: SubmissionRecord) =>
  request<SubmissionRecord>('/submissions', {
    method: 'POST',
    body: JSON.stringify(input),
  })

export const loadRemoteBuilderConfig = async () => request<BuilderConfig>('/builderConfig')
