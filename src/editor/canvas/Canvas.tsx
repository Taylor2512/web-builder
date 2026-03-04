import React, { useEffect } from 'react'
import useEditorStore from '../state/useEditorStore'
import { Node } from '../types/schema'
import { themes } from '../utils/themes'

const NodeView: React.FC<{ node: Node }> = ({ node }) => {
  const selectNode = useEditorStore((s) => s.selectNode)
  const selectedId = useEditorStore((s) => s.selectedId)
  const currentThemeId = useEditorStore((s) => s.currentThemeId)

  useEffect(() => {
    // ensure theme vars applied on mount
    const t = themes.find((x) => x.id === currentThemeId)
    if (t) import('../utils/themes').then((m) => m.applyThemeVars(t))
  }, [currentThemeId])

  // merge theme defaults with node s (compact style)
  const theme = themes.find((t) => t.id === useEditorStore.getState().currentThemeId) ?? themes[0]
  const themeDefaults = (theme.defaults?.[node.type] ?? {}) as React.CSSProperties
  const style: React.CSSProperties = { ...themeDefaults, ...((node.s as React.CSSProperties) ?? {}) }

  return (
    <div onClick={(e) => { e.stopPropagation(); selectNode(node.id) }} style={{ ...style, outline: node.id === selectedId ? '2px solid #646cff' : undefined }}>
      {node.type === 'text' && <p style={{ margin: 0 }}>{node.p?.t ?? 'Text'}</p>}
      {node.type === 'button' && <button style={{ cursor: 'pointer' }}>{node.p?.label ?? 'Button'}</button>}
      {node.type === 'section' && <div style={{ fontSize: 12, color: 'var(--muted)' }}>Section {node.id}</div>}
      {node.c?.map((cid) => (
        <ChildRenderer key={cid} id={cid} />
      ))}
    </div>
  )
}

const ChildRenderer: React.FC<{ id: string }> = ({ id }) => {
  const node = useEditorStore((s) => s.nodesById[id])
  if (!node) return null
  return <NodeView node={node} />
}

export const Canvas: React.FC = () => {
  const rootId = useEditorStore((s) => s.rootId)
  const nodesById = useEditorStore((s) => s.nodesById)

  const root = nodesById[rootId]
  if (!root) return <div>Root missing</div>

  return (
    <div style={{ padding: 12, minHeight: 400, background: 'linear-gradient(180deg,#111 0%, #0b0b0b 100%)' }}>
      <ChildRenderer id={root.id} />
    </div>
  )
}

export default Canvas
