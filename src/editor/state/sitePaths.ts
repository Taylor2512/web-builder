import type { PageDef } from '../types/schema'

const slugifySegment = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')

export const normalizePagePath = (value: string, fallback = 'page'): string => {
  const raw = value.trim().replace(/^https?:\/\/[^/]+/i, '')
  const cleaned = raw.replace(/\/+/, '/').replace(/\/+$/g, '')
  if (!cleaned || cleaned === '/') return '/'
  const segments = cleaned
    .split('/')
    .filter(Boolean)
    .map((segment) => slugifySegment(segment) || slugifySegment(fallback) || 'page')
  return `/${segments.join('/')}`
}

export const validatePagePath = (path: string, pages: PageDef[], pageId?: string): string | null => {
  if (!path.startsWith('/')) return 'La ruta debe iniciar con “/”.'
  if (path.length > 120) return 'La ruta no puede superar 120 caracteres.'
  if (!/^\/[a-z0-9-/]*$/.test(path)) return 'La ruta solo admite minúsculas, números, guiones y “/”.'
  const duplicate = pages.find((page) => page.id !== pageId && page.path === path)
  if (duplicate) return `La ruta ya está usada por “${duplicate.name}”.`
  return null
}

export const ensureUniquePath = (candidate: string, pages: PageDef[], pageId?: string): string => {
  if (!pages.some((page) => page.id !== pageId && page.path === candidate)) return candidate
  let suffix = 2
  let next = `${candidate}-${suffix}`
  while (pages.some((page) => page.id !== pageId && page.path === next)) {
    suffix += 1
    next = `${candidate}-${suffix}`
  }
  return next
}
