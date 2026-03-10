import { useEffect, useRef, useState } from 'react'
import BlocksPanel from './BlocksPanel'
import Canvas from '../canvas/Canvas'
import Inspector from '../inspector/Inspector'
import { useEditorStore } from '../state/useEditorStore'
import { GhostButton, PrimaryButton } from '../../shared/ui'
import { loadBuilderConfig } from '../config/loadBuilderConfig'
import FlowStudio from '../flows/FlowStudio'
import { loadRemoteProject, saveRemoteProject } from '../api/jsonServer'
import { projectSnapshot } from '../state/useEditorStore'

const BP_ICONS: Record<string, string> = { desktop: '🖥', tablet: '⬜', mobile: '📱' }

export default function FormBuilder() {
  const mode = useEditorStore((s) => s.mode)
  const setMode = useEditorStore((s) => s.setMode)
  const projectName = useEditorStore((s) => s.projectName)
  const setProjectName = useEditorStore((s) => s.setProjectName)
  const activeBreakpoint = useEditorStore((s) => s.activeBreakpoint)
  const setBreakpoint = useEditorStore((s) => s.setBreakpoint)
  const serialize = useEditorStore((s) => s.serialize)
  const hydrate = useEditorStore((s) => s.hydrate)
  const reset = useEditorStore((s) => s.reset)
  const setBuilderConfig = useEditorStore((s) => s.setBuilderConfig)
  const builderConfig = useEditorStore((s) => s.builderConfig)
  const pages = useEditorStore((s) => s.site.pages)
  const activePageId = useEditorStore((s) => s.site.activePageId)
  const addPage = useEditorStore((s) => s.addPage)
  const selectPage = useEditorStore((s) => s.selectPage)
  const removePage = useEditorStore((s) => s.removePage)
  const selectedNodeId = useEditorStore((s) => s.selectedNodeId)
  const removeNode = useEditorStore((s) => s.removeNode)
  const nodesById = useEditorStore((s) => s.nodesById)
  const flows = useEditorStore((s) => s.flows)
  const site = useEditorStore((s) => s.site)
  const rootId = useEditorStore((s) => s.rootId)
  const ui = useEditorStore((s) => s.ui)
  const toggleLeftPanel = useEditorStore((s) => s.toggleLeftPanel)
  const toggleRightPanel = useEditorStore((s) => s.toggleRightPanel)
  const togglePanels = useEditorStore((s) => s.togglePanels)
  const toggleFocusMode = useEditorStore((s) => s.toggleFocusMode)
  const setFocusMode = useEditorStore((s) => s.setFocusMode)
  const setLeftPanelWidth = useEditorStore((s) => s.setLeftPanelWidth)
  const setRightPanelWidth = useEditorStore((s) => s.setRightPanelWidth)
  const fileRef = useRef<HTMLInputElement>(null)
  const [workspace, setWorkspace] = useState<'pages' | 'flows'>('pages')
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'ok' | 'error'>('idle')
  const [editingName, setEditingName] = useState(false)

  useEffect(() => {
    loadBuilderConfig().then((config) => {
      setBuilderConfig(config)
      document.documentElement.style.setProperty('--radius', `${config.themeTokens.radius}px`)
      document.documentElement.style.setProperty('--surface', config.themeTokens.surface)
      document.documentElement.style.setProperty('--primary', config.themeTokens.primary)
    })
  }, [setBuilderConfig])

  useEffect(() => {
    let cancelled = false
    const hydrateFromRemote = async () => {
      try {
        const project = await loadRemoteProject()
        if (!cancelled && project?.data) {
          hydrate(JSON.stringify(project.data))
          setSyncStatus('ok')
        }
      } catch {
        if (!cancelled) setSyncStatus('error')
      }
    }
    void hydrateFromRemote()
    return () => { cancelled = true }
  }, [hydrate])

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      const snapshot = projectSnapshot({ projectName, rootId, nodesById, mode, flows, site, ui })
      setSyncStatus('syncing')
      try {
        await saveRemoteProject(snapshot, projectName)
        setSyncStatus('ok')
      } catch {
        setSyncStatus('error')
      }
    }, 700)
    return () => window.clearTimeout(timer)
  }, [projectName, rootId, nodesById, mode, flows, site, ui])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const editable = target?.closest('input,textarea,[contenteditable="true"]')

      if ((event.ctrlKey || event.metaKey) && event.key === '\\') {
        event.preventDefault()
        togglePanels()
        return
      }

      if (!editable && event.key.toLowerCase() === 'f') {
        event.preventDefault()
        toggleFocusMode()
        return
      }

      if (mode !== 'edit' || !selectedNodeId) return
      if (event.key !== 'Delete' && event.key !== 'Backspace') return
      if (editable) return
      const node = nodesById[selectedNodeId]
      if (!node || node.type === 'page') return
      event.preventDefault()
      removeNode(selectedNodeId)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [mode, nodesById, removeNode, selectedNodeId, toggleFocusMode, togglePanels])

  const activePage = pages.find((p) => p.id === activePageId)

  const syncDot = {
    idle:    { color: '#64748b', label: 'Saved' },
    syncing: { color: '#f59e0b', label: 'Saving…' },
    ok:      { color: '#22c55e', label: 'Saved' },
    error:   { color: '#ef4444', label: 'Error' },
  }[syncStatus]

  const handleExport = () => {
    const blob = new Blob([serialize()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${projectName || 'project'}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const focusModeActive = workspace === 'pages' && ui.focusMode
  const panelColumns = focusModeActive
    ? '0px 1fr 0px'
    : `${ui.leftPanelOpen ? `${ui.leftPanelWidth}px` : '0px'} 1fr ${ui.rightPanelOpen ? `${ui.rightPanelWidth}px` : '0px'}`

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* ── Topbar ── */}
      <header style={{ height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '0 12px', borderBottom: '1px solid var(--border)', background: 'var(--panel)', flexShrink: 0 }}>
        {/* Left: logo + project name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, flexShrink: 0,
          }}>✦</div>

          {editingName ? (
            <input
              autoFocus
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onBlur={() => setEditingName(false)}
              onKeyDown={(e) => e.key === 'Enter' && setEditingName(false)}
              style={{
                background: 'var(--surface-2)', border: '1px solid var(--primary)',
                borderRadius: 'var(--radius-sm)', color: 'var(--text)', padding: '4px 8px',
                fontSize: 13, fontWeight: 600, outline: 'none', width: 180,
              }}
            />
          ) : (
            <button
              type='button'
              onClick={() => setEditingName(true)}
              title='Click to rename project'
              style={{
                background: 'none', border: 'none', color: 'var(--text)',
                fontWeight: 600, fontSize: 13, cursor: 'text', padding: '4px 6px',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              {projectName || 'Untitled Project'}
            </button>
          )}

          {/* Sync dot */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: syncDot.color }} />
            <span style={{ fontSize: 10, color: 'var(--muted)' }}>{syncDot.label}</span>
          </div>
        </div>

        {/* Center: workspace + page tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {/* Workspace tabs */}
          {(['pages', 'flows'] as const).map((ws) => (
            <button
              key={ws}
              type='button'
              onClick={() => setWorkspace(ws)}
              style={{
                padding: '5px 12px', borderRadius: 'var(--radius-sm)',
                border: `1px solid ${workspace === ws ? 'var(--primary)' : 'var(--border)'}`,
                background: workspace === ws ? 'var(--primary-dim)' : 'transparent',
                color: workspace === ws ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: workspace === ws ? 700 : 500, fontSize: 12, cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {ws === 'pages' ? '⬜ Pages' : '⟶ Flows'}
            </button>
          ))}

          {workspace === 'pages' && !focusModeActive && (
            <>
              <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }} />
              {/* Page selector */}
              <select
                value={activePageId}
                onChange={(e) => selectPage(e.target.value)}
                style={{
                  padding: '5px 28px 5px 10px', borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-2)', background: 'rgba(0,0,0,0.3)',
                  color: 'var(--text)', fontSize: 12, cursor: 'pointer', outline: 'none',
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%238b949e'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center',
                }}
              >
                {pages.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <GhostButton onClick={() => addPage(`Page ${pages.length + 1}`, `/page-${pages.length + 1}`)} style={{ fontSize: 11 }}>+ Page</GhostButton>
              {activePage && pages.length > 1 && (
                <GhostButton onClick={() => removePage(activePage.id)} style={{ fontSize: 11, color: 'var(--danger)' }}>✕</GhostButton>
              )}
            </>
          )}
        </div>

        {/* Right: breakpoints + preview + io */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {/* Breakpoints */}
          {workspace === 'pages' && (
            <div style={{ display: 'flex', gap: 2, background: 'var(--surface)', borderRadius: 'var(--radius-sm)', padding: 2 }}>
              {(['desktop', 'tablet', 'mobile'] as const).map((bp) => {
                const bpConfig = builderConfig.breakpoints[bp]
                const active = activeBreakpoint === bp
                return (
                  <button
                    key={bp}
                    type='button'
                    onClick={() => setBreakpoint(bp)}
                    title={`${bp} (${bpConfig.width}px)`}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      padding: '4px 8px', borderRadius: 6, border: 'none',
                      background: active ? 'var(--primary)' : 'transparent',
                      color: active ? '#fff' : 'var(--text-secondary)',
                      fontWeight: active ? 700 : 500, fontSize: 11, cursor: 'pointer',
                    }}
                  >
                    <span>{BP_ICONS[bp]}</span>
                    <span style={{ display: active ? 'inline' : 'none' }}>{bpConfig.width}px</span>
                  </button>
                )
              })}
            </div>
          )}

          <div style={{ width: 1, height: 20, background: 'var(--border)' }} />

          {workspace === 'pages' && !focusModeActive && (
            <>
              <GhostButton onClick={toggleLeftPanel} title='Mostrar/ocultar panel izquierdo' style={{ fontSize: 11 }}>
                {ui.leftPanelOpen ? '⇤ Left' : '⇥ Left'}
              </GhostButton>
              <GhostButton onClick={toggleRightPanel} title='Mostrar/ocultar panel derecho' style={{ fontSize: 11 }}>
                {ui.rightPanelOpen ? 'Right ⇥' : 'Right ⇤'}
              </GhostButton>
              <GhostButton onClick={togglePanels} title='Mostrar/ocultar ambos paneles (Ctrl/Cmd + \\)' style={{ fontSize: 11 }}>
                ⌘\\
              </GhostButton>
            </>
          )}

          {workspace === 'pages' && (
            <GhostButton onClick={toggleFocusMode} title='Activar/desactivar Focus (F o Shift+F)' style={{ fontSize: 11 }}>
              {focusModeActive ? '⤫ Exit Focus' : '◉ Focus'}
            </GhostButton>
          )}

          {/* Preview */}
          {workspace === 'pages' && (
            <PrimaryButton
              onClick={() => setMode(mode === 'edit' ? 'preview' : 'edit')}
              style={{ background: mode === 'preview' ? '#22c55e' : undefined, fontSize: 11 }}
            >
              {mode === 'edit' ? '▶ Preview' : '✎ Edit'}
            </PrimaryButton>
          )}

          {/* Import / Export */}
          {!focusModeActive && (
            <>
              <GhostButton onClick={handleExport} title='Export design as JSON' style={{ fontSize: 11 }}>↑ Export</GhostButton>
              <GhostButton onClick={() => fileRef.current?.click()} title='Import JSON' style={{ fontSize: 11 }}>↓ Import</GhostButton>
              <button
                type='button'
                onClick={() => { if (confirm('Reset all content? This cannot be undone.')) reset() }}
                title='Reset project'
                style={{
                  padding: '5px 8px', borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)', background: 'transparent',
                  color: 'var(--danger)', cursor: 'pointer', fontSize: 11,
                }}
              >
                ↺
              </button>
            </>
          )}
        </div>
      </header>

      {/* ── Main content ── */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: panelColumns, minHeight: 0, overflow: 'hidden' }}>
        {workspace === 'pages' ? (
          <>
            {!focusModeActive && (
              <aside style={{ borderRight: ui.leftPanelOpen ? '1px solid var(--border)' : 'none', background: 'var(--panel)', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                {ui.leftPanelOpen && <BlocksPanel />}
                <button
                  type='button'
                  onClick={toggleLeftPanel}
                  title={ui.leftPanelOpen ? 'Colapsar panel izquierdo' : 'Expandir panel izquierdo'}
                  style={{ position: 'absolute', right: 6, top: 6, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-secondary)', borderRadius: 6, cursor: 'pointer', padding: '2px 6px', fontSize: 11 }}
                >
                  {ui.leftPanelOpen ? '◀' : '▶'}
                </button>
                {ui.leftPanelOpen && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 6, padding: 6, borderTop: '1px solid var(--border)' }}>
                    <button type='button' title='Reducir ancho panel izquierdo' onClick={() => setLeftPanelWidth(ui.leftPanelWidth - 20)} style={{ fontSize: 11 }}>−</button>
                    <button type='button' title='Aumentar ancho panel izquierdo' onClick={() => setLeftPanelWidth(ui.leftPanelWidth + 20)} style={{ fontSize: 11 }}>+</button>
                  </div>
                )}
              </aside>
            )}
            <section style={{ overflow: 'hidden' }}><Canvas /></section>
            {!focusModeActive && (
              <aside style={{ borderLeft: ui.rightPanelOpen ? '1px solid var(--border)' : 'none', background: 'var(--panel)', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                {ui.rightPanelOpen && <Inspector />}
                <button
                  type='button'
                  onClick={toggleRightPanel}
                  title={ui.rightPanelOpen ? 'Colapsar panel derecho' : 'Expandir panel derecho'}
                  style={{ position: 'absolute', left: 6, top: 6, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-secondary)', borderRadius: 6, cursor: 'pointer', padding: '2px 6px', fontSize: 11 }}
                >
                  {ui.rightPanelOpen ? '▶' : '◀'}
                </button>
                {ui.rightPanelOpen && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 6, padding: 6, borderTop: '1px solid var(--border)' }}>
                    <button type='button' title='Reducir ancho panel derecho' onClick={() => setRightPanelWidth(ui.rightPanelWidth - 20)} style={{ fontSize: 11 }}>−</button>
                    <button type='button' title='Aumentar ancho panel derecho' onClick={() => setRightPanelWidth(ui.rightPanelWidth + 20)} style={{ fontSize: 11 }}>+</button>
                  </div>
                )}
              </aside>
            )}
          </>
        ) : (
          <section style={{ gridColumn: '1 / -1', overflow: 'auto' }}><FlowStudio /></section>
        )}
      </div>

      {focusModeActive && (
        <button
          type='button'
          onClick={() => setFocusMode(false)}
          style={{
            position: 'fixed',
            right: 16,
            bottom: 16,
            zIndex: 40,
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
            background: 'var(--primary)',
            color: '#fff',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 700,
            boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
          }}
        >
          Salir de Focus
        </button>
      )}

      <input
        ref={fileRef}
        type='file'
        accept='application/json'
        style={{ display: 'none' }}
        onChange={async (e) => {
          const file = e.target.files?.[0]
          if (!file) return
          hydrate(await file.text())
          e.target.value = ''
        }}
      />
    </div>
  )
}
