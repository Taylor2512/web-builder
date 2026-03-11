import { useEffect, useMemo, useReducer, useRef } from 'react'
import { pageSwitcherMenuReducer } from './pageSwitcherMenuReducer'

type SwitcherPage = {
  id: string
  name: string
}

type PageSwitcherMenuProps = {
  pages: SwitcherPage[]
  activePageId: string
  onSelectPage: (pageId: string) => void
  onManagePages: () => void
  popupItems?: string[]
}

const sectionTitleStyle = {
  padding: '10px 14px',
  fontSize: 12,
  fontWeight: 700,
  color: 'var(--muted)',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
  borderBottom: '1px solid var(--border)',
}

export default function PageSwitcherMenu({
  pages,
  activePageId,
  onSelectPage,
  onManagePages,
  popupItems = [],
}: PageSwitcherMenuProps) {
  const [state, dispatch] = useReducer(pageSwitcherMenuReducer, { isOpen: false })
  const menuRef = useRef<HTMLDivElement>(null)

  const activePageName = useMemo(
    () => pages.find((page) => page.id === activePageId)?.name ?? 'Inicio',
    [activePageId, pages],
  )

  useEffect(() => {
    if (!state.isOpen) return

    const handleDocumentMouseDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        dispatch({ type: 'close' })
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        dispatch({ type: 'close' })
      }
    }

    document.addEventListener('mousedown', handleDocumentMouseDown)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleDocumentMouseDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [state.isOpen])

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      <button
        type='button'
        onClick={() => dispatch({ type: 'toggle' })}
        aria-expanded={state.isOpen}
        aria-haspopup='menu'
        style={{
          padding: '5px 10px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-2)',
          background: 'var(--panel)',
          color: 'var(--text)',
          fontSize: 12,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span>{activePageName}</span>
        <span style={{ color: 'var(--muted)' }}>▾</span>
      </button>

      {state.isOpen && (
        <div
          role='menu'
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            width: 260,
            background: 'var(--panel)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            boxShadow: 'var(--shadow-lg)',
            zIndex: 60,
            overflow: 'hidden',
          }}
        >
          <div style={sectionTitleStyle}>PÁGINAS DEL SITIO</div>
          <div style={{ maxHeight: 220, overflow: 'auto' }}>
            {pages.map((page) => (
              <button
                key={page.id}
                type='button'
                onClick={() => {
                  onSelectPage(page.id)
                  dispatch({ type: 'select' })
                }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '10px 14px',
                  fontSize: 14,
                  background: page.id === activePageId ? 'var(--primary)' : 'transparent',
                  color: page.id === activePageId ? '#fff' : 'var(--text)',
                }}
              >
                {page.name}
              </button>
            ))}
          </div>

          <div style={{ borderTop: '1px solid var(--border)' }}>
            <div style={sectionTitleStyle}>VENTANAS EMERGENTES</div>
            {popupItems.length === 0 ? (
              <div style={{ padding: '10px 14px', color: 'var(--muted)', fontSize: 13 }}>
                Sin ventanas emergentes
              </div>
            ) : (
              popupItems.map((item) => (
                <div key={item} style={{ padding: '10px 14px', color: 'var(--text)', fontSize: 14 }}>
                  {item}
                </div>
              ))
            )}
          </div>

          <div style={{ padding: 10, borderTop: '1px solid var(--border)' }}>
            <button
              type='button'
              onClick={() => {
                onManagePages()
                dispatch({ type: 'close' })
              }}
              style={{
                width: '100%',
                border: 'none',
                background: 'transparent',
                color: 'var(--primary)',
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Administrar páginas
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
