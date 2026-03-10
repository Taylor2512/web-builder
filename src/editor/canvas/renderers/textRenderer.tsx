import type { NodeRenderer } from './types'

export const textRenderer: NodeRenderer = ({ node, mode, updateProps }) => {
  const props = node.props as any
  const Tag = props.tag as keyof React.JSX.IntrinsicElements
  return {
    content: (
      <Tag onDoubleClick={() => {
        if (mode !== 'edit') return
        const next = window.prompt('Edit text', props.text)
        if (typeof next === 'string') updateProps(node.id, { text: next })
      }} style={{ textAlign: props.align, margin: 0, cursor: mode === 'edit' ? 'text' : 'inherit' }}>
        {props.text || <span style={{ color: '#aaa', fontStyle: 'italic' }}>Empty text…</span>}
      </Tag>
    ),
  }
}
