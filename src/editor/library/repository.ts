import { safeParse } from '../state/helpers/safeParse'
import type { LibraryState } from './types'

export const LIBRARY_STORAGE_KEY = 'web-builder-library-v1'

const fallbackState: LibraryState = { templates: [] }

export const loadLibraryState = (): LibraryState => {
  return safeParse<LibraryState>(localStorage.getItem(LIBRARY_STORAGE_KEY), fallbackState)
}

export const saveLibraryState = (state: LibraryState) => {
  localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(state))
}
