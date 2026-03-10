import { useMemo, useState } from 'react'
import { useEditorStore } from '../state/useEditorStore'
import { TextInput } from '../../shared/ui'
import type { PageDef } from '../types/schema'
import { normalizePagePath, validatePagePath } from '../state/sitePaths'

/* ─── Page detail sub-view ───────────────────────────────── */
function PageSettings({ page, onBack }: { page: PageDef; onBack: () => void }) {
  const pages = useEditorStore((s) => s.site.pages)
  const updatePage = useEditorStore((s) => s.updatePage)
  const [pathDraft, setPathDraft] = useState(page.path)
  const pathError = useMemo(() => validatePagePath(normalizePagePath(pathDraft, page.name || page.id), pages, page.id), [page.id, page.name, pages, pathDraft])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', height: 46, borderBottom: '1px solid var(--border)', background: 'var(--panel)', flexShrink: 0 }}>
        <button type='button' onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 12, padding: '4px 8px', borderRadius: 6 }}>‹ Volver</button>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{page.name}</span>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Nombre de la página</label>
          <TextInput value={page.name} onChange={(e) => updatePage(page.id, { name: e.target.value })} />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>URL de la página</label>
          <TextInput
            value={pathDraft}
            onChange={(e) => setPathDraft(e.target.value)}
            onBlur={() => updatePage(page.id, { path: normalizePagePath(pathDraft, page.name || page.id) })}
            placeholder='/mi-pagina'
          />
          <div style={{ fontSize: 10, color: pathError ? 'var(--danger)' : 'var(--muted)', marginTop: 4 }}>
            {pathError ?? 'Ruta pública de la página (slug).'}
          </div>
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Título SEO</label>
          <TextInput value={page.title ?? ''} onChange={(e) => updatePage(page.id, { title: e.target.value })} placeholder='Título para el navegador' />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Descripción SEO</label>
          <TextInput value={page.meta?.description ?? ''} onChange={(e) => updatePage(page.id, { meta: { ...page.meta, description: e.target.value } })} placeholder='Descripción breve para buscadores' />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Keywords</label>
          <TextInput value={page.meta?.keywords ?? ''} onChange={(e) => updatePage(page.id, { meta: { ...page.meta, keywords: e.target.value } })} placeholder='marketing, saas, landing' />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Canonical URL</label>
          <TextInput value={page.meta?.canonicalUrl ?? ''} onChange={(e) => updatePage(page.id, { meta: { ...page.meta, canonicalUrl: e.target.value } })} placeholder='https://dominio.com/ruta' />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Open Graph</label>
          <TextInput value={page.meta?.ogTitle ?? ''} onChange={(e) => updatePage(page.id, { meta: { ...page.meta, ogTitle: e.target.value } })} placeholder='OG Title' />
          <div style={{ height: 6 }} />
          <TextInput value={page.meta?.ogDescription ?? ''} onChange={(e) => updatePage(page.id, { meta: { ...page.meta, ogDescription: e.target.value } })} placeholder='OG Description' />
          <div style={{ height: 6 }} />
          <TextInput value={page.meta?.ogImage ?? ''} onChange={(e) => updatePage(page.id, { meta: { ...page.meta, ogImage: e.target.value } })} placeholder='https://.../og-image.jpg' />
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text)' }}>
          <input type='checkbox' checked={page.meta?.noIndex ?? false} onChange={(e) => updatePage(page.id, { meta: { ...page.meta, noIndex: e.target.checked } })} />
          No indexar esta página (noindex)
        </label>
      </div>
    </div>
  )
}

type Tab = 'menu' | 'hidden'
export default function PagesPanel() {
  const pages = useEditorStore((s) => s.site.pages)
  const activePageId = useEditorStore((s) => s.site.activePageId)
  const addPage = useEditorStore((s) => s.addPage)
  const removePage = useEditorStore((s) => s.removePage)
  const selectPage = useEditorStore((s) => s.selectPage)
  const updatePage = useEditorStore((s) => s.updatePage)

  const [tab, setTab] = useState<Tab>('menu')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set())
  const [settingsPage, setSettingsPage] = useState<PageDef | null>(null)

  if (settingsPage) {
    const current = pages.find((p) => p.id === settingsPage.id) ?? settingsPage
    return <PageSettings page={current} onBack={() => setSettingsPage(null)} />
  }

  const toggleHidden = (id: string) => setHiddenIds((prev) => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  })

  const startEdit = (id: string, name: string) => { setEditingId(id); setEditName(name) }
  const commitEdit = () => {
    if (editingId && editName.trim()) updatePage(editingId, { name: editName.trim() })
    setEditingId(null)
  }

  const visiblePages = tab === 'hidden' ? pages.filter((p) => hiddenIds.has(p.id)) : pages.filter((p) => !hiddenIds.has(p.id))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '12px 14px 0', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>Páginas y menú del sitio</div>
        <div style={{ display: 'flex', gap: 0 }}>
          {([['menu', 'Menú del sitio'], ['hidden', 'Páginas ocultas']] as const).map(([key, label]) => (
            <button key={key} type='button' onClick={() => setTab(key)} style={{ flex: 1, padding: '7px 0', background: 'none', border: 'none', borderBottom: tab === key ? '2px solid var(--primary)' : '2px solid transparent', color: tab === key ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: tab === key ? 700 : 500, fontSize: 12, cursor: 'pointer' }}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {visiblePages.length === 0 && <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--muted)', fontSize: 12 }}>{tab === 'hidden' ? 'No hay páginas ocultas' : 'No hay páginas'}</div>}
        {visiblePages.map((page) => {
          const isActive = page.id === activePageId
          const isEditing = editingId === page.id
          const isHidden = hiddenIds.has(page.id)
          const isHomePage = pages.indexOf(page) === 0

          return (
            <div key={page.id} onClick={() => !isEditing && selectPage(page.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', cursor: 'pointer', background: isActive ? 'var(--primary-dim)' : 'transparent', borderLeft: `3px solid ${isActive ? 'var(--primary)' : 'transparent'}`, borderBottom: '1px solid var(--border)', transition: 'background 120ms', opacity: isHidden ? 0.55 : 1 }}>
              <span style={{ fontSize: 15, flexShrink: 0 }}>{isHomePage ? '🏠' : '📄'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                {isEditing ? (
                  <input autoFocus value={editName} onChange={(e) => setEditName(e.target.value)} onBlur={commitEdit} onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditingId(null) }} onClick={(e) => e.stopPropagation()} style={{ width: '100%', background: 'var(--surface-2)', border: '1px solid var(--primary)', borderRadius: 4, color: 'var(--text)', padding: '3px 7px', fontSize: 12, outline: 'none' }} />
                ) : (
                  <>
                    <div onDoubleClick={(e) => { e.stopPropagation(); startEdit(page.id, page.name) }} style={{ fontSize: 13, fontWeight: isActive ? 600 : 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.3 }}>{page.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{page.path}</div>
                  </>
                )}
              </div>

              <div style={{ display: 'flex', gap: 2, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                <button type='button' title={isHidden ? 'Mostrar en menú' : 'Ocultar del menú'} onClick={() => toggleHidden(page.id)} style={{ background: 'none', border: 'none', color: isHidden ? 'var(--warning)' : 'var(--muted)', cursor: 'pointer', padding: '3px 5px', fontSize: 13, borderRadius: 4, lineHeight: 1 }}>{isHidden ? '🚫' : '👁'}</button>
                <button type='button' title='Ajustes de página' onClick={() => setSettingsPage(page)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: '3px 5px', fontSize: 13, borderRadius: 4, lineHeight: 1 }}>⋯</button>
                {pages.length > 1 && <button type='button' title='Eliminar página' onClick={() => { if (confirm(`¿Eliminar "${page.name}"?`)) removePage(page.id) }} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '3px 5px', fontSize: 12, borderRadius: 4, lineHeight: 1 }}>✕</button>}
              </div>
            </div>
          )
        })}
      </div>

      {tab === 'menu' && (
        <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          <button type='button' onClick={() => addPage(`Página ${pages.length + 1}`, `/page-${pages.length + 1}`)} style={{ width: '100%', padding: '9px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'background 120ms' }}>+ Agregar ítem de menú</button>
        </div>
      )}
    </div>
  )
}
