import { useState } from 'react'
import { useEditorStore } from '../state/useEditorStore'
import { PrimaryButton, Separator, TextInput } from '../../shared/ui'

export default function PagesPanel() {
  const pages = useEditorStore((s) => s.site.pages)
  const activePageId = useEditorStore((s) => s.site.activePageId)
  const addPage = useEditorStore((s) => s.addPage)
  const removePage = useEditorStore((s) => s.removePage)
  const selectPage = useEditorStore((s) => s.selectPage)
  const updatePage = useEditorStore((s) => s.updatePage)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const startEdit = (id: string, name: string) => {
    setEditingId(id)
    setEditName(name)
  }
  const commitEdit = () => {
    if (editingId && editName.trim()) updatePage(editingId, { name: editName.trim() })
    setEditingId(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 10 }}>
          Páginas del sitio
        </div>
        <PrimaryButton onClick={() => addPage(`Página ${pages.length + 1}`, `/page-${pages.length + 1}`)} style={{ width: '100%', justifyContent: 'center', fontSize: 12 }}>
          + Agregar página
        </PrimaryButton>
      </div>

      {/* Pages list */}
      <div style={{ flex: 1, overflow: 'auto', padding: '8px 0' }}>
        {pages.map((page, index) => {
          const isActive = page.id === activePageId
          const isEditing = editingId === page.id
          return (
            <div key={page.id}
              onClick={() => selectPage(page.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 14px', cursor: 'pointer',
                background: isActive ? 'var(--primary-dim)' : 'transparent',
                borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
                transition: 'all 0.15s',
              }}
            >
              {/* Page icon */}
              <span style={{ fontSize: 14, flexShrink: 0, opacity: 0.7 }}>
                {index === 0 ? '🏠' : '📄'}
              </span>

              {/* Name */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {isEditing ? (
                  <input
                    autoFocus value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={commitEdit}
                    onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditingId(null) }}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      width: '100%', background: 'var(--surface-2)', border: '1px solid var(--primary)',
                      borderRadius: 4, color: 'var(--text)', padding: '2px 6px', fontSize: 12, outline: 'none',
                    }}
                  />
                ) : (
                  <>
                    <div style={{ fontSize: 13, fontWeight: isActive ? 600 : 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
                <button
                  onClick={() => startEdit(page.id, page.name)}
                  title="Rename page"
                  style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: '2px 4px', fontSize: 12, borderRadius: 4, lineHeight: 1 }}
                >
                  ✎
                </button>
                {pages.length > 1 && (
                  <button
                    onClick={() => { if (confirm(`Delete "${page.name}"?`)) removePage(page.id) }}
                    title="Delete page"
                    style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '2px 4px', fontSize: 12, borderRadius: 4, lineHeight: 1 }}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <Separator />

      {/* Active page settings */}
      {(() => {
        const active = pages.find((p) => p.id === activePageId)
        if (!active) return null
        return (
          <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
              Ajustes de página
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Nombre</label>
                <TextInput value={active.name} onChange={(e) => updatePage(active.id, { name: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Título SEO</label>
                <TextInput value={active.title ?? ''} onChange={(e) => updatePage(active.id, { title: e.target.value })} placeholder="Browser tab title" />
              </div>
              <div>
                <label style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>URL</label>
                <TextInput value={active.path} onChange={(e) => updatePage(active.id, { path: e.target.value })} placeholder="/my-page" />
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
