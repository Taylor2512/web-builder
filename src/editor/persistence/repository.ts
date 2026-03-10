import type { EditorProject } from '../types/schema'

export type PersistenceMode = 'local' | 'json-server'
export type PersistencePreference = 'auto' | PersistenceMode

export type ProjectSummary = {
  id: string
  name: string
  updatedAt: string
}

export type SaveProjectInput = {
  id: string
  name: string
  data: EditorProject
}

export type SaveSubmissionInput = {
  projectId: string
  pageId: string
  formId: string
  payload: unknown
  createdAt: string
}

export interface PersistenceRepository {
  readonly mode: PersistenceMode
  listProjects(): Promise<ProjectSummary[]>
  loadProject(projectId: string): Promise<EditorProject | null>
  saveProject(input: SaveProjectInput): Promise<void>
  saveSubmission(input: SaveSubmissionInput): Promise<void>
}
