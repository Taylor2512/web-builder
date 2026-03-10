import type { NodeRenderer } from './types'
import { ErrorFallback } from './ErrorFallback'
import type { Node as BuilderNode } from '../../types/schema'

const sampleCollection = [{ id: '1' }, { id: '2' }, { id: '3' }]

export const repeaterRenderer: NodeRenderer = ({ node, mode, renderChildren }) => {
  const props = (node as Extract<BuilderNode, { type: 'repeater' }>).props
  const issues: string[] = []
  if (!props.dataPath.trim()) issues.push('dataPath is required')
  if (!props.itemContextName.trim()) issues.push('itemContextName is required')

  if (issues.length) return { content: <ErrorFallback title='Invalid repeater props' issues={issues} /> }

  if (mode === 'edit') {
    return {
      content: (
        <div style={{ marginBottom: 8, padding: '6px 8px', borderRadius: 6, background: '#eef2ff', color: '#3730a3', fontSize: 12 }}>
          Repeater: {props.itemContextName} in {props.dataPath}
        </div>
      ),
    }
  }

  return {
    handlesChildren: true,
    content: (
      <div style={{ display: 'grid', gap: 8 }}>
        {sampleCollection.map((item, index) => (
          <div key={item.id} style={{ border: '1px dashed #cbd5e1', borderRadius: 6, padding: 8 }}>
            <div style={{ fontSize: 11, color: '#475569', marginBottom: 6 }}>
              {props.itemContextName}[{index}]
            </div>
            {renderChildren(`rep-${index}-`)}
          </div>
        ))}
      </div>
    ),
  }
}
