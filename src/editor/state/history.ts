import type { EditorProject } from '../types/schema'

export type HistoryEntry = {
  id: string
  label: string
  timestamp: string
  snapshot: EditorProject
}

export type HistoryState = {
  past: HistoryEntry[]
  future: HistoryEntry[]
}

export const MAX_HISTORY_ENTRIES = 80

export const createHistoryEntry = (snapshot: EditorProject, label: string): HistoryEntry => ({
  id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
  label,
  timestamp: new Date().toISOString(),
  snapshot: structuredClone(snapshot),
})

export const pushHistory = (history: HistoryState, entry: HistoryEntry): HistoryState => {
  const nextPast = [...history.past, entry]
  return {
    past: nextPast.length > MAX_HISTORY_ENTRIES ? nextPast.slice(nextPast.length - MAX_HISTORY_ENTRIES) : nextPast,
    future: [],
  }
}
