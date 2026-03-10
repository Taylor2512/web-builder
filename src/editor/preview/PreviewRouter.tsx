import { MemoryRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useEffect, type ReactNode } from 'react'
import type { PageDef } from '../types/schema'
import { normalizePagePath } from '../state/sitePaths'

type PreviewRouterProps = {
  pages: PageDef[]
  activePageId: string
  onRoutePageChange: (pageId: string) => void
  renderPageTree: (rootId: string) => ReactNode
}

function RouteSync({ pages, onRoutePageChange }: { pages: PageDef[]; onRoutePageChange: (pageId: string) => void }) {
  const location = useLocation()

  useEffect(() => {
    const pathname = normalizePagePath(location.pathname)
    const matched = pages.find((page) => normalizePagePath(page.path) === pathname)
    if (matched) onRoutePageChange(matched.id)
  }, [location.pathname, onRoutePageChange, pages])

  return null
}

export default function PreviewRouter({ pages, activePageId, onRoutePageChange, renderPageTree }: PreviewRouterProps) {
  const normalizedPages = pages.map((page) => ({ ...page, path: normalizePagePath(page.path, page.id) }))
  const uniquePages = normalizedPages.filter((page, index, all) => all.findIndex((item) => item.path === page.path) === index)
  const activePage = uniquePages.find((page) => page.id === activePageId) ?? uniquePages[0]
  const initialPath = activePage?.path || '/'

  return (
    <MemoryRouter initialEntries={[initialPath]}>
      <RouteSync pages={uniquePages} onRoutePageChange={onRoutePageChange} />
      <Routes>
        {uniquePages.map((page) => (
          <Route key={page.id} path={page.path} element={<>{renderPageTree(page.rootId)}</>} />
        ))}
        <Route path='*' element={<Navigate to={uniquePages[0]?.path || '/'} replace />} />
      </Routes>
    </MemoryRouter>
  )
}
