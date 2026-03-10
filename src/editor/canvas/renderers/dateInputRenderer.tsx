import type { NodeRenderer } from './types'
import { ErrorFallback } from './ErrorFallback'

const modeMap: Record<string, string> = {
  date: 'date',
  datetime: 'datetime-local',
  'datetime-local': 'datetime-local',
  time: 'time',
  month: 'month',
}

export const dateInputRenderer: NodeRenderer = ({ node, mode }) => {
  const props = node.props as any
  const issues: string[] = []
  const inputType = modeMap[props.mode]
  if (!props.name.trim()) issues.push('name is required')
  if (!inputType) issues.push('mode must be date, datetime-local, time, or month')

  if (issues.length) return { content: <ErrorFallback title='Invalid dateInput props' issues={issues} /> }

  return {
    content: (
      <label style={{ display: 'grid', gap: 6 }}>
        <span style={{ fontWeight: 600, fontSize: 12 }}>{props.label || 'Date input'}</span>
        <input
          type={inputType}
          name={props.name}
          required={props.required}
          min={props.min}
          max={props.max}
          defaultValue={props.defaultValue}
          placeholder={props.placeholder}
          disabled={mode === 'edit'}
          style={{ border: '1px solid #d1d5db', borderRadius: 6, padding: '8px 10px', background: mode === 'edit' ? '#f9fafb' : '#fff' }}
        />
        {props.helpText && <small style={{ color: '#6b7280' }}>{props.helpText}</small>}
      </label>
    ),
  }
}
