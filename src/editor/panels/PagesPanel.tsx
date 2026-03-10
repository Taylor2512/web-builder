import { useState } from 'react'
import { useEditorStore } from '../state/useEditorStore'
import { TextInput } from '../../shared/ui'
import type { PageDef } from '../types/schema'

/* ─── Page detail sub-view ───────────────────────────────── */
function PageSettings({ page, onBack }: { page: PageDef; onBack: () => void }) {
  const updatePage = useEditorStore((s) => s.updatePage)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '0 12px', height: 46, borderBottom: '1px solid var(--border)',
        background: 'var(--panel)', flexShrink: 0,
      }}>
        <button type='button' onClick={onBack}
          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 12, padding: '4px 8px', borderRadius: 6 }}>
          ‹ Volver
        </button>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {page.name}
        </span>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
            Nombre de la página
          </label>
          <TextInput value={page.name} onChange={(e) => updatePage(page.id, { name: e.target.value })} />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
            Título SEO
          </label>
          <TextInput value={page.title ?? ''} onChange={(e) => updatePage(page.id, { title: e.target.value })} placeholder='Título para el navegador' />
          <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>Se muestra en la pestaña del navegador y en los buscadores.</div>
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
            URL de la página
          </label>
          <TextInput value={page.path} onChange={(e) => updatePage(page.id, { path: e.target.value })} placeholder='/mi-pagina' />
          <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>Ruta interna de esta página.</div>
        </div>
        {page.meta !== undefined && (
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
              Descripción SEO
            </label>
            <TextInput
              value={page.meta?.description ?? ''}
              onChange={(e) => updatePage(page.id, { meta: { ...page.meta, description: e.target.value } })}
              placeholder='Descripción breve para buscadores'
            />
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Main Pages Panel ────────────────────────────────────── */
type Tab = 'menu' | 'hidden'
export default function PagesPanel() {
  const pages        = useEditorStore((s) => s.site.pages)
  const activePageId = useEditorStore((s) => s.site.activePageId)
  const addPage      = useEditorStore((s) => s.addPage)
  const removePage   = useEditorStore((s) => s.removePage)
  const selectPage   = useEditorStore((s) => s.selectPage)
  const updatePage   = useEditorStore((s) => s.updatePage)

  const [tab, setTab]             = useState<Tab>('menu')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName]   = useState('')
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set())
  const [settingsPage, setSettingsPage] = useState<PageDef | null>(null)

  if (settingsPage) {
    const current = pages.find((p) => p.id === settingsPage.id) ?? settingsPage
    return <PageSettings page={current} onBack={() => setSettingsPage(null)} />
  }

  const toggleHidden = (id: string) =>
    setHiddenIds((prev) => {
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
      {/* Header */}
      <div style={{ padding: '12px 14px 0', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>Páginas y menú del sitio</div>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0 }}>
          {([['menu', 'Menú del sitio'], ['hidden', 'Páginas ocultas']] as const).map(([key, label]) => (
            <button key={key} type='button' onClick={() => setTab(key)}
              style={{
                flex: 1, padding: '7px 0', background: 'none', border: 'none',
                borderBottom: tab === key ? '2px solid var(--primary)' : '2px solid transparent',
                color: tab === key ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: tab === key ? 700 : 500, fontSize: 12, cursor: 'pointer',
              }}
            >{label}</button>
          ))}
        </div>
      </div>

      {/* Pages list */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {visiblePages.length === 0 && (
          <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--muted)', fontSize: 12 }}>
            {tab === 'hidden' ? 'No hay páginas ocultas' : 'No hay páginas'}
          </div>
        )}
        {visiblePages.map((page) => {
          const isActive   = page.id === activePageId
          const isEditing  = editingId === page.id
          const isHidden   = hiddenIds.has(page.id)
          const isHomePage = pages.indexOf(page) === 0

          return (
            <div key={page.id}
              onClick={() => !isEditing && selectPage(page.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 14px', cursor: 'pointer',
                background: isActive ? 'var(--primary-dim)' : 'transparent',
                borderLeft: `3px solid ${isActive ? 'var(--primary)' : 'transparent'}`,
                borderBottom: '1px solid var(--border)',
                transition: 'background 120ms',
                opacity: isHidden ? 0.55 : 1,
              }}
            >
              {/* Page icon */}
              <span style={{ fontSize: 15, flexShrink: 0 }}>
                {isHomePage ? '🏠' : '📄'}
              </span>

              {/* Name / edit input */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {isEditing ? (
                  <input autoFocus value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={commitEdit}
                    onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditingId(null) }}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      width: '100%', background: 'var(--surface-2)',
                      border: '1px solid var(--primary)', borderRadius: 4,
                      color: 'var(--text)', padding: '3px 7px', fontSize: 12, outline: 'none',
                    }}
                  />
                ) : (
                  <>
                    <div onDoubleClick={(e) => { e.stopPropagation(); startEdit(page.id, page.name) }}
                      style={{ fontSize: 13, fontWeight: isActive ? 600 : 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.3 }}>
                      {page.name}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {page.path}
                    </div>
                  </>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 2, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                {/* Visibility */}
                <button type='button' title={isHidden ? 'Mostrar en menú' : 'Ocultar del menú'}
                  onClick={() => toggleHidden(page.id)}
                  style={{ background: 'none', border: 'none', color: isHidden ? 'var(--warning)' : 'var(--muted)', cursor: 'pointer', padding: '3px 5px', fontSize: 13, borderRadius: 4, lineHeight: 1 }}>
                  {isHidden ? '🚫' : '👁'}
                </button>
                {/* Settings */}
                <button type='button' title='Ajustes de página'
                  onClick={() => setSettingsPage(page)}
                  style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: '3px 5px', fontSize: 13, borderRadius: 4, lineHeight: 1 }}>
                  ⋯
                </button>
                {/* Delete */}
                {pages.length > 1 && (
                  <button type='button' title='Eliminar página'
                    onClick={() => { if (confirm(`¿Eliminar "${page.name}"?`)) removePage(page.id) }}
                    style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '3px 5px', fontSize: 12, borderRadius: 4, lineHeight: 1 }}>
                    ✕
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer – add page */}
      {tab === 'menu' && (
        <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          <button type='button'
            onClick={() => addPage(`Página ${pages.length + 1}`, `/page-${pages.length + 1}`)}
            style={{
              width: '100%', padding: '9px', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)', background: 'var(--surface)',
              color: 'var(--text)', cursor: 'pointer', fontSize: 12, fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'background 120ms',
            }}>
            + Agregar ítem de menú
          </button>
        </div>
      )}
    </div>
  )
}
