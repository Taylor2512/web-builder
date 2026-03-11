import { useEffect, useRef, useState } from 'react'
import BlocksPanel from './BlocksPanel'
import Canvas from '../canvas/Canvas'
import Inspector from '../inspector/Inspector'
import { useEditorStore } from '../state/useEditorStore'
import { GhostButton, PrimaryButton, ShellIconButton, ShellPanelHeader } from '../../shared/ui'
import { loadBuilderConfig } from '../config/loadBuilderConfig'
import FlowStudio from '../flows/FlowStudio'
import PagesPanel from '../panels/PagesPanel'
import SiteDesignPanel from '../panels/SiteDesignPanel'
import { loadRemoteProject, saveRemoteProject } from '../api/jsonServer'
import { projectSnapshot } from '../state/useEditorStore'

const BP_ICONS: Record<string, string> = { desktop: 'D', tablet: 'T', mobile: 'M' }

const WIX_ADD_CATEGORIES = ['Textos', 'Imágenes', 'Botones', 'Franjas', 'Decorativo', 'Cuadro', 'Galerías', 'Menú y ancla', 'Contacto y formularios', 'Video y música', 'Interactivo', 'Listas', 'Código incrustado', 'Redes sociales', 'Pagos', 'CMS'] as const

const WIX_ADD_ITEMS: Record<(typeof WIX_ADD_CATEGORIES)[number], string[]> = {
  Textos: ['Título temático', 'Párrafo', 'Texto contraíble', 'Marquesina de texto'],
  Imágenes: ['Imagen simple', 'Imagen con marco', 'Collage', 'Banner de imagen'],
  Botones: ['Botón primario', 'Botón con icono', 'Botón secundario', 'Botón outline'],
  Franjas: ['Hero de portada', 'Franja de servicios', 'Franja de CTA', 'Franja de contacto'],
  Decorativo: ['Separador decorativo', 'Forma orgánica', 'Etiqueta', 'Icono destacado'],
  Cuadro: ['Caja de contenido', 'Tarjeta de equipo', 'Tarjeta de precio', 'Caja transparente'],
  'Galerías': ['Galería masonry', 'Galería slider', 'Galería carrusel', 'Lightbox'],
  'Menú y ancla': ['Menú horizontal', 'Menú hamburguesa', 'Ancla de sección', 'Navegación lateral'],
  'Contacto y formularios': ['Formulario contacto', 'Newsletter', 'Formulario multi-step', 'WhatsApp rápido'],
  'Video y música': ['Video embebido', 'Video hero', 'Audio player', 'Playlist'],
  Interactivo: ['Accordion', 'Tabs', 'Tooltip', 'Contador animado'],
  Listas: ['Lista de features', 'Lista de FAQ', 'Lista de tarjetas', 'Repeater dinámico'],
  'Código incrustado': ['HTML embebido', 'Widget JS', 'iframe externo', 'Snippet personalizado'],
  'Redes sociales': ['Iconos sociales', 'Feed Instagram', 'Botón compartir', 'Botón seguir'],
  Pagos: ['Botón comprar', 'Plan de precios', 'Checkout rápido', 'Donación'],
  CMS: ['Lista CMS', 'Detalle CMS', 'Filtro CMS', 'Búsqueda CMS'],
}


type TipEntry = { title: string; desc: string; cta: string; group: 'Acciones del sitio' | 'Herramientas y opciones' | 'Panel de control' }

const IN_APP_TIPS: TipEntry[] = [
  { title: 'Ahorra tiempo con automatizaciones', desc: 'Configura flujos automáticos para emails, seguimiento y tareas.', cta: 'Crear automatización', group: 'Acciones del sitio' },
  { title: 'Convierte visitantes en suscriptores', desc: 'Agrega formularios personalizados y conecta campañas de email.', cta: 'Agregar formulario', group: 'Acciones del sitio' },
  { title: 'Vende con Facebook e Instagram', desc: 'Encuentra compradores idóneos con anuncios de Meta desde Wix.', cta: 'Crear un anuncio', group: 'Acciones del sitio' },
  { title: 'Haz crecer tu audiencia con redes sociales', desc: 'Crea y comparte entradas llamativas para atraer más visitas.', cta: 'Crear entrada social', group: 'Acciones del sitio' },
  { title: 'Aparece en Google', desc: 'Obtén un plan SEO para mejorar visibilidad y posicionamiento.', cta: 'Comienza ahora', group: 'Herramientas y opciones' },
  { title: 'Prepárate para chatear con tus visitantes', desc: 'Define horarios de chat y no pierdas potenciales clientes.', cta: 'Ir a ajustes', group: 'Herramientas y opciones' },
  { title: 'Promociona tus productos con un vídeo', desc: 'Crea un video promocional para aumentar conversiones.', cta: 'Crear un video', group: 'Herramientas y opciones' },
  { title: 'Importa traducciones del sitio', desc: 'Ahorra tiempo importando traducciones en CSV para Wix Multilingual.', cta: 'Importar traducciones', group: 'Herramientas y opciones' },
  { title: 'Formularios y envíos', desc: 'Crea formularios profesionales y gestiona envíos desde un solo panel.', cta: 'Abrir', group: 'Panel de control' },
  { title: 'Ajustes de bandeja de entrada', desc: 'Administra notificaciones y preferencias del inbox y chat.', cta: 'Abrir', group: 'Panel de control' },
  { title: 'Cobrar pagos en persona', desc: 'Activa POS de Wix para pagos locales y en tienda.', cta: 'Leer más', group: 'Panel de control' },
  { title: 'Vender en canales externos', desc: 'Publica en Amazon, eBay y más canales desde tu panel.', cta: 'Comenzar', group: 'Panel de control' },
]

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
  const toggleFocusMode = useEditorStore((s) => s.toggleFocusMode)
  const setFocusMode = useEditorStore((s) => s.setFocusMode)
  const setLeftPanelWidth = useEditorStore((s) => s.setLeftPanelWidth)
  const setRightPanelWidth = useEditorStore((s) => s.setRightPanelWidth)
  const setActiveLeftPanel = useEditorStore((s) => s.setActiveLeftPanel)
  const undo = useEditorStore((s) => s.undo)
  const redo = useEditorStore((s) => s.redo)
  const historyPastSize = useEditorStore((s) => s.historyPast.length)
  const historyFutureSize = useEditorStore((s) => s.historyFuture.length)
  const publishSnapshots = useEditorStore((s) => s.publishSnapshots)
  const createPublishSnapshot = useEditorStore((s) => s.createPublishSnapshot)
  const restorePublishSnapshot = useEditorStore((s) => s.restorePublishSnapshot)
  const fileRef = useRef<HTMLInputElement>(null)
  const [workspace, setWorkspace] = useState<'pages' | 'flows'>('pages')
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'ok' | 'error'>('idle')
  const [editingName, setEditingName] = useState(false)
  const [leftPanelPinned, setLeftPanelPinned] = useState(false)
  const [rightPanelPinned, setRightPanelPinned] = useState(false)
  const [leftPanelHover, setLeftPanelHover] = useState(false)
  const [rightPanelHover, setRightPanelHover] = useState(false)
  const [addPanelOpen, setAddPanelOpen] = useState(false)
  const [addCategory, setAddCategory] = useState<(typeof WIX_ADD_CATEGORIES)[number]>('Textos')
  const [pagesMenuOpen, setPagesMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const focusRestoreRef = useRef({ activeLeftPanel: ui.activeLeftPanel, rightPanelOpen: ui.rightPanelOpen })
  const pagesMenuRef = useRef<HTMLDivElement | null>(null)
  const dragRef = useRef<null | { side: 'left' | 'right'; startX: number; startWidth: number }>(null)

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

      if (!editable && event.key === 'Escape' && ui.focusMode) {
        event.preventDefault()
        setFocusMode(false)
        setActiveLeftPanel(focusRestoreRef.current.activeLeftPanel)
        if (focusRestoreRef.current.rightPanelOpen !== ui.rightPanelOpen) toggleRightPanel()
        return
      }

      if (!editable && event.key.toLowerCase() === 'f' && event.shiftKey) {
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
  }, [
    mode,
    nodesById,
    removeNode,
    selectedNodeId,
    setActiveLeftPanel,
    setFocusMode,
    toggleFocusMode,
    toggleRightPanel,
    ui,
  ])

  useEffect(() => {
    if (ui.focusMode) {
      focusRestoreRef.current = { activeLeftPanel: ui.activeLeftPanel, rightPanelOpen: ui.rightPanelOpen }
      if (ui.activeLeftPanel !== null) setActiveLeftPanel(null)
      if (ui.rightPanelOpen) toggleRightPanel()
      return
    }
    const { activeLeftPanel: leftPanel, rightPanelOpen } = focusRestoreRef.current
    if (leftPanel !== ui.activeLeftPanel) setActiveLeftPanel(leftPanel)
    if (rightPanelOpen !== ui.rightPanelOpen) toggleRightPanel()
  }, [setActiveLeftPanel, toggleRightPanel, ui.activeLeftPanel, ui.focusMode, ui.rightPanelOpen])

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      const drag = dragRef.current
      if (!drag) return
      const delta = event.clientX - drag.startX
      if (drag.side === 'left') {
        setLeftPanelWidth(drag.startWidth + delta)
      } else {
        setRightPanelWidth(drag.startWidth - delta)
      }
    }
    const stopDragging = () => { dragRef.current = null }
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', stopDragging)
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', stopDragging)
    }
  }, [setLeftPanelWidth, setRightPanelWidth])

  useEffect(() => {
    const onGlobalMouseDown = (event: MouseEvent) => {
      if (pagesMenuRef.current && !pagesMenuRef.current.contains(event.target as Node)) {
        setPagesMenuOpen(false)
      }
    }
    const onGlobalKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setPagesMenuOpen(false)
      setSearchOpen(false)
      setAddPanelOpen(false)
    }
    window.addEventListener('mousedown', onGlobalMouseDown)
    window.addEventListener('keydown', onGlobalKeyDown)
    return () => {
      window.removeEventListener('mousedown', onGlobalMouseDown)
      window.removeEventListener('keydown', onGlobalKeyDown)
    }
  }, [])

  // Auto-open Inspector when a node gets selected
  useEffect(() => {
    if (selectedNodeId && !ui.rightPanelOpen) {
      toggleRightPanel()
    }
  }, [selectedNodeId, toggleRightPanel, ui.rightPanelOpen])

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
  const leftPanelVisible = Boolean(activeLeftPanel) && (leftPanelPinned || leftPanelHover)
  const rightPanelVisible = ui.rightPanelOpen && (rightPanelPinned || rightPanelHover)

  const filteredTips = IN_APP_TIPS.filter((tip) => (`${tip.title} ${tip.desc} ${tip.group}`).toLowerCase().includes(searchQuery.trim().toLowerCase()))

  // Helper: toggle a specific left panel (same panel click = close)
  const togglePanel = (panel: 'blocks' | 'layers' | 'pages' | 'design') => {
    setAddPanelOpen(false)
    setActiveLeftPanel(activeLeftPanel === panel ? null : panel)
  }

  // ── Sidebar icon button
  const SidebarBtn = ({
    icon, label, onClick, isActive,
  }: {
    icon: string
    label: string
    onClick: () => void
    isActive?: boolean
  }) => {
    const [hov, setHov] = useState(false)
    return (
      <div style={{ position: 'relative' }}>
        <button
          type='button'
          onClick={onClick}
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
    <div className='shell-root'>
      {/* ── Topbar ── */}
      <header className='shell-topbar'>
        {/* Left: logo + project name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: 'linear-gradient(135deg, #116dff, #1d4ed8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
          }}>WB</div>

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
              {ws === 'pages' ? 'Páginas' : 'Flujos'}
            </button>
          ))}

          {workspace === 'pages' && !focusModeActive && (
            <>
              <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }} />
              {/* Page selector (Wix-like menu) */}
              <div ref={pagesMenuRef} style={{ position: 'relative' }}>
                <button
                  type='button'
                  onClick={() => setPagesMenuOpen((prev) => !prev)}
                  style={{
                    padding: '5px 10px', borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-2)', background: 'var(--panel)',
                    color: 'var(--text)', fontSize: 12, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}
                >
                  <span>{pages.find((p) => p.id === activePageId)?.name ?? 'Inicio'}</span>
                  <span style={{ color: 'var(--muted)' }}>▾</span>
                </button>
                {pagesMenuOpen && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', left: 0, width: 260,
                    background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 10,
                    boxShadow: 'var(--shadow-lg)', zIndex: 60, overflow: 'hidden',
                  }}>
                    <div style={{ padding: '10px 14px', fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid var(--border)' }}>Páginas del sitio</div>
                    <div style={{ maxHeight: 220, overflow: 'auto' }}>
                      {pages.map((p) => (
                        <button
                          key={p.id}
                          type='button'
                          onClick={() => { selectPage(p.id); setPagesMenuOpen(false) }}
                          style={{
                            width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer',
                            padding: '10px 14px', fontSize: 14,
                            background: p.id === activePageId ? 'var(--primary)' : 'transparent',
                            color: p.id === activePageId ? '#fff' : 'var(--text)',
                          }}
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                    <div style={{ borderTop: '1px solid var(--border)' }}>
                      <div style={{ padding: '10px 14px', fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid var(--border)' }}>Ventanas emergentes</div>
                      <button
                        type='button'
                        onClick={() => setPagesMenuOpen(false)}
                        style={{ width: '100%', textAlign: 'left', border: 'none', background: 'transparent', color: 'var(--text)', fontSize: 14, cursor: 'pointer', padding: '10px 14px' }}
                      >
                        Suscríbete
                      </button>
                    </div>
                    <div style={{ padding: 10, borderTop: '1px solid var(--border)' }}>
                      <button type='button' onClick={() => { setActiveLeftPanel('pages'); setPagesMenuOpen(false) }} style={{ width: '100%', border: 'none', background: 'transparent', color: 'var(--primary)', fontSize: 14, cursor: 'pointer' }}>Administrar páginas</button>
                    </div>
                  </div>
                )}
              </div>
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
            <>
              <GhostButton onClick={undo} disabled={historyPastSize < 2} title='Deshacer' style={{ fontSize: 11 }}>Deshacer</GhostButton>
              <GhostButton onClick={redo} disabled={historyFutureSize < 1} title='Rehacer' style={{ fontSize: 11 }}>Rehacer</GhostButton>
              <GhostButton onClick={() => createPublishSnapshot()} title='Guardar snapshot de publicación' style={{ fontSize: 11 }}>Snapshot</GhostButton>
              <select
                defaultValue=''
                onChange={(e) => { if (e.target.value) restorePublishSnapshot(e.target.value); e.target.value = '' }}
                style={{ padding: '5px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', fontSize: 11 }}
              >
                <option value=''>Restaurar snapshot…</option>
                {publishSnapshots.map((snapshot) => <option key={snapshot.id} value={snapshot.id}>{snapshot.label}</option>)}
              </select>
            </>
          )}

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

          <GhostButton onClick={() => setSearchOpen(true)} title='Buscar en editor' style={{ fontSize: 11 }}>Buscar</GhostButton>

          <div style={{ width: 1, height: 20, background: 'var(--border)' }} />

          {workspace === 'pages' && (
            <GhostButton onClick={toggleFocusMode} title='Activar/desactivar Focus (Shift+F / Esc)' style={{ fontSize: 11 }}>
              {focusModeActive ? '⤫ Exit Focus' : '◉ Focus'}
            </GhostButton>
          )}

          {/* Preview */}
          {workspace === 'pages' && (
            <PrimaryButton
              onClick={() => setMode(mode === 'edit' ? 'preview' : 'edit')}
              style={{ background: mode === 'preview' ? '#22c55e' : undefined, fontSize: 11 }}
            >
              {mode === 'edit' ? 'Vista previa' : 'Editar'}
            </PrimaryButton>
          )}

          {/* Import / Export */}
          {!focusModeActive && (
            <>
              <GhostButton onClick={handleExport} title='Exportar diseño a JSON' style={{ fontSize: 11 }}>Exportar</GhostButton>
              <GhostButton onClick={() => fileRef.current?.click()} title='Importar JSON' style={{ fontSize: 11 }}>Importar</GhostButton>
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
      <div className='shell-main'>

        {/* ── Left Icon Sidebar (Wix-style) ── */}
        {workspace === 'pages' && !focusModeActive && (
          <nav className='shell-sidebar'>
            {/* Add block shortcut */}
            <button
              type='button'
              title='Agregar bloque'
              onClick={() => { setAddPanelOpen((prev) => !prev); setActiveLeftPanel(null) }}
              style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0, marginBottom: 6,
                background: 'linear-gradient(135deg, var(--primary), #3b82f6)',
                border: 'none', color: '#fff', cursor: 'pointer', fontSize: 20, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 12px var(--primary-glow)',
                transition: 'transform 120ms',
              }}
            >+</button>
            {/* Divider */}
            <div style={{ width: 28, height: 1, background: 'var(--border)', marginBottom: 4 }} />
            <SidebarBtn icon='⊞' label='Elementos' onClick={() => { setAddPanelOpen(true); setActiveLeftPanel('blocks') }} isActive={activeLeftPanel === 'blocks'} />
            <SidebarBtn icon='▤' label='Secciones' onClick={() => togglePanel('layers')} isActive={activeLeftPanel === 'layers'} />
            <SidebarBtn icon='📄' label='Páginas' onClick={() => togglePanel('pages')} isActive={activeLeftPanel === 'pages'} />
            <SidebarBtn icon='✦' label='Diseño' onClick={() => togglePanel('design')} isActive={activeLeftPanel === 'design'} />
            <SidebarBtn icon='⬚' label='Apps' onClick={() => { setAddPanelOpen(true); setAddCategory('CMS') }} />
            <SidebarBtn icon='⚙' label='Negocio' onClick={() => { setAddPanelOpen(true); setAddCategory('Pagos') }} />
            <SidebarBtn icon='🖼' label='Media' onClick={() => { setAddPanelOpen(true); setAddCategory('Imágenes') }} />
            <SidebarBtn icon='▦' label='CMS' onClick={() => { setAddPanelOpen(true); setAddCategory('CMS') }} />
            <div style={{ flex: 1 }} />
            <button
              type='button'
              title={leftPanelPinned ? 'Cambiar a apertura por hover' : 'Fijar panel izquierdo'}
              onClick={() => setLeftPanelPinned((prev) => !prev)}
              style={{
                width: 36,
                height: 28,
                borderRadius: 999,
                border: '1px solid var(--border-2)',
                background: leftPanelPinned ? 'var(--surface-hover)' : 'transparent',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              {leftPanelPinned ? 'PIN' : 'HOV'}
            </button>
          </nav>
        )}

        {/* ── Canvas + floating panels wrapper ── */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: 'linear-gradient(180deg, #f5f8fd 0%, #eef2f7 100%)' }}>

          {/* Canvas — always full width */}
          {workspace === 'pages'
            ? <section style={{ width: '100%', height: '100%', overflow: 'hidden' }}><Canvas /></section>
            : <section style={{ width: '100%', height: '100%', overflow: 'auto' }}><FlowStudio /></section>
          }


          {/* ── Wix-like Add Elements Drawer ── */}
          {workspace === 'pages' && !focusModeActive && addPanelOpen && (
            <section
              style={{
                position: 'absolute',
                left: 72,
                top: 16,
                width: 'min(980px, calc(100% - 96px))',
                height: 'min(760px, calc(100% - 32px))',
                background: 'var(--panel)',
                border: '1px solid var(--border)',
                borderRadius: 14,
                boxShadow: 'var(--shadow-lg)',
                zIndex: 24,
                overflow: 'hidden',
                display: 'grid',
                gridTemplateColumns: '320px 280px 1fr',
              }}
            >
              <div style={{ borderRight: '1px solid var(--border)', padding: 16, overflow: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <h3 style={{ margin: 0, fontSize: 34, fontWeight: 700, color: 'var(--text)' }}>Agregar elementos</h3>
                  <button type='button' onClick={() => setAddPanelOpen(false)} style={{ border: 'none', background: 'transparent', color: 'var(--text-secondary)', fontSize: 26, cursor: 'pointer' }}>×</button>
                </div>
                <div style={{ display: 'grid', gap: 4 }}>
                  {WIX_ADD_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type='button'
                      onClick={() => setAddCategory(cat)}
                      style={{
                        textAlign: 'left',
                        border: 'none',
                        borderRadius: 999,
                        padding: '9px 12px',
                        background: addCategory === cat ? 'var(--primary-dim)' : 'transparent',
                        color: addCategory === cat ? 'var(--primary)' : 'var(--text)',
                        fontSize: 15,
                        cursor: 'pointer',
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ borderRight: '1px solid var(--border)', padding: 16, overflow: 'auto' }}>
                <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: 12 }}>Plantillas {addCategory}</div>
                <div style={{ display: 'grid', gap: 10 }}>
                  {(WIX_ADD_ITEMS[addCategory] ?? []).map((item) => (
                    <button
                      key={item}
                      type='button'
                      onClick={() => { setActiveLeftPanel('blocks'); setAddPanelOpen(false) }}
                      style={{
                        textAlign: 'left',
                        border: '1px solid var(--border)',
                        borderRadius: 10,
                        padding: '10px 12px',
                        background: 'var(--surface)',
                        color: 'var(--text)',
                        cursor: 'pointer',
                      }}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ padding: 18, overflow: 'auto' }}>
                <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: 12 }}>Vista previa</div>
                <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 20, background: 'linear-gradient(180deg, #fff, #f8fbff)', minHeight: 240 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>{addCategory}</div>
                  <p style={{ marginTop: 0, color: 'var(--text-secondary)' }}>Selecciona una plantilla para insertarla rápidamente en la página y luego ajustarla desde el inspector.</p>
                  <PrimaryButton onClick={() => { setActiveLeftPanel('blocks'); setAddPanelOpen(false) }}>
                    Abrir biblioteca completa
                  </PrimaryButton>
                </div>
              </div>
            </section>
          )}

          {/* ── Floating Left Panel ── */}
          {workspace === 'pages' && !focusModeActive && (
            <aside
              className='shell-float-panel left'
              onMouseEnter={() => setLeftPanelHover(true)}
              onMouseLeave={() => setLeftPanelHover(false)}
              style={{
                width: ui.leftPanelWidth,
                transform: activeLeftPanel ? (leftPanelVisible ? 'translateX(0)' : 'translateX(calc(-100% + 14px))') : 'translateX(-100%)',
                boxShadow: leftPanelVisible ? '6px 0 30px rgba(0,0,0,0.4)' : 'none',
                pointerEvents: activeLeftPanel ? 'auto' : 'none',
              }}
            >
              {/* Panel header */}
              <ShellPanelHeader title={activeLeftPanel === 'blocks' ? 'Blocks' : activeLeftPanel === 'layers' ? 'Layers' : activeLeftPanel === 'pages' ? 'Pages' : 'Design'}>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <ShellIconButton title='Reducir ancho' onClick={() => setLeftPanelWidth(ui.leftPanelWidth - 20)}>−</ShellIconButton>
                  <ShellIconButton title='Ampliar ancho' onClick={() => setLeftPanelWidth(ui.leftPanelWidth + 20)}>+</ShellIconButton>
                  <ShellIconButton title={leftPanelPinned ? 'Panel por hover' : 'Fijar panel'} onClick={() => setLeftPanelPinned((prev) => !prev)}>{leftPanelPinned ? 'P' : 'H'}</ShellIconButton>
                  <ShellIconButton size='md' onClick={() => setActiveLeftPanel(null)} title='Cerrar panel'>✕</ShellIconButton>
                </div>
              </ShellPanelHeader>

              {/* Panel content */}
              <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {activeLeftPanel === 'blocks' && <BlocksPanel key='blocks' defaultTab='blocks' />}
                {activeLeftPanel === 'layers' && <BlocksPanel key='layers' defaultTab='layers' />}
                {activeLeftPanel === 'pages' && <PagesPanel />}
                {activeLeftPanel === 'design' && <SiteDesignPanel />}
              </div>
              <div
                className='shell-resize-handle left'
                onPointerDown={(event) => {
                  dragRef.current = { side: 'left', startX: event.clientX, startWidth: ui.leftPanelWidth }
                }}
              />
            </aside>
          )}

          {/* ── Floating Right Panel (Inspector) ── */}
          {workspace === 'pages' && !focusModeActive && (
            <aside
              className='shell-float-panel right'
              onMouseEnter={() => setRightPanelHover(true)}
              onMouseLeave={() => setRightPanelHover(false)}
              style={{
                width: ui.rightPanelWidth,
                transform: ui.rightPanelOpen ? (rightPanelVisible ? 'translateX(0)' : 'translateX(calc(100% - 14px))') : 'translateX(100%)',
                boxShadow: rightPanelVisible ? '-6px 0 30px rgba(0,0,0,0.4)' : 'none',
                pointerEvents: ui.rightPanelOpen ? 'auto' : 'none',
              }}
            >
              {/* Inspector resize controls */}
              <ShellPanelHeader title='Inspector'>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <ShellIconButton title='Reducir ancho' onClick={() => setRightPanelWidth(ui.rightPanelWidth - 20)}>−</ShellIconButton>
                  <ShellIconButton title='Ampliar ancho' onClick={() => setRightPanelWidth(ui.rightPanelWidth + 20)}>+</ShellIconButton>
                  <ShellIconButton title={rightPanelPinned ? 'Inspector por hover' : 'Fijar inspector'} onClick={() => setRightPanelPinned((prev) => !prev)}>{rightPanelPinned ? 'P' : 'H'}</ShellIconButton>
                  <ShellIconButton size='md' onClick={toggleRightPanel} title='Cerrar Inspector'>✕</ShellIconButton>
                </div>
              </ShellPanelHeader>
              <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <Inspector />
              </div>
              <div
                className='shell-resize-handle right'
                onPointerDown={(event) => {
                  dragRef.current = { side: 'right', startX: event.clientX, startWidth: ui.rightPanelWidth }
                }}
              />
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
                right: ui.rightPanelOpen ? (rightPanelVisible ? ui.rightPanelWidth : 14) : 0,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 25,
                width: 20,
                height: 48,
                border: '1px solid var(--border)',
                borderRight: ui.rightPanelOpen ? '1px solid var(--border)' : 'none',
                borderRadius: ui.rightPanelOpen ? '6px 0 0 6px' : '6px 0 0 6px',
                background: 'var(--panel-alt)',
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


      {searchOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(3, 9, 23, 0.28)', zIndex: 80, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: 88 }} onClick={() => setSearchOpen(false)}>
          <div style={{ width: 'min(920px, 92vw)', maxHeight: '78vh', background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: 'var(--shadow-lg)', overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: 14, borderBottom: '1px solid var(--border)' }}>
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder='Buscar herramientas, acciones, formularios, SEO…'
                style={{ width: '100%', border: '1px solid var(--border-2)', borderRadius: 10, padding: '10px 12px', fontSize: 16, outline: 'none', background: 'var(--panel)', color: 'var(--text)' }}
              />
            </div>
            <div style={{ maxHeight: '64vh', overflow: 'auto' }}>
              {(['Acciones del sitio', 'Herramientas y opciones', 'Panel de control'] as const).map((group) => {
                const items = filteredTips.filter((tip) => tip.group === group)
                if (!items.length) return null
                return (
                  <div key={group}>
                    <div style={{ padding: '10px 16px', fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>{group}</div>
                    {items.map((tip) => (
                      <button key={`${group}-${tip.title}`} type='button' onClick={() => setSearchOpen(false)} style={{ width: '100%', textAlign: 'left', border: 'none', background: 'transparent', borderBottom: '1px solid var(--border)', padding: '12px 16px', cursor: 'pointer' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--primary-dim)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>⚙</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 18, color: 'var(--text)', marginBottom: 4 }}>{tip.title}</div>
                            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>{tip.desc}</div>
                            <span style={{ fontSize: 12, color: '#fff', fontWeight: 700, background: 'var(--primary)', borderRadius: 999, padding: '4px 10px', display: 'inline-flex' }}>{tip.cta}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )
              })}
              {!filteredTips.length && <div style={{ padding: 20, color: 'var(--muted)' }}>No se encontraron resultados para “{searchQuery}”.</div>}
            </div>
          </div>
        </div>
      )}

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
