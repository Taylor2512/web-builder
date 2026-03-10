import { useEffect, useRef, useState } from 'react'
import BlocksPanel from './BlocksPanel'
import Canvas from '../canvas/Canvas'
import Inspector from '../inspector/Inspector'
import { useEditorStore } from '../state/useEditorStore'
import { GhostButton, PrimaryButton } from '../../shared/ui'
import { loadBuilderConfig } from '../config/loadBuilderConfig'
import FlowStudio from '../flows/FlowStudio'
import PagesPanel from '../panels/PagesPanel'
import SiteDesignPanel from '../panels/SiteDesignPanel'
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
  const toggleRightPanel = useEditorStore((s) => s.toggleRightPanel)
  const togglePanels = useEditorStore((s) => s.togglePanels)
  const toggleFocusMode = useEditorStore((s) => s.toggleFocusMode)
  const setFocusMode = useEditorStore((s) => s.setFocusMode)
  const setLeftPanelWidth = useEditorStore((s) => s.setLeftPanelWidth)
  const setRightPanelWidth = useEditorStore((s) => s.setRightPanelWidth)
  const setActiveLeftPanel = useEditorStore((s) => s.setActiveLeftPanel)
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
        // Toggle left panel: close if any open, else re-open last or default to blocks
        setActiveLeftPanel(ui.activeLeftPanel !== null ? null : 'blocks')
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

  // Auto-open Inspector when a node gets selected
  useEffect(() => {
    if (selectedNodeId && !ui.rightPanelOpen) {
      toggleRightPanel()
    }
  }, [selectedNodeId])

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
  const activeLeftPanel = ui.activeLeftPanel ?? null

  // Helper: toggle a specific left panel (same panel click = close)
  const togglePanel = (panel: 'blocks' | 'layers' | 'pages' | 'design') => {
    setActiveLeftPanel(activeLeftPanel === panel ? null : panel)
  }

  // ── Sidebar icon button
  const SidebarBtn = ({
    id, icon, label,
  }: {
    id: 'blocks' | 'layers' | 'pages' | 'design'
    icon: string
    label: string
  }) => {
    const isActive = activeLeftPanel === id
    const [hov, setHov] = useState(false)
    return (
      <div style={{ position: 'relative' }}>
        <button
          type='button'
          onClick={() => togglePanel(id)}
          onMouseEnter={() => setHov(true)}
          onMouseLeave={() => setHov(false)}
          title={label}
          style={{
            width: 44, height: 44, borderRadius: 10,
            border: isActive ? '1px solid var(--primary)' : '1px solid transparent',
            background: isActive ? 'var(--primary-dim)' : hov ? 'var(--surface-hover)' : 'transparent',
            color: isActive ? 'var(--primary)' : hov ? 'var(--text)' : 'var(--text-secondary)',
            cursor: 'pointer', fontSize: 16,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
            transition: 'all 150ms ease',
            flexShrink: 0,
            boxShadow: isActive ? '0 0 0 1px var(--primary-glow)' : 'none',
          }}
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>{icon}</span>
          <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', lineHeight: 1 }}>{label}</span>
        </button>
        {/* Tooltip */}
        {hov && !isActive && (
          <div style={{
            position: 'absolute', left: '100%', top: '50%', transform: 'translateY(-50%)',
            marginLeft: 10, background: 'var(--surface-3)', color: 'var(--text)',
            fontSize: 11, fontWeight: 600, padding: '5px 10px', borderRadius: 6,
            whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 100,
            boxShadow: 'var(--shadow)', border: '1px solid var(--border-2)',
          }}>
            {label}
          </div>
        )}
      </div>
    )
  }

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
      <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>

        {/* ── Left Icon Sidebar (Wix-style) ── */}
        {workspace === 'pages' && !focusModeActive && (
          <nav style={{
            width: 56, flexShrink: 0,
            background: 'var(--panel)',
            borderRight: '1px solid var(--border)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', padding: '6px 6px 10px', gap: 2,
            zIndex: 30,
          }}>
            {/* Add block shortcut */}
            <button
              type='button'
              title='Agregar bloque'
              onClick={() => togglePanel('blocks')}
              style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0, marginBottom: 6,
                background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                border: 'none', color: '#fff', cursor: 'pointer', fontSize: 20, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 12px var(--primary-glow)',
                transition: 'transform 120ms',
              }}
            >+</button>
            {/* Divider */}
            <div style={{ width: 28, height: 1, background: 'var(--border)', marginBottom: 4 }} />
            <SidebarBtn id='blocks' icon='⊞' label='Blocks' />
            <SidebarBtn id='layers' icon='≡' label='Layers' />
            <SidebarBtn id='pages' icon='⬜' label='Pages' />
            <SidebarBtn id='design' icon='✦' label='Design' />
          </nav>
        )}

        {/* ── Canvas + floating panels wrapper ── */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>

          {/* Canvas — always full width */}
          {workspace === 'pages'
            ? <section style={{ width: '100%', height: '100%', overflow: 'hidden' }}><Canvas /></section>
            : <section style={{ width: '100%', height: '100%', overflow: 'auto' }}><FlowStudio /></section>
          }

          {/* ── Floating Left Panel ── */}
          {workspace === 'pages' && !focusModeActive && (
            <aside
              style={{
                position: 'absolute', left: 0, top: 0, bottom: 0,
                width: ui.leftPanelWidth,
                zIndex: 20,
                background: 'var(--panel)',
                borderRight: '1px solid var(--border)',
                display: 'flex', flexDirection: 'column',
                transform: activeLeftPanel ? 'translateX(0)' : 'translateX(-100%)',
                transition: 'transform 220ms cubic-bezier(0.4,0,0.2,1), box-shadow 220ms ease',
                boxShadow: activeLeftPanel ? '4px 0 24px rgba(0,0,0,0.45)' : 'none',
                willChange: 'transform',
                pointerEvents: activeLeftPanel ? 'auto' : 'none',
              }}
            >
              {/* Panel header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 10px 0 14px', height: 40, flexShrink: 0,
                borderBottom: '1px solid var(--border)',
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                  {activeLeftPanel === 'blocks' ? 'Blocks' : activeLeftPanel === 'layers' ? 'Layers' : activeLeftPanel === 'pages' ? 'Pages' : 'Design'}
                </span>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <button type='button' title='Reducir ancho' onClick={() => setLeftPanelWidth(ui.leftPanelWidth - 20)} style={{ border: 'none', background: 'transparent', color: 'var(--muted)', cursor: 'pointer', fontSize: 13, padding: '2px 4px', borderRadius: 4 }}>−</button>
                  <button type='button' title='Ampliar ancho' onClick={() => setLeftPanelWidth(ui.leftPanelWidth + 20)} style={{ border: 'none', background: 'transparent', color: 'var(--muted)', cursor: 'pointer', fontSize: 13, padding: '2px 4px', borderRadius: 4 }}>+</button>
                  <button
                    type='button'
                    onClick={() => setActiveLeftPanel(null)}
                    title='Cerrar panel'
                    style={{ border: 'none', background: 'transparent', color: 'var(--muted)', cursor: 'pointer', fontSize: 14, padding: '2px 6px', borderRadius: 4, lineHeight: 1 }}
                  >✕</button>
                </div>
              </div>

              {/* Panel content */}
              <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {activeLeftPanel === 'blocks' && <BlocksPanel key='blocks' defaultTab='blocks' />}
                {activeLeftPanel === 'layers' && <BlocksPanel key='layers' defaultTab='layers' />}
                {activeLeftPanel === 'pages' && <PagesPanel />}
                {activeLeftPanel === 'design' && <SiteDesignPanel />}
              </div>
            </aside>
          )}

          {/* ── Floating Right Panel (Inspector) ── */}
          {workspace === 'pages' && !focusModeActive && (
            <aside
              style={{
                position: 'absolute', right: 0, top: 0, bottom: 0,
                width: ui.rightPanelWidth,
                zIndex: 20,
                background: 'var(--panel)',
                borderLeft: '1px solid var(--border)',
                display: 'flex', flexDirection: 'column',
                transform: ui.rightPanelOpen ? 'translateX(0)' : 'translateX(100%)',
                transition: 'transform 220ms cubic-bezier(0.4,0,0.2,1), box-shadow 220ms ease',
                boxShadow: ui.rightPanelOpen ? '-4px 0 24px rgba(0,0,0,0.45)' : 'none',
                willChange: 'transform',
                pointerEvents: ui.rightPanelOpen ? 'auto' : 'none',
              }}
            >
              {/* Inspector resize controls */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 10px 0 14px', height: 40, flexShrink: 0,
                borderBottom: '1px solid var(--border)',
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)' }}>Inspector</span>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <button type='button' title='Reducir ancho' onClick={() => setRightPanelWidth(ui.rightPanelWidth - 20)} style={{ border: 'none', background: 'transparent', color: 'var(--muted)', cursor: 'pointer', fontSize: 13, padding: '2px 4px', borderRadius: 4 }}>−</button>
                  <button type='button' title='Ampliar ancho' onClick={() => setRightPanelWidth(ui.rightPanelWidth + 20)} style={{ border: 'none', background: 'transparent', color: 'var(--muted)', cursor: 'pointer', fontSize: 13, padding: '2px 4px', borderRadius: 4 }}>+</button>
                  <button
                    type='button'
                    onClick={toggleRightPanel}
                    title='Cerrar Inspector'
                    style={{ border: 'none', background: 'transparent', color: 'var(--muted)', cursor: 'pointer', fontSize: 14, padding: '2px 6px', borderRadius: 4, lineHeight: 1 }}
                  >✕</button>
                </div>
              </div>
              <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <Inspector />
              </div>
            </aside>
          )}

          {/* ── Floating toggle button: right panel ── */}
          {workspace === 'pages' && !focusModeActive && (
            <button
              type='button'
              onClick={toggleRightPanel}
              title={ui.rightPanelOpen ? 'Cerrar Inspector' : 'Abrir Inspector'}
              style={{
                position: 'absolute',
                right: ui.rightPanelOpen ? ui.rightPanelWidth : 0,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 25,
                width: 20,
                height: 48,
                border: '1px solid var(--border)',
                borderRight: ui.rightPanelOpen ? '1px solid var(--border)' : 'none',
                borderRadius: ui.rightPanelOpen ? '6px 0 0 6px' : '6px 0 0 6px',
                background: 'var(--panel)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'right 220ms cubic-bezier(0.4,0,0.2,1)',
                boxShadow: '-2px 0 8px rgba(0,0,0,0.3)',
              }}
            >
              {ui.rightPanelOpen ? '▶' : '◀'}
            </button>
          )}

        </div>{/* end canvas wrapper */}
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
