import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { useMemo, useState } from 'react'
import { buildNode, useEditorStore } from '../state/useEditorStore'
import { containerTypes, type NodeType } from '../types/schema'
import { PanelTitle, Separator } from '../../shared/ui'

type CategoryKey = 'estructura' | 'contenido' | 'formularios' | 'extras'

const CATEGORY_LABELS: Record<CategoryKey, string> = {
  estructura: 'Layout',
  contenido: 'Content',
  formularios: 'Forms & Data',
  extras: 'Extras',
}

/* SVG icon map – clean, minimal line icons */
const ICONS: Record<string, string> = {
  page:        '⬜',
  section:     '▭',
  container:   '⊡',
  grid:        '⊞',
  spacer:      '⇕',
  divider:     '─',
  text:        'T',
  image:       '⛶',
  button:      '⏹',
  form:        '✎',
  dateInput:   '📅',
  searchSelect:'⌄',
  dataTable:   '⊟',
  searchBar:   '⌕',
  repeater:    '↻',
}

const BLOCK_METADATA: Record<NodeType, { label: string; description: string; category: CategoryKey }> = {
  page:        { label: 'Page',         description: 'Root page container',        category: 'estructura' },
  section:     { label: 'Section',      description: 'Full-width section block',   category: 'estructura' },
  container:   { label: 'Container',    description: 'Flexbox layout wrapper',     category: 'estructura' },
  grid:        { label: 'Grid',         description: 'CSS Grid layout',            category: 'estructura' },
  spacer:      { label: 'Spacer',       description: 'Vertical spacing',           category: 'estructura' },
  divider:     { label: 'Divider',      description: 'Horizontal separator line',  category: 'estructura' },
  text:        { label: 'Text',         description: 'Headings & paragraphs',      category: 'contenido' },
  image:       { label: 'Image',        description: 'Responsive image',           category: 'contenido' },
  button:      { label: 'Button',       description: 'Call to action link',        category: 'contenido' },
  form:        { label: 'Form',         description: 'Dynamic form builder',       category: 'formularios' },
  dateInput:   { label: 'Date Picker',  description: 'Date selection input',       category: 'formularios' },
  searchSelect:{ label: 'Search Select','description': 'Filterable dropdown',      category: 'formularios' },
  dataTable:   { label: 'Data Table',   description: 'Table / list display',       category: 'formularios' },
  searchBar:   { label: 'Search Bar',   description: 'Search input field',         category: 'formularios' },
  repeater:    { label: 'Repeater',     description: 'Repeat layout per item',     category: 'formularios' },
}

const SECTION_ORDER: CategoryKey[] = ['estructura', 'contenido', 'formularios', 'extras']

/* ── Category color accents ── */
const CATEGORY_COLOR: Record<CategoryKey, string> = {
  estructura:  '#6366f1',
  contenido:   '#22d3ee',
  formularios: '#f59e0b',
  extras:      '#a78bfa',
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
function LayerItem({ id, depth, nodesById, selectedId, onSelect }:
  { id: string; depth: number; nodesById: Record<string, { type: string; children: string[] }>; selectedId: string | null; onSelect: (id: string) => void }) {
  const node = nodesById[id]
  const [open, setOpen] = useState(true)
  if (!node) return null
  const isActive = id === selectedId
  const isContainer = containerTypes.includes(node.type as NodeType)

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
          {node.type}
        </span>
        <span style={{ fontSize: 10, color: 'var(--muted)', marginLeft: 'auto', fontFamily: 'var(--font-mono)' }}>{id.slice(-4)}</span>
      </div>
      {open && isContainer && node.children.map((childId) => (
        <LayerItem key={childId} id={childId} depth={depth + 1} nodesById={nodesById} selectedId={selectedId} onSelect={onSelect} />
      ))}
    </div>
  )
}

/* ── Main panel ── */
export default function BlocksPanel() {
  const [tab, setTab] = useState<'blocks' | 'layers'>('blocks')
  const [search, setSearch] = useState('')
  const rootId = useEditorStore((s) => s.rootId)
  const nodesById = useEditorStore((s) => s.nodesById)
  const selectedNodeId = useEditorStore((s) => s.selectedNodeId)
  const addNode = useEditorStore((s) => s.addNode)
  const selectNode = useEditorStore((s) => s.selectNode)
  const enabledBlocks = useEditorStore((s) => s.builderConfig.blocks.enabled)
  const constraints = useEditorStore((s) => s.builderConfig.constraints)

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

  const addBlock = (type: NodeType) => {
    addNode(parentId ?? rootId, buildNode(type))
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
        if (search) return meta.label.toLowerCase().includes(search.toLowerCase())
        return true
      }),
    })), [enabledBlocks, search])

  const parentLabel = parentNode
    ? `${parentNode.type}${containerTypes.includes(parentNode.type) ? ' (container)' : ''}`
    : 'Canvas'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Tab bar */}
      <div style={{ padding: '10px 12px 0', display: 'flex', gap: 2, borderBottom: '1px solid var(--border)' }}>
        {(['blocks', 'layers'] as const).map((t) => (
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
            {t === 'blocks' ? 'Components' : 'Layers'}
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
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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

        {tab === 'layers' && (
          <div style={{ display: 'grid', gap: 1 }}>
            <PanelTitle>Document Tree</PanelTitle>
            <Separator />
            <LayerItem id={rootId} depth={0} nodesById={nodesById as Record<string, { type: string; children: string[] }>} selectedId={selectedNodeId} onSelect={selectNode} />
          </div>
        )}
      </div>
    </div>
  )
}
