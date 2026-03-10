import { createJsonServerRepository, pingJsonServer } from './jsonServerRepository'
import { createLocalRepository, seedLocalRepository } from './localRepository'
import type { PersistencePreference, PersistenceRepository } from './repository'

export * from './repository'

export const DEFAULT_PROJECT_ID = 'p1'
export const PERSISTENCE_PREFERENCE_KEY = 'web-builder-persistence-mode-v1'

const PING_TIMEOUT_MS = 900
let activeRepository: PersistenceRepository | null = null

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  return await new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error('json-server ping timeout')), timeoutMs)
    promise
      .then((value) => {
        window.clearTimeout(timer)
        resolve(value)
      })
      .catch((error: unknown) => {
        window.clearTimeout(timer)
        reject(error)
      })
  })
}

export const resolvePersistenceRepository = async (
  preference: PersistencePreference,
): Promise<PersistenceRepository> => {
  if (preference === 'local') {
    seedLocalRepository(DEFAULT_PROJECT_ID)
    return createLocalRepository()
  }

  if (preference === 'json-server') {
    return createJsonServerRepository()
  }

  try {
    await withTimeout(pingJsonServer(), PING_TIMEOUT_MS)
    return createJsonServerRepository()
  } catch {
    seedLocalRepository(DEFAULT_PROJECT_ID)
    return createLocalRepository()
  }
}

export const setActivePersistenceRepository = (repository: PersistenceRepository) => {
  activeRepository = repository
}

export const getActivePersistenceRepository = () => {
  if (activeRepository) return activeRepository
  seedLocalRepository(DEFAULT_PROJECT_ID)
  activeRepository = createLocalRepository()
  return activeRepository
}
