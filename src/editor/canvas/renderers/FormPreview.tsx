import { useState } from 'react'
import { useEditorStore } from '../../state/useEditorStore'
import type { FormField, Node } from '../../types/schema'
import { validateFormFields } from '../../forms/validators'

const controlStyle = {
  padding: '8px 12px',
  borderRadius: 8,
  border: '1.5px solid #d1d5db',
  outline: 'none',
  fontSize: 13,
  color: '#111827',
  background: '#f9fafb',
} as const

const renderFieldControl = (field: FormField) => {
  if (field.type === 'textarea') {
    return <textarea name={field.name} required={field.required} placeholder={field.placeholder} defaultValue={field.defaultValue} style={controlStyle} />
  }

  if (field.type === 'select') {
    return (
      <select name={field.name} required={field.required} defaultValue={field.defaultValue ?? ''} style={controlStyle}>
        <option value=''>Select an option</option>
        {(field.options ?? []).map((option) => (
          <option key={option.id} value={option.value}>{option.label}</option>
        ))}
      </select>
    )
  }

  if (field.type === 'radio') {
    return (
      <div style={{ display: 'grid', gap: 6 }}>
        {(field.options ?? []).map((option) => (
          <label key={option.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type='radio' name={field.name} value={option.value} required={field.required} defaultChecked={field.defaultValue === option.value} />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    )
  }

  if (field.type === 'checkbox' || field.type === 'switch') {
    return (
      <input
        type='checkbox'
        name={field.name}
        required={field.required}
        defaultChecked={field.defaultValue === 'true'}
        style={{ width: 16, height: 16 }}
      />
    )
  }

  return (
    <input
      type={field.type}
      name={field.name}
      required={field.required}
      placeholder={field.placeholder}
      defaultValue={field.defaultValue}
      min={field.min}
      max={field.max}
      minLength={field.minLength}
      maxLength={field.maxLength}
      pattern={field.pattern}
      style={controlStyle}
    />
  )
}

export const FormPreview = ({ node }: { node: Extract<Node, { type: 'form' }> }) => {
  const submitForm = useEditorStore((s) => s.submitForm)
  const [output, setOutput] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  return (
    <form
      style={{
        display: 'grid',
        gap: 12,
        gridTemplateColumns: node.props.layout === 'grid' ? '1fr 1fr' : '1fr',
      }}
      onSubmit={(event) => {
        event.preventDefault()
        const formData = new FormData(event.currentTarget)
        const { payload, errors, isValid } = validateFormFields(node.props.fields, formData)
        setFieldErrors(errors)
        if (!isValid) {
          return
        }

        setOutput(JSON.stringify(payload, null, 2))
        submitForm(node.id, payload)
      }}
    >
      {node.props.fields.map((field) => (
        <label key={field.id} style={{ display: 'grid', gap: 5, fontSize: 13 }}>
          <span style={{ fontWeight: 600, color: '#374151' }}>
            {field.label}
            {field.required && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
          </span>
          {renderFieldControl(field)}
          {fieldErrors[field.name] && <span style={{ color: '#ef4444', fontSize: 12 }}>{fieldErrors[field.name]}</span>}
        </label>
      ))}
      <button
        type='submit'
        style={{
          padding: '10px 20px',
          borderRadius: 8,
          border: 'none',
          background: '#6366f1',
          color: '#fff',
          fontWeight: 700,
          fontSize: 13,
          cursor: 'pointer',
        }}
      >
        {node.props.submitText}
      </button>
      {output && (
        <pre
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            color: '#1e293b',
            padding: 10,
            borderRadius: 8,
            fontSize: 11,
            overflow: 'auto',
          }}
        >
          {output}
        </pre>
      )}
    </form>
  )
}
