import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { SortableContext, rectSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useMemo, useState } from 'react'
import { buildNode, useEditorStore } from '../state/useEditorStore'
import { containerTypes, sanitizeUrl, type Breakpoint, type FormField, type Node, type NodeType } from '../types/schema'
import GridOverlay from './viewport/GridOverlay'
import { useViewport } from './viewport/useViewport'

type DragMeta = { id: string; blockType?: Node['type']; source: 'palette' | 'canvas' }

const bpOrder: Breakpoint[] = ['desktop', 'tablet', 'mobile']

const mergeStyle = (node: Node, activeBreakpoint: Breakpoint) => {
  const style: Record<string, string | number | undefined> = {}
  const maxIndex = bpOrder.indexOf(activeBreakpoint)
  for (let i = 0; i <= maxIndex; i += 1) Object.assign(style, node.styleByBreakpoint[bpOrder[i]])
  return style
}

const validateField = (field: FormField, raw: FormDataEntryValue | null): string | null => {
  const value = typeof raw === 'string' ? raw : ''
  if (field.required && !value) return `${field.label} is required`
  if (field.type === 'email' && value && !/^\S+@\S+\.\S+$/.test(value)) return `${field.label} must be an email`
  if (field.minLength && value.length < field.minLength) return `${field.label} min length ${field.minLength}`
  if (field.maxLength && value.length > field.maxLength) return `${field.label} max length ${field.maxLength}`
  if (field.pattern && value && !new RegExp(field.pattern).test(value)) return `${field.label} invalid format`
  return null
}

const FormPreview = ({ node }: { node: Extract<Node, { type: 'form' }> }) => {
  const submitForm = useEditorStore((s) => s.submitForm)
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')

  return (
    <form
      style={{ display: 'grid', gap: 10, gridTemplateColumns: node.props.layout === 'grid' ? '1fr 1fr' : '1fr' }}
      onSubmit={(event) => {
        event.preventDefault()
        setError('')
        const formData = new FormData(event.currentTarget)
        const payload: Record<string, unknown> = {}
        for (const field of node.props.fields) {
          const raw = formData.get(field.name)
          const validation = validateField(field, raw)
          if (validation) {
            setError(validation)
            return
          }
          payload[field.name] = field.type === 'checkbox' || field.type === 'switch' ? !!raw : raw
        }
        setOutput(JSON.stringify(payload, null, 2))
        submitForm(node.id, payload)
      }}
    >
      {node.props.fields.map((field) => (
        <label key={field.id} style={{ display: 'grid', gap: 4, fontSize: 13 }}>
          <span>{field.label}</span>
          <input type={field.type === 'switch' ? 'checkbox' : field.type} name={field.name} required={field.required} placeholder={field.placeholder} defaultValue={field.defaultValue} />
        </label>
      ))}
      <button type='submit'>{node.props.submitText}</button>
      {error && <small style={{ color: '#f97316' }}>{error}</small>}
      {output && <pre style={{ background: '#111', color: '#fff', padding: 8, borderRadius: 8 }}>{output}</pre>}
    </form>
  )
}

function RenderNode({ id }: { id: string }) {
  const node = useEditorStore((s) => s.nodesById[id])
  const selectedNodeId = useEditorStore((s) => s.selectedNodeId)
  const selectNode = useEditorStore((s) => s.selectNode)
  const mode = useEditorStore((s) => s.mode)
  const activeBreakpoint = useEditorStore((s) => s.activeBreakpoint)
  const { setNodeRef: setSortableRef, transform, transition, attributes, listeners } = useSortable({ id, data: { source: 'canvas' } })
  const canDropInside = node ? containerTypes.includes(node.type) : false
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({ id: `drop-${id}`, disabled: !canDropInside || mode === 'preview' })

  if (!node) return null
  const computedStyle = mergeStyle(node, activeBreakpoint)

  let content: React.ReactNode = null
  if (node.type === 'text') {
    const Tag = node.props.tag
    content = <Tag style={{ textAlign: node.props.align }}>{node.props.text}</Tag>
  }
  if (node.type === 'button') content = <a href={sanitizeUrl(node.props.href)} target={node.props.target} rel='noreferrer'>{node.props.label}</a>
  if (node.type === 'image') content = <img src={sanitizeUrl(node.props.src)} alt={node.props.alt} style={{ width: '100%', objectFit: node.props.fit }} />
  if (node.type === 'spacer') content = <div style={{ height: node.props.size }} />
  if (node.type === 'divider') content = <hr style={{ borderTop: `${node.props.thickness}px solid var(--border)` }} />
  if (node.type === 'form') content = mode === 'preview' ? <FormPreview node={node} /> : <div>Form block ({node.props.fields.length} fields)</div>

  return (
    <div ref={setSortableRef} style={{ transform: CSS.Transform.toString(transform), transition }}>
      <div
        ref={setDroppableRef}
        onClick={(event) => {
          event.stopPropagation()
          if (mode === 'edit') selectNode(id)
        }}
        {...(mode === 'edit' ? attributes : {})}
        {...(mode === 'edit' ? listeners : {})}
        style={{ ...computedStyle, padding: computedStyle.padding ?? 12, border: mode === 'edit' ? '1px dashed var(--border)' : undefined, outline: selectedNodeId === id && mode === 'edit' ? '2px solid #6366f1' : undefined, marginBottom: 8 }}
      >
        {containerTypes.includes(node.type) && <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>{node.type}</div>}
        {content}
        <SortableContext items={node.children} strategy={rectSortingStrategy}>
          {node.children.map((childId) => <RenderNode key={childId} id={childId} />)}
        </SortableContext>
        {isOver && mode === 'edit' && <div style={{ border: '1px solid #818cf8', borderRadius: 8, padding: 6, fontSize: 11 }}>Drop here</div>}
      </div>
    </div>
  )
}

export default function Canvas() {
  const rootId = useEditorStore((s) => s.rootId)
  const mode = useEditorStore((s) => s.mode)
  const nodesById = useEditorStore((s) => s.nodesById)
  const moveNode = useEditorStore((s) => s.moveNode)
  const addNode = useEditorStore((s) => s.addNode)
  const builderConfig = useEditorStore((s) => s.builderConfig)
  const [dragMeta, setDragMeta] = useState<DragMeta | null>(null)
  const { viewport, zoomIn, zoomOut, resetViewport } = useViewport()

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))
  const root = nodesById[rootId]

  const isAllowedParent = (childType: NodeType, parentType: NodeType) => {
    const allowed = builderConfig.constraints.allowedParents[childType]
    return !allowed || allowed.includes(parentType)
  }

  const hasChildCapacity = (parentId: string) => {
    const parent = nodesById[parentId]
    if (!parent) return false
    const max = builderConfig.constraints.maxChildren[parent.type]
    return typeof max !== 'number' || parent.children.length < max
  }

  const resolveDropParent = (overId: string | null) => {
    if (!overId) return rootId
    if (overId.startsWith('drop-')) return overId.replace('drop-', '')
    const overNode = nodesById[overId]
    if (!overNode) return rootId
    if (containerTypes.includes(overNode.type)) return overNode.id
    const parent = Object.values(nodesById).find((node) => node.children.includes(overNode.id))
    return parent?.id ?? rootId
  }

  const onDragStart = (event: DragStartEvent) => {
    setDragMeta({
      id: String(event.active.id),
      blockType: event.active.data.current?.blockType as Node['type'] | undefined,
      source: (event.active.data.current?.source as DragMeta['source']) ?? 'canvas',
    })
  }

  const onDragEnd = (event: DragEndEvent) => {
    const overId = event.over?.id ? String(event.over.id) : null
    if (!dragMeta) return
    const parentId = resolveDropParent(overId)
    const parentNode = nodesById[parentId]
    if (!parentNode) return

    if (dragMeta.source === 'palette' && dragMeta.blockType) {
      if (isAllowedParent(dragMeta.blockType, parentNode.type) && hasChildCapacity(parentId)) addNode(parentId, buildNode(dragMeta.blockType))
    }

    if (dragMeta.source === 'canvas') {
      const overNodeId = overId?.replace('drop-', '')
      if (!overNodeId) return
      const targetIndex = parentNode.children.findIndex((nodeId) => nodeId === overNodeId)
      moveNode(dragMeta.id, parentId, targetIndex >= 0 ? targetIndex : undefined)
    }

    setDragMeta(null)
  }

  const dragLabel = useMemo(() => {
    if (!dragMeta) return ''
    if (dragMeta.source === 'palette') return `New ${dragMeta.blockType}`
    return nodesById[dragMeta.id]?.type ?? 'Moving block'
  }, [dragMeta, nodesById])

  if (!root) return null

  const canvasFrame = (
    <div
      style={{
        maxWidth: 980,
        margin: '0 auto',
        minHeight: 620,
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: 16,
        background: '#fff',
        color: '#111',
        position: 'relative',
        transform: `translate(${viewport.panX}px, ${viewport.panY}px) scale(${viewport.zoom})`,
        transformOrigin: 'top center',
      }}
    >
      <GridOverlay size={builderConfig.grid.size} visible={builderConfig.grid.show && mode === 'edit'} zoom={viewport.zoom} />
      <RenderNode id={root.id} />
    </div>
  )

  if (mode === 'preview') return <div style={{ padding: 16, overflow: 'auto', height: '100%' }}>{canvasFrame}</div>

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div style={{ padding: 16, overflow: 'auto', height: '100%', background: 'linear-gradient(#0f172a, #0b1322)' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <button onClick={zoomOut}>-</button>
          <button onClick={zoomIn}>+</button>
          <button onClick={resetViewport}>Reset View</button>
          <span style={{ color: '#cbd5e1', fontSize: 12 }}>Zoom: {Math.round(viewport.zoom * 100)}%</span>
        </div>
        {canvasFrame}
      </div>
      <DragOverlay>{dragMeta ? <div style={{ padding: '8px 10px', background: '#111827', color: '#fff', borderRadius: 8 }}>{dragLabel}</div> : null}</DragOverlay>
    </DndContext>
  )
}
