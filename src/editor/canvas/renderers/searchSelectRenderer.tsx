import type { NodeRenderer, RendererOutput } from './types'
import { ErrorFallback } from './ErrorFallback'
import type { Node as BuilderNode, SearchSelectOption } from '../../types/schema'

const staticPreview = (placeholder: string, options: { id: string; label: string; value: string }[]) => (
  <select style={{ border: '1px solid #d1d5db', borderRadius: 6, padding: '8px 10px' }}>
    <option>{placeholder || 'Select an option'}</option>
    {options.map((option) => (
      <option key={option.id} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
)

export const searchSelectRenderer: NodeRenderer = ({ node, mode }) => {
  const props = (node as Extract<BuilderNode, { type: 'searchSelect' }>).props
  const issues: string[] = []
  if (!props.name.trim()) issues.push('name is required')

  if (props.source === 'static' && props.options.length === 0) {
    issues.push('static source requires at least one option')
  }

  if (props.source === 'dataSource') {
    if (!props.dataSourceId?.trim()) issues.push('dataSourceId is required for data-driven mode')
    if (!props.dataPath?.trim()) issues.push('dataPath is required for data-driven mode')
    if (!props.labelPath?.trim()) issues.push('labelPath is required for data-driven mode')
    if (!props.valuePath?.trim()) issues.push('valuePath is required for data-driven mode')
  }

  if (issues.length) return { content: <ErrorFallback title='Invalid searchSelect props' issues={issues} /> }

  let preview: RendererOutput['content']
  if (props.source === 'static') {
    preview = staticPreview(props.placeholder, props.options as SearchSelectOption[])
  } else {
    preview = (
      <div style={{ border: '1px dashed #cbd5e1', borderRadius: 6, padding: 10, background: '#f8fafc', fontSize: 12 }}>
        <strong>Data-driven select</strong>
        <div>source: {props.dataSourceId}</div>
        <div>path: {props.dataPath}</div>
        {mode === 'preview' && <div style={{ marginTop: 6, color: '#475569' }}>Preview uses runtime data binding.</div>}
      </div>
    )
  }

  return {
    content: (
      <label style={{ display: 'grid', gap: 6 }}>
        <span style={{ fontWeight: 600, fontSize: 12 }}>{props.label}</span>
        {preview}
      </label>
    ),
  }
}
