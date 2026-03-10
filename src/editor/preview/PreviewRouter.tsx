import { MemoryRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useEffect, type ReactNode } from 'react'
import type { PageDef } from '../types/schema'

type PreviewRouterProps = {
  pages: PageDef[]
  activePageId: string
  onRoutePageChange: (pageId: string) => void
  renderPageTree: (rootId: string) => ReactNode
}

function RouteSync({ pages, onRoutePageChange }: { pages: PageDef[]; onRoutePageChange: (pageId: string) => void }) {
  const location = useLocation()

  useEffect(() => {
    const matched = pages.find((page) => page.path === location.pathname)
    if (matched) onRoutePageChange(matched.id)
  }, [location.pathname, onRoutePageChange, pages])

  return null
}

export default function PreviewRouter({ pages, activePageId, onRoutePageChange, renderPageTree }: PreviewRouterProps) {
  const activePage = pages.find((page) => page.id === activePageId) ?? pages[0]
  const initialPath = activePage?.path || '/'

  return (
    <MemoryRouter initialEntries={[initialPath]}>
      <RouteSync pages={pages} onRoutePageChange={onRoutePageChange} />
      <Routes>
        {pages.map((page) => (
          <Route key={page.id} path={page.path} element={<>{renderPageTree(page.rootId)}</>} />
        ))}
        <Route path='*' element={<Navigate to={pages[0]?.path || '/'} replace />} />
      </Routes>
    </MemoryRouter>
  )
}
