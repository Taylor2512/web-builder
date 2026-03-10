import { sanitizeUrl, type FormField } from '../../types/schema'
import type { NodeRenderer } from './types'

const validateField = (field: FormField, raw: FormDataEntryValue | null): string | null => {
  const value = typeof raw === 'string' ? raw : ''
  if (field.required && !value) return `${field.label} is required`
  return null
}

export const buttonRenderer: NodeRenderer = ({ node }) => {
  const props = node.props as any
  return {
    content: (
      <a href={sanitizeUrl(props.href)} target={props.target} rel='noreferrer' style={{ display: 'inline-block', padding: '10px 22px', borderRadius: 8, background: '#6366f1', color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
        {props.label || 'Button'}
      </a>
    ),
  }
}

export const imageRenderer: NodeRenderer = ({ node }) => {
  const props = node.props as any
  return {
    content: props.src ? <img src={sanitizeUrl(props.src)} alt={props.alt} style={{ width: '100%', display: 'block', objectFit: props.fit, borderRadius: 4 }} /> : <div style={{ minHeight: 120, border: '2px dashed #d1d5db', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', color: '#9ca3af', fontSize: 13 }}>Drop an image URL in the Inspector</div>,
  }
}

export const spacerRenderer: NodeRenderer = ({ node, mode }) => {
  const props = node.props as any
  return { content: <div style={{ height: props.size, position: 'relative' }}>{mode === 'edit' && <div style={{ position: 'absolute', inset: 0, borderTop: '1px dashed #d1d5db', borderBottom: '1px dashed #d1d5db' }} />}</div> }
}

export const dividerRenderer: NodeRenderer = ({ node }) => {
  const props = node.props as any
  return { content: <hr style={{ border: 'none', borderTop: `${props.thickness}px solid #e2e8f0`, margin: '4px 0' }} /> }
}

export const formRenderer: NodeRenderer = ({ node, mode, submitForm }) => {
  const props = node.props as any
  if (mode === 'preview') {
    return {
      content: (
        <form style={{ display: 'grid', gap: 12, gridTemplateColumns: props.layout === 'grid' ? '1fr 1fr' : '1fr' }} onSubmit={(event) => {
          event.preventDefault()
          const formData = new FormData(event.currentTarget)
          for (const field of props.fields as FormField[]) {
            const validation = validateField(field, formData.get(field.name))
            if (validation) return window.alert(validation)
          }
          const payload = Object.fromEntries(formData.entries())
          submitForm(node.id, payload)
        }}>
          {props.fields.map((field: any) => <label key={field.id}>{field.label}<input name={field.name} /></label>)}
          <button type='submit'>{props.submitText}</button>
        </form>
      ),
    }
  }
  return { content: <div style={{ border: '1px dashed #e2e8f0', borderRadius: 8, padding: '12px 14px' }}>Form ({props.fields.length} fields)</div> }
}

export const emptyRenderer: NodeRenderer = () => ({ content: null })
