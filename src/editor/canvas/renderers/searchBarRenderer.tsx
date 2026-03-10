import type { NodeRenderer } from './types'
import { ErrorFallback } from './ErrorFallback'
import type { Node as BuilderNode } from '../../types/schema'

export const searchBarRenderer: NodeRenderer = ({ node, mode }) => {
  const props = (node as Extract<BuilderNode, { type: 'searchBar' }>).props
  const issues: string[] = []
  if (!props.targetQueryKey.trim()) issues.push('targetQueryKey is required')
  if (!props.mode) issues.push('mode is required')

  if (issues.length) return { content: <ErrorFallback title='Invalid searchBar props' issues={issues} /> }

  return {
    content: (
      <form
        onSubmit={(event) => {
          event.preventDefault()
          if (mode !== 'preview') return
          if (props.mode === 'navigate') {
            window.alert(`Navigate with query param: ${props.targetQueryKey}`)
          }
        }}
        style={{ display: 'flex', gap: 8 }}
      >
        <input
          placeholder={props.placeholder}
          style={{ flex: 1, border: '1px solid #d1d5db', borderRadius: 6, padding: '8px 10px' }}
        />
        <button type='submit' style={{ border: 'none', borderRadius: 6, background: '#0f172a', color: '#fff', padding: '8px 12px' }}>
          {props.buttonText}
        </button>
        <span style={{ fontSize: 11, color: '#64748b', alignSelf: 'center' }}>{props.mode}</span>
      </form>
    ),
  }
}
