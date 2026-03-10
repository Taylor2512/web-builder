import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { useMemo, useState } from 'react'
import { buildNode, useEditorStore } from '../state/useEditorStore'
import { containerTypes, type NodeType } from '../types/schema'
import { PanelTitle, Separator } from '../../shared/ui'
import type { LibraryTemplate } from '../library'

type CategoryKey = 'estructura' | 'contenido' | 'formularios' | 'extras'
type LayerVisibilityFilter = 'all' | 'visible' | 'hidden'

type LayerNode = { type: string; children: string[]; isHidden?: boolean }

const CATEGORY_LABELS: Record<CategoryKey, string> = {
  estructura: 'Layout',
  contenido: 'Content',
  formularios: 'Forms & Data',
  extras: 'Extras',
}

/* SVG icon map – clean, minimal line icons */
const ICONS: Record<string, string> = {
  page: '⬜',
  section: '▭',
  container: '⊡',
  grid: '⊞',
  spacer: '⇕',
  divider: '─',
  text: 'T',
  image: '⛶',
  button: '⏹',
  link: '🔗',
  navbar: '☰',
  form: '✎',
  dateInput: '📅',
  searchSelect: '⌄',
  dataTable: '⊟',
  searchBar: '⌕',
  repeater: '↻',
}

const BLOCK_METADATA: Record<NodeType, { label: string; description: string; category: CategoryKey }> = {
  page: { label: 'Page', description: 'Root page container', category: 'estructura' },
  section: { label: 'Section', description: 'Full-width section block', category: 'estructura' },
  container: { label: 'Container', description: 'Flexbox layout wrapper', category: 'estructura' },
  grid: { label: 'Grid', description: 'CSS Grid layout', category: 'estructura' },
  spacer: { label: 'Spacer', description: 'Vertical spacing', category: 'estructura' },
  divider: { label: 'Divider', description: 'Horizontal separator line', category: 'estructura' },
  text: { label: 'Text', description: 'Headings & paragraphs', category: 'contenido' },
  image: { label: 'Image', description: 'Responsive image', category: 'contenido' },
  button: { label: 'Button', description: 'Call to action link', category: 'contenido' },
  link: { label: 'Link', description: 'Route to page/path', category: 'contenido' },
  navbar: { label: 'Navbar', description: 'Navigation links list', category: 'contenido' },
  form: { label: 'Form', description: 'Dynamic form builder', category: 'formularios' },
  dateInput: { label: 'Date Picker', description: 'Date selection input', category: 'formularios' },
  searchSelect: { label: 'Search Select', description: 'Filterable dropdown', category: 'formularios' },
  dataTable: { label: 'Data Table', description: 'Table / list display', category: 'formularios' },
  searchBar: { label: 'Search Bar', description: 'Search input field', category: 'formularios' },
  repeater: { label: 'Repeater', description: 'Repeat layout per item', category: 'formularios' },
}

const SECTION_ORDER: CategoryKey[] = ['estructura', 'contenido', 'formularios', 'extras']

/* ── Category color accents ── */
const CATEGORY_COLOR: Record<CategoryKey, string> = {
  estructura: '#6366f1',
  contenido: '#22d3ee',
  formularios: '#f59e0b',
  extras: '#a78bfa',
}

const highlightLabel = (label: string, query: string) => {
  if (!query) return label
  const lowerLabel = label.toLowerCase()
  const lowerQuery = query.toLowerCase()
  const start = lowerLabel.indexOf(lowerQuery)
  if (start < 0) return label
  const end = start + query.length
  return (
    <>
      {label.slice(0, start)}
      <mark style={{ background: 'rgba(250,204,21,0.25)', color: 'inherit', padding: 0 }}>{label.slice(start, end)}</mark>
      {label.slice(end)}
    </>
  )
}

const collectLayerMatches = ({
  id,
  nodesById,
  query,
  visibility,
}: {
  id: string
  nodesById: Record<string, LayerNode>
  query: string
  visibility: LayerVisibilityFilter
}): Set<string> => {
  const matches = new Set<string>()
  const normalizedQuery = query.trim().toLowerCase()

  const visit = (nodeId: string): boolean => {
    const node = nodesById[nodeId]
    if (!node) return false

    const hidden = Boolean(node.isHidden)
    const visibilityMatch = visibility === 'all' || (visibility === 'visible' ? !hidden : hidden)
    const searchMatch = normalizedQuery
      ? node.type.toLowerCase().includes(normalizedQuery) || nodeId.toLowerCase().includes(normalizedQuery)
      : false

    let childIncluded = false
    for (const childId of node.children) {
      if (visit(childId)) childIncluded = true
    }

    const includeByFilter = normalizedQuery
      ? searchMatch || childIncluded
      : visibilityMatch || childIncluded

    if (includeByFilter) {
      matches.add(nodeId)
      return true
    }

    return false
  }

  visit(id)
  return matches
}

/* ── Single compact block tile ── */
function BlockTile({ type, allowed, onAdd }: { type: NodeType; allowed: boolean; onAdd: () => void }) {
  const meta = BLOCK_METADATA[type] ?? { label: type, description: '', category: 'extras' }
  const icon = ICONS[type] ?? '◻'
  const [hov, setHov] = useState(false)

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette-${type}`,
    data: { blockType: type, source: 'palette' },
  })

  return (
    <div style={{ position: 'relative', display: 'grid' }}>
      <button
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        type='button'
        disabled={!allowed}
        onClick={(e) => { e.preventDefault(); if (allowed) onAdd() }}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        title={`${meta.label} — ${meta.description}`}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 5,
          padding: '10px 6px 8px',
          borderRadius: 'var(--radius-sm)',
          border: `1px solid ${!allowed
            ? 'rgba(244,63,94,0.35)'
            : hov ? 'var(--primary)' : 'var(--border)'}`,
          background: !allowed
            ? 'var(--danger-dim)'
            : hov ? 'var(--primary-dim)' : 'var(--surface)',
          color: !allowed ? 'var(--danger)' : hov ? 'var(--primary)' : 'var(--text)',
          cursor: allowed ? 'grab' : 'not-allowed',
          opacity: isDragging ? 0.4 : 1,
          transform: CSS.Translate.toString(transform),
          transition: 'border-color 120ms, background 120ms, color 120ms',
          userSelect: 'none',
          minHeight: 64,
          boxShadow: hov && allowed ? '0 0 0 2px var(--primary-glow)' : 'none',
        }}
      >
        <span style={{ fontSize: 16, lineHeight: 1, fontFamily: 'var(--font-mono)' }}>{icon}</span>
        <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.03em', textAlign: 'center', lineHeight: 1.2 }}>{meta.label}</span>
      </button>
    </div>
  )
}

function LibraryTemplateTile({
  template,
  allowed,
  onInsert,
  onDelete,
}: {
  template: LibraryTemplate
  allowed: boolean
  onInsert: () => void
  onDelete: () => void
}) {
  const [hov, setHov] = useState(false)
  const rootType = template.nodesById[template.rootNodeId]?.type ?? 'template'
  const nodeCount = Object.keys(template.nodesById).length
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `library-${template.id}`,
    data: { templateId: template.id, source: 'library' },
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'grid',
        gap: 8,
        padding: 10,
        borderRadius: 'var(--radius-sm)',
        border: `1px solid ${hov ? 'var(--primary)' : 'var(--border)'}`,
        background: hov ? 'var(--primary-dim)' : 'var(--surface)',
        opacity: isDragging ? 0.4 : 1,
        transform: CSS.Translate.toString(transform),
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <strong style={{ fontSize: 12 }}>{template.name}</strong>
        <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{rootType}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{nodeCount} nodes</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type='button'
            disabled={!allowed}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              if (allowed) onInsert()
            }}
            style={{
              border: '1px solid var(--primary)',
              background: 'var(--primary-dim)',
              color: 'var(--primary)',
              borderRadius: 999,
              fontSize: 11,
              padding: '3px 9px',
              cursor: allowed ? 'pointer' : 'not-allowed',
            }}
          >
            Insertar
          </button>
          <button
            type='button'
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            style={{
              border: '1px solid rgba(244,63,94,0.45)',
              background: 'rgba(244,63,94,0.12)',
              color: 'var(--danger)',
              borderRadius: 999,
              fontSize: 11,
              padding: '3px 9px',
              cursor: 'pointer',
            }}
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Collapsible section ── */
function CategorySection({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true)
  return (
    <div>
      <button
        type='button'
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          width: '100%', padding: '5px 4px',
          background: 'none', border: 'none',
          color: 'var(--text-secondary)', cursor: 'pointer',
          fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
          marginBottom: 6,
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
        {title}
        <span style={{ marginLeft: 'auto', fontSize: 10 }}>{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {children}
        </div>
      )}
    </div>
  )
}

/* ── Layer tree item ── */
function LayerItem({ id, depth, nodesById, selectedId, onSelect, onToggleVisibility, visibleNodeIds, layerSearch }:
  {
    id: string
    depth: number
    nodesById: Record<string, LayerNode>
    selectedId: string | null
    onSelect: (id: string) => void
    onToggleVisibility: (id: string) => void
    visibleNodeIds: Set<string>
    layerSearch: string
  }) {
  const node = nodesById[id]
  const [open, setOpen] = useState(true)
  if (!node || !visibleNodeIds.has(id)) return null
  const isActive = id === selectedId
  const isContainer = containerTypes.includes(node.type as NodeType)
  const isHidden = Boolean(node.isHidden)

  return (
    <div>
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          paddingLeft: depth * 14 + 4, paddingRight: 4, paddingTop: 4, paddingBottom: 4,
          borderRadius: 'var(--radius-sm)',
          background: isActive ? 'var(--primary-dim)' : 'transparent',
          cursor: 'pointer',
          marginBottom: 1,
          opacity: isHidden ? 0.65 : 1,
        }}
        onClick={() => onSelect(id)}
      >
        {isContainer && node.children.length > 0 ? (
          <span
            onClick={(e) => { e.stopPropagation(); setOpen(!open) }}
            style={{ color: 'var(--muted)', fontSize: 10, width: 12, flexShrink: 0, textAlign: 'center' }}
          >
            {open ? '▾' : '▸'}
          </span>
        ) : (
          <span style={{ width: 12, flexShrink: 0 }} />
        )}
        <span style={{ fontSize: 11, color: isActive ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: isActive ? 600 : 400, fontFamily: 'var(--font-mono)' }}>
          {highlightLabel(node.type, layerSearch)}
        </span>
        {isHidden && (
          <span
            title='Componente oculto'
            style={{
              fontSize: 10,
              color: 'var(--warning)',
              border: '1px solid rgba(245,158,11,0.45)',
              background: 'rgba(245,158,11,0.1)',
              borderRadius: 999,
              padding: '1px 6px',
              lineHeight: 1.4,
            }}
          >
            ◌ oculto
          </span>
        )}
        <button
          type='button'
          title={node.isHidden ? 'Show node' : 'Hide node'}
          onClick={(e) => {
            e.stopPropagation()
            onToggleVisibility(id)
          }}
          style={{
            marginLeft: 'auto',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: 12,
            padding: 0,
            lineHeight: 1,
            opacity: isHidden ? 0.8 : 1,
          }}
        >
          {node.isHidden ? '🚫' : '👁'}
        </button>
        <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{highlightLabel(id.slice(-4), layerSearch)}</span>
      </div>
      {open && isContainer && node.children.map((childId) => (
        <LayerItem
          key={childId}
          id={childId}
          depth={depth + 1}
          nodesById={nodesById}
          selectedId={selectedId}
          onSelect={onSelect}
          onToggleVisibility={onToggleVisibility}
          visibleNodeIds={visibleNodeIds}
          layerSearch={layerSearch}
        />
      ))}
    </div>
  )
}

/* ── Main panel ── */
export default function BlocksPanel({ defaultTab = 'blocks' }: { defaultTab?: 'blocks' | 'layers' | 'library' }) {
  const [tab, setTab] = useState<'blocks' | 'layers' | 'library'>(defaultTab)
  const [blockSearch, setBlockSearch] = useState('')
  const [layerSearch, setLayerSearch] = useState('')
  const [layerVisibility, setLayerVisibility] = useState<LayerVisibilityFilter>('all')
  const rootId = useEditorStore((s) => s.rootId)
  const nodesById = useEditorStore((s) => s.nodesById)
  const selectedNodeId = useEditorStore((s) => s.selectedNodeId)
  const addNode = useEditorStore((s) => s.addNode)
  const selectNode = useEditorStore((s) => s.selectNode)
  const toggleNodeVisibility = useEditorStore((s) => s.toggleNodeVisibility)
  const showAllNodes = useEditorStore((s) => s.showAllNodes)
  const enabledBlocks = useEditorStore((s) => s.builderConfig.blocks.enabled)
  const constraints = useEditorStore((s) => s.builderConfig.constraints)
  const libraryTemplates = useEditorStore((s) => s.libraryTemplates)
  const saveSelectionAsTemplate = useEditorStore((s) => s.saveSelectionAsTemplate)
  const insertTemplate = useEditorStore((s) => s.insertTemplate)
  const removeTemplate = useEditorStore((s) => s.removeTemplate)

  const hiddenNodesCount = useMemo(
    () => Object.values(nodesById).filter((node) => node.isHidden).length,
    [nodesById],
  )

  const visibleLayerNodes = useMemo(
    () => collectLayerMatches({
      id: rootId,
      nodesById: nodesById as Record<string, LayerNode>,
      query: layerSearch,
      visibility: layerVisibility,
    }),
    [layerSearch, layerVisibility, nodesById, rootId],
  )

  const parentId = useMemo(() => {
    const selected = selectedNodeId ? nodesById[selectedNodeId] : null
    if (selected && containerTypes.includes(selected.type)) return selected.id
    return rootId
  }, [selectedNodeId, nodesById, rootId])

  const parentNode = nodesById[parentId]

  const canInsert = (type: NodeType) => {
    if (!parentNode) return true
    const target = constraints.allowedParents[type]
    if (target && !target.includes(parentNode.type)) return false
    const max = constraints.maxChildren[parentNode.type]
    if (typeof max === 'number' && parentNode.children.length >= max) return false
    return true
  }

  const hasChildCapacity = (targetParentId: string) => {
    const parent = nodesById[targetParentId]
    if (!parent) return false
    const max = constraints.maxChildren[parent.type]
    return typeof max !== 'number' || parent.children.length < max
  }

  const addBlock = (type: NodeType) => {
    addNode(parentId ?? rootId, buildNode(type))
  }

  const addTemplate = () => {
    const name = window.prompt('Nombre del template', '')
    if (name === null) return
    saveSelectionAsTemplate(name)
  }

  const canInsertTemplate = (template: LibraryTemplate) => {
    const parent = nodesById[parentId]
    const templateRoot = template.nodesById[template.rootNodeId]
    if (!parent || !templateRoot) return false
    const allowed = constraints.allowedParents[templateRoot.type]
    if (allowed && !allowed.includes(parent.type)) return false
    return hasChildCapacity(parentId)
  }

  const sections = useMemo(() =>
    SECTION_ORDER.map((category) => ({
      category,
      color: CATEGORY_COLOR[category],
      title: CATEGORY_LABELS[category],
      types: enabledBlocks.filter((type) => {
        const meta = BLOCK_METADATA[type]
        const cat = meta?.category ?? 'extras'
        if (cat !== category) return false
        if (blockSearch) return meta.label.toLowerCase().includes(blockSearch.toLowerCase())
        return true
      }),
    })), [enabledBlocks, blockSearch])

  const parentLabel = parentNode
    ? `${parentNode.type}${containerTypes.includes(parentNode.type) ? ' (container)' : ''}`
    : 'Canvas'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Tab bar */}
      <div style={{ padding: '10px 12px 0', display: 'flex', gap: 2, borderBottom: '1px solid var(--border)' }}>
        {(['blocks', 'library', 'layers'] as const).map((t) => (
          <button
            key={t}
            type='button'
            onClick={() => setTab(t)}
            style={{
              flex: 1, padding: '7px 0', background: 'none', border: 'none',
              borderBottom: tab === t ? '2px solid var(--primary)' : '2px solid transparent',
              color: tab === t ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: tab === t ? 700 : 500, fontSize: 12, cursor: 'pointer',
              letterSpacing: '0.04em', textTransform: 'capitalize',
              marginBottom: -1,
            }}
          >
            {t === 'blocks' ? 'Components' : t === 'library' ? 'Library' : 'Layers'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: 10 }}>
        {tab === 'blocks' && (
          <div style={{ display: 'grid', gap: 10 }}>
            {/* Search */}
            <input
              type='search'
              placeholder='Search blocks…'
              value={blockSearch}
              onChange={(e) => setBlockSearch(e.target.value)}
              style={{
                width: '100%', padding: '6px 10px',
                borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-2)',
                background: 'rgba(0,0,0,0.25)', color: 'var(--text)', outline: 'none',
                fontSize: 12, boxSizing: 'border-box',
              }}
            />
            {/* Insert target hint */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px',
              background: 'var(--primary-dim)', borderRadius: 'var(--radius-sm)',
              fontSize: 11, color: 'var(--primary)',
            }}>
              <span>↳</span>
              <span>Drop into: <strong>{parentLabel}</strong></span>
            </div>

            {/* Sections */}
            {sections.map((section) => {
              if (!section.types.length) return null
              return (
                <CategorySection key={section.category} title={section.title} color={section.color}>
                  {section.types.map((type) => (
                    <BlockTile key={type} type={type} allowed={canInsert(type)} onAdd={() => addBlock(type)} />
                  ))}
                </CategorySection>
              )
            })}
            {sections.every((s) => !s.types.length) && (
              <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 12, padding: 20 }}>No blocks match</div>
            )}
          </div>
        )}

        {tab === 'library' && (
          <div style={{ display: 'grid', gap: 10 }}>
            <button
              type='button'
              onClick={addTemplate}
              disabled={!selectedNodeId || selectedNodeId === rootId}
              style={{
                border: '1px solid var(--primary)',
                background: 'var(--primary-dim)',
                color: 'var(--primary)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 12,
                fontWeight: 600,
                padding: '7px 10px',
                cursor: !selectedNodeId || selectedNodeId === rootId ? 'not-allowed' : 'pointer',
              }}
            >
              Guardar selección como template
            </button>
            {!selectedNodeId || selectedNodeId === rootId ? (
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                Selecciona un nodo (no root) para guardarlo en librería.
              </div>
            ) : null}
            <div style={{ display: 'grid', gap: 8 }}>
              {libraryTemplates.map((template) => (
                <LibraryTemplateTile
                  key={template.id}
                  template={template}
                  allowed={canInsertTemplate(template)}
                  onInsert={() => insertTemplate(template.id, parentId)}
                  onDelete={() => removeTemplate(template.id)}
                />
              ))}
            </div>
            {!libraryTemplates.length && (
              <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 12, padding: 20 }}>
                No hay templates guardados.
              </div>
            )}
          </div>
        )}

        {tab === 'layers' && (
          <div style={{ display: 'grid', gap: 8 }}>
            <PanelTitle>Document Tree</PanelTitle>
            <input
              type='search'
              placeholder='Buscar en layers…'
              value={layerSearch}
              onChange={(e) => setLayerSearch(e.target.value)}
              style={{
                width: '100%', padding: '6px 10px',
                borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-2)',
                background: 'rgba(0,0,0,0.25)', color: 'var(--text)', outline: 'none',
                fontSize: 12, boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {([
                { key: 'all', label: 'Todos' },
                { key: 'visible', label: 'Visibles' },
                { key: 'hidden', label: 'Ocultos' },
              ] as const).map((filter) => (
                <button
                  key={filter.key}
                  type='button'
                  onClick={() => setLayerVisibility(filter.key)}
                  style={{
                    border: '1px solid',
                    borderColor: layerVisibility === filter.key ? 'var(--primary)' : 'var(--border)',
                    background: layerVisibility === filter.key ? 'var(--primary-dim)' : 'var(--surface)',
                    color: layerVisibility === filter.key ? 'var(--primary)' : 'var(--text-secondary)',
                    borderRadius: 999,
                    fontSize: 11,
                    padding: '3px 9px',
                    cursor: 'pointer',
                  }}
                >
                  {filter.label}
                </button>
              ))}
              {hiddenNodesCount > 0 && (
                <button
                  type='button'
                  onClick={showAllNodes}
                  style={{
                    marginLeft: 'auto',
                    border: '1px solid rgba(34,197,94,0.45)',
                    background: 'rgba(34,197,94,0.12)',
                    color: 'var(--success)',
                    borderRadius: 999,
                    fontSize: 11,
                    padding: '3px 9px',
                    cursor: 'pointer',
                  }}
                >
                  Mostrar todo ({hiddenNodesCount})
                </button>
              )}
            </div>
            <Separator />
            <LayerItem
              id={rootId}
              depth={0}
              nodesById={nodesById as Record<string, LayerNode>}
              selectedId={selectedNodeId}
              onSelect={selectNode}
              onToggleVisibility={toggleNodeVisibility}
              visibleNodeIds={visibleLayerNodes}
              layerSearch={layerSearch}
            />
            {visibleLayerNodes.size === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 12, padding: 12 }}>
                No hay coincidencias en layers.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
