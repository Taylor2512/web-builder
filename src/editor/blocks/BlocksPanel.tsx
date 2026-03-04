import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { useState } from 'react'
import { useEditorStore } from '../state/useEditorStore'
import { containerTypes, type NodeType } from '../types/schema'
import { Card, GhostButton, PanelTitle } from '../../shared/ui'

const BLOCKS: { type: NodeType; label: string }[] = [
  { type: 'section', label: 'Section' },
  { type: 'container', label: 'Container' },
  { type: 'grid', label: 'Grid' },
  { type: 'spacer', label: 'Spacer' },
  { type: 'divider', label: 'Divider' },
  { type: 'text', label: 'Text' },
  { type: 'image', label: 'Image' },
  { type: 'button', label: 'Button' },
  { type: 'form', label: 'Form' },
]

function DraggableBlock({ type, label }: { type: NodeType; label: string }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette-${type}`,
    data: { blockType: type, source: 'palette' },
  })

  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        width: '100%',
        textAlign: 'left',
        padding: '10px 12px',
        borderRadius: 12,
        border: '1px solid var(--border)',
        background: 'transparent',
        color: 'var(--text)',
        cursor: 'grab',
        opacity: isDragging ? 0.5 : 1,
        transform: CSS.Translate.toString(transform),
      }}
    >
      + {label}
    </button>
  )
}

export default function BlocksPanel() {
  const [tab, setTab] = useState<'blocks' | 'layers'>('blocks')
  const rootId = useEditorStore((s) => s.rootId)
  const nodesById = useEditorStore((s) => s.nodesById)
  const selectNode = useEditorStore((s) => s.selectNode)

  const renderLayer = (id: string, depth = 0) => {
    const node = nodesById[id]
    if (!node) return null
    return (
      <div key={id} style={{ marginLeft: depth * 12 }}>
        <GhostButton onClick={() => selectNode(id)} style={{ width: '100%', textAlign: 'left' }}>
          {node.type} {containerTypes.includes(node.type) ? '▾' : ''}
        </GhostButton>
        {node.children.map((childId) => renderLayer(childId, depth + 1))}
      </div>
    )
  }

  return (
    <div style={{ padding: 12, display: 'grid', gap: 10 }}>
      <PanelTitle>Library</PanelTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        <GhostButton onClick={() => setTab('blocks')} style={{ background: tab === 'blocks' ? 'var(--surface-2)' : undefined }}>Blocks</GhostButton>
        <GhostButton onClick={() => setTab('layers')} style={{ background: tab === 'layers' ? 'var(--surface-2)' : undefined }}>Layers</GhostButton>
      </div>

      <Card>
        {tab === 'blocks' ? (
          <div style={{ display: 'grid', gap: 8 }}>{BLOCKS.map((block) => <DraggableBlock key={block.type} {...block} />)}</div>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>{renderLayer(rootId)}</div>
        )}
      </Card>
    </div>
  )
}
