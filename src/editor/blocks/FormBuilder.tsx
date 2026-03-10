import { useEffect, useMemo, useRef, useState } from 'react'
import BlocksPanel from './BlocksPanel'
import Canvas from '../canvas/Canvas'
import Inspector from '../inspector/Inspector'
import { useEditorStore } from '../state/useEditorStore'
import { GhostButton } from '../../shared/ui'
import { loadBuilderConfig } from '../config/loadBuilderConfig'
import FlowStudio from '../flows/FlowStudio'
import { loadRemoteProject, saveRemoteProject } from '../api/jsonServer'
import { projectSnapshot } from '../state/useEditorStore'
import PagesPanel from '../panels/PagesPanel'
import SiteDesignPanel from '../panels/SiteDesignPanel'

const MODULES = ['agregar', 'paginas', 'diseno', 'media', 'datos', 'flujos'] as const

type ModuleId = typeof MODULES[number]

export default function FormBuilder() {
  const mode = useEditorStore((s) => s.mode)
  const setMode = useEditorStore((s) => s.setMode)
  const projectName = useEditorStore((s) => s.projectName)
  const setProjectName = useEditorStore((s) => s.setProjectName)
  const activeBreakpoint = useEditorStore((s) => s.activeBreakpoint)
  const serialize = useEditorStore((s) => s.serialize)
  const hydrate = useEditorStore((s) => s.hydrate)
  const reset = useEditorStore((s) => s.reset)
  const setBuilderConfig = useEditorStore((s) => s.setBuilderConfig)
  const builderConfig = useEditorStore((s) => s.builderConfig)
  const selectedNodeId = useEditorStore((s) => s.selectedNodeId)
  const removeNode = useEditorStore((s) => s.removeNode)
  const nodesById = useEditorStore((s) => s.nodesById)
  const flows = useEditorStore((s) => s.flows)
  const site = useEditorStore((s) => s.site)
  const rootId = useEditorStore((s) => s.rootId)
  const duplicateNode = useEditorStore((s) => s.duplicateNode)
  const moveNodeSibling = useEditorStore((s) => s.moveNodeSibling)
  const updateProps = useEditorStore((s) => s.updateProps)
  const updateStyle = useEditorStore((s) => s.updateStyle)
  const fileRef = useRef<HTMLInputElement>(null)
  const [module, setModule] = useState<ModuleId>('agregar')
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'ok' | 'error'>('idle')
  const [editingName, setEditingName] = useState(false)
  const [quickQuery, setQuickQuery] = useState('')
  const [showQuickSearch, setShowQuickSearch] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)

  const selectedNode = selectedNodeId ? nodesById[selectedNodeId] : null
  const isLocked = selectedNode ? selectedNode.styleByBreakpoint[activeBreakpoint].pointerEvents === 'none' : false

  const toggleLock = () => {
    if (!selectedNodeId) return
    updateStyle(selectedNodeId, isLocked ? { pointerEvents: undefined, opacity: undefined } : { pointerEvents: 'none', opacity: 0.55 })
  }

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
      const snapshot = projectSnapshot({ projectName, rootId, nodesById, mode, flows, site })
      setSyncStatus('syncing')
      try {
        await saveRemoteProject(snapshot, projectName)
        setSyncStatus('ok')
      } catch {
        setSyncStatus('error')
      }
    }, 700)
    return () => window.clearTimeout(timer)
  }, [projectName, rootId, nodesById, mode, flows, site])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const editable = target?.closest('input,textarea,[contenteditable="true"]')
      if ((event.key === '?' && !editable) || (event.shiftKey && event.key === '/')) {
        event.preventDefault()
        setShowShortcuts((s) => !s)
        return
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setShowQuickSearch(true)
        return
      }
      if (editable || mode !== 'edit' || !selectedNodeId) return
      if (event.key === 'Delete' || event.key === 'Backspace') {
        const node = nodesById[selectedNodeId]
        if (!node || node.type === 'page') return
        event.preventDefault()
        removeNode(selectedNodeId)
      }
      if (event.key.toLowerCase() === 'd') {
        event.preventDefault()
        duplicateNode(selectedNodeId)
      }
      if (event.key.toLowerCase() === 'l') {
        event.preventDefault()
        toggleLock()
      }
      if (event.altKey && event.key === 'ArrowUp') {
        event.preventDefault()
        moveNodeSibling(selectedNodeId, 'up')
      }
      if (event.altKey && event.key === 'ArrowDown') {
        event.preventDefault()
        moveNodeSibling(selectedNodeId, 'down')
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [mode, selectedNodeId, nodesById, removeNode, duplicateNode, moveNodeSibling, isLocked])

  const commandItems = useMemo(() => {
    const actions = [
      { id: 'preview', label: mode === 'edit' ? 'Cambiar a Preview' : 'Cambiar a Edit', run: () => setMode(mode === 'edit' ? 'preview' : 'edit') },
      { id: 'duplicate', label: 'Duplicar nodo seleccionado', run: () => selectedNodeId && duplicateNode(selectedNodeId) },
      { id: 'lock', label: isLocked ? 'Desbloquear nodo seleccionado' : 'Bloquear nodo seleccionado', run: toggleLock },
      { id: 'help', label: 'Abrir ayuda de atajos', run: () => setShowShortcuts(true) },
      ...MODULES.map((item) => ({ id: `module-${item}`, label: `Abrir módulo: ${item}`, run: () => setModule(item) })),
      ...builderConfig.blocks.enabled.map((type) => ({ id: `hint-${type}`, label: `Bloque disponible: ${type}`, run: () => setModule('agregar') })),
    ]
    return actions
  }, [mode, selectedNodeId, duplicateNode, isLocked, setMode, builderConfig.blocks.enabled])

  const filteredCommands = commandItems.filter((item) => item.label.toLowerCase().includes(quickQuery.toLowerCase()))


  const syncDot = {
    idle: { color: '#64748b', label: 'Saved' },
    syncing: { color: '#f59e0b', label: 'Saving…' },
    ok: { color: '#22c55e', label: 'Saved' },
    error: { color: '#ef4444', label: 'Error' },
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

  const modulePanel = {
    agregar: <BlocksPanel />,
    paginas: <PagesPanel />,
    diseno: <SiteDesignPanel />,
    media: <div style={{ padding: 16, color: 'var(--text-secondary)', fontSize: 13 }}>Media manager próximamente. Usa URLs en bloques de imagen mientras tanto.</div>,
    datos: <div style={{ padding: 16, color: 'var(--text-secondary)', fontSize: 13 }}>Conecta fuentes de datos desde JSON/API. Próximamente panel visual.</div>,
    flujos: <div style={{ padding: 16, color: 'var(--text-secondary)', fontSize: 13 }}>Abre el studio de flujos en el lienzo central.</div>,
  }[module]

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <header style={{ height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '0 12px', borderBottom: '1px solid var(--border)', background: 'var(--panel)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>✦</div>
          {editingName ? <input autoFocus value={projectName} onChange={(e) => setProjectName(e.target.value)} onBlur={() => setEditingName(false)} onKeyDown={(e) => e.key === 'Enter' && setEditingName(false)} /> : <button type='button' onClick={() => setEditingName(true)} style={{ background: 'none', border: 'none', color: 'var(--text)', fontWeight: 700, cursor: 'pointer' }}>{projectName}</button>}
          <span style={{ width: 8, height: 8, borderRadius: 99, background: syncDot.color }} />
        </div>

        <div style={{ position: 'relative', flex: 1, maxWidth: 420 }}>
          <input
            type='search'
            placeholder='Buscar bloques o acciones (Ctrl/Cmd + K)'
            value={quickQuery}
            onFocus={() => setShowQuickSearch(true)}
            onChange={(e) => { setQuickQuery(e.target.value); setShowQuickSearch(true) }}
            style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
          />
          {showQuickSearch && (
            <div style={{ position: 'absolute', top: 38, left: 0, right: 0, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--panel)', zIndex: 20, maxHeight: 220, overflow: 'auto' }}>
              {filteredCommands.slice(0, 8).map((item) => (
                <button key={item.id} type='button' onClick={() => { item.run(); setShowQuickSearch(false); setQuickQuery('') }} style={{ width: '100%', textAlign: 'left', padding: '8px 10px', border: 'none', background: 'transparent', color: 'var(--text)', cursor: 'pointer' }}>{item.label}</button>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <button type='button' onClick={() => setShowShortcuts(true)} style={{ border: '1px solid var(--border)', background: 'transparent', borderRadius: 6, color: 'var(--text-secondary)', padding: '5px 8px', cursor: 'pointer' }}>?</button>
          <GhostButton onClick={handleExport} style={{ fontSize: 11 }}>↑ Export</GhostButton>
          <GhostButton onClick={() => fileRef.current?.click()} style={{ fontSize: 11 }}>↓ Import</GhostButton>
          <button type='button' onClick={() => { if (confirm('Reset all content? This cannot be undone.')) reset() }} style={{ padding: '5px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'transparent', color: 'var(--danger)', cursor: 'pointer', fontSize: 11 }}>↺</button>
        </div>
      </header>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '70px 240px 1fr 300px', minHeight: 0, overflow: 'hidden' }}>
        <aside style={{ borderRight: '1px solid var(--border)', background: 'var(--panel)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {MODULES.map((item) => (
            <button key={item} type='button' onClick={() => setModule(item)} style={{ border: 'none', background: module === item ? 'var(--primary-dim)' : 'transparent', color: module === item ? 'var(--primary)' : 'var(--text-secondary)', padding: '10px 4px', fontSize: 11, fontWeight: 700, textTransform: 'capitalize', cursor: 'pointer' }}>{item}</button>
          ))}
        </aside>

        <aside style={{ borderRight: '1px solid var(--border)', background: 'var(--panel)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>{modulePanel}</aside>

        <section style={{ overflow: 'hidden', position: 'relative' }}>
          {module === 'flujos' ? <FlowStudio /> : <Canvas />}
          {mode === 'edit' && selectedNode && module !== 'flujos' && (
            <div style={{ position: 'absolute', top: 12, right: 12, width: 280, background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 10, padding: 10, zIndex: 9 }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>Quick edit · {selectedNode.type}</div>
              {selectedNode.type === 'text' && <input value={selectedNode.props.text} onChange={(e) => updateProps(selectedNode.id, { text: e.target.value })} style={{ width: '100%' }} />}
              {selectedNode.type === 'button' && <input value={selectedNode.props.label} onChange={(e) => updateProps(selectedNode.id, { label: e.target.value })} style={{ width: '100%' }} />}
              {selectedNode.type === 'image' && <input value={selectedNode.props.src} onChange={(e) => updateProps(selectedNode.id, { src: e.target.value })} style={{ width: '100%' }} />}
              <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                <button type='button' onClick={() => duplicateNode(selectedNode.id)} style={{ flex: 1 }}>Duplicar</button>
                <button type='button' onClick={toggleLock} style={{ flex: 1 }}>{isLocked ? 'Desbloquear' : 'Bloquear'}</button>
              </div>
            </div>
          )}

          {mode === 'edit' && selectedNode && module !== 'flujos' && (
            <div style={{ position: 'absolute', left: '50%', bottom: 12, transform: 'translateX(-50%)', display: 'flex', gap: 6, padding: 8, borderRadius: 999, border: '1px solid var(--border)', background: 'rgba(15,23,42,0.88)', zIndex: 9 }}>
              <IconBtn label='⧉' title='Duplicar' onClick={() => duplicateNode(selectedNode.id)} />
              <IconBtn label='↑' title='Mover arriba (Alt+↑)' onClick={() => moveNodeSibling(selectedNode.id, 'up')} />
              <IconBtn label='↓' title='Mover abajo (Alt+↓)' onClick={() => moveNodeSibling(selectedNode.id, 'down')} />
              <IconBtn label='⟸' title='Alinear izquierda' onClick={() => updateStyle(selectedNode.id, { marginLeft: 0, marginRight: 'auto' })} />
              <IconBtn label='⟺' title='Alinear centro' onClick={() => updateStyle(selectedNode.id, { marginLeft: 'auto', marginRight: 'auto' })} />
              <IconBtn label='⟹' title='Alinear derecha' onClick={() => updateStyle(selectedNode.id, { marginLeft: 'auto', marginRight: 0 })} />
              <IconBtn label={isLocked ? '🔓' : '🔒'} title='Bloquear (L)' onClick={toggleLock} />
            </div>
          )}
        </section>

        <aside style={{ borderLeft: '1px solid var(--border)', background: 'var(--panel)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}><Inspector /></aside>
      </div>

      {showShortcuts && (
        <div onClick={() => setShowShortcuts(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(2,6,23,0.6)', zIndex: 100, display: 'grid', placeItems: 'center' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: 420, background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
            <h3 style={{ margin: 0, marginBottom: 8 }}>Atajos de teclado</h3>
            <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8, fontSize: 13 }}>
              <li><b>?</b> abrir/cerrar ayuda</li>
              <li><b>Ctrl/Cmd + K</b> buscador global</li>
              <li><b>D</b> duplicar nodo seleccionado</li>
              <li><b>Alt + ↑ / Alt + ↓</b> mover nodo</li>
              <li><b>L</b> bloquear/desbloquear</li>
              <li><b>Delete / Backspace</b> eliminar nodo</li>
            </ul>
          </div>
        </div>
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

function IconBtn({ label, title, onClick }: { label: string; title: string; onClick: () => void }) {
  return (
    <button type='button' title={title} onClick={onClick} style={{ border: '1px solid var(--border)', background: 'var(--panel)', color: 'var(--text)', width: 30, height: 30, borderRadius: 7, cursor: 'pointer' }}>{label}</button>
  )
}
