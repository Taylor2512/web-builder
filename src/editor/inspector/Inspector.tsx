import { useState } from 'react'
import { useEditorStore } from '../state/useEditorStore'
import { createId, type FormField, type FormFieldType } from '../types/schema'
import { Card, Field, GhostButton, PanelTitle, TextArea, TextInput } from '../../shared/ui'

const fieldTypes: FormFieldType[] = ['text', 'textarea', 'email', 'number', 'password', 'tel', 'url', 'date', 'time', 'datetime-local', 'select', 'radio', 'checkbox', 'switch', 'range', 'file', 'color']

export default function Inspector() {
  const nodeId = useEditorStore((s) => s.selectedNodeId)
  const node = useEditorStore((s) => (nodeId ? s.nodesById[nodeId] : null))
  const updateProps = useEditorStore((s) => s.updateProps)
  const updateStyle = useEditorStore((s) => s.updateStyle)
  const removeNode = useEditorStore((s) => s.removeNode)
  const breakpoint = useEditorStore((s) => s.activeBreakpoint)
  const [tab, setTab] = useState<'props' | 'style' | 'layout' | 'responsive'>('props')

  if (!node) return <div style={{ padding: 12 }}><PanelTitle>Inspector</PanelTitle><Card>Select a block.</Card></div>

  const style = node.styleByBreakpoint[breakpoint]

  const addField = () => {
    if (node.type !== 'form') return
    const next: FormField[] = [...node.props.fields, { id: createId(), type: 'text', label: 'Field', name: `field_${node.props.fields.length + 1}` }]
    updateProps(node.id, { fields: next })
  }

  return (
    <div style={{ padding: 12, display: 'grid', gap: 10 }}>
      <PanelTitle>Inspector</PanelTitle>
      <Card>
        <div style={{ fontSize: 12, color: 'var(--muted)' }}>{node.type} · {node.id}</div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
        {(['props', 'style', 'layout', 'responsive'] as const).map((name) => (
          <GhostButton key={name} onClick={() => setTab(name)} style={{ background: tab === name ? 'var(--surface-2)' : undefined }}>{name}</GhostButton>
        ))}
      </div>

      {tab === 'props' && (
        <Card>
          <div style={{ display: 'grid', gap: 8 }}>
            {node.type === 'text' && (
              <>
                <Field label='Text'><TextArea value={node.props.text} onChange={(e) => updateProps(node.id, { text: e.target.value })} /></Field>
                <Field label='Tag'><TextInput value={node.props.tag} onChange={(e) => updateProps(node.id, { tag: e.target.value })} /></Field>
              </>
            )}
            {node.type === 'button' && (
              <>
                <Field label='Label'><TextInput value={node.props.label} onChange={(e) => updateProps(node.id, { label: e.target.value })} /></Field>
                <Field label='Href'><TextInput value={node.props.href} onChange={(e) => updateProps(node.id, { href: e.target.value })} /></Field>
              </>
            )}
            {node.type === 'image' && (
              <>
                <Field label='Src'><TextInput value={node.props.src} onChange={(e) => updateProps(node.id, { src: e.target.value })} /></Field>
                <Field label='Alt'><TextInput value={node.props.alt} onChange={(e) => updateProps(node.id, { alt: e.target.value })} /></Field>
              </>
            )}
            {node.type === 'form' && (
              <>
                <Field label='Submit text'><TextInput value={node.props.submitText} onChange={(e) => updateProps(node.id, { submitText: e.target.value })} /></Field>
                <GhostButton onClick={addField}>+ Add field</GhostButton>
                {node.props.fields.map((field, index) => (
                  <Card key={field.id}>
                    <div style={{ display: 'grid', gap: 6 }}>
                      <TextInput value={field.label} placeholder='Label' onChange={(e) => {
                        const next = node.props.fields.slice(); next[index] = { ...field, label: e.target.value }; updateProps(node.id, { fields: next })
                      }} />
                      <TextInput value={field.name} placeholder='Name' onChange={(e) => {
                        const next = node.props.fields.slice(); next[index] = { ...field, name: e.target.value }; updateProps(node.id, { fields: next })
                      }} />
                      <select value={field.type} onChange={(e) => {
                        const next = node.props.fields.slice(); next[index] = { ...field, type: e.target.value as FormFieldType }; updateProps(node.id, { fields: next })
                      }}>
                        {fieldTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                      </select>
                      <label><input type='checkbox' checked={!!field.required} onChange={(e) => {
                        const next = node.props.fields.slice(); next[index] = { ...field, required: e.target.checked }; updateProps(node.id, { fields: next })
                      }} /> Required</label>
                      {(field.type === 'select' || field.type === 'radio') && (
                        <TextInput placeholder='option1:Option 1,option2:Option 2' value={(field.options ?? []).map((x) => `${x.value}:${x.label}`).join(',')} onChange={(e) => {
                          const options = e.target.value.split(',').filter(Boolean).map((pair) => {
                            const [value, label] = pair.split(':')
                            return { id: createId(), value: value?.trim() ?? '', label: label?.trim() ?? value?.trim() ?? '' }
                          })
                          const next = node.props.fields.slice(); next[index] = { ...field, options }; updateProps(node.id, { fields: next })
                        }} />
                      )}
                      <div style={{ display: 'flex', gap: 6 }}>
                        <GhostButton onClick={() => {
                          if (index === 0) return
                          const next = node.props.fields.slice(); [next[index - 1], next[index]] = [next[index], next[index - 1]]; updateProps(node.id, { fields: next })
                        }}>↑</GhostButton>
                        <GhostButton onClick={() => {
                          if (index === node.props.fields.length - 1) return
                          const next = node.props.fields.slice(); [next[index + 1], next[index]] = [next[index], next[index + 1]]; updateProps(node.id, { fields: next })
                        }}>↓</GhostButton>
                        <GhostButton onClick={() => {
                          updateProps(node.id, { fields: node.props.fields.filter((x) => x.id !== field.id) })
                        }}>Delete</GhostButton>
                      </div>
                    </div>
                  </Card>
                ))}
              </>
            )}
          </div>
        </Card>
      )}

      {tab === 'style' && (
        <Card>
          <Field label='Color'><TextInput value={String(style.color ?? '')} onChange={(e) => updateStyle(node.id, { color: e.target.value })} /></Field>
          <Field label='Background'><TextInput value={String(style.background ?? '')} onChange={(e) => updateStyle(node.id, { background: e.target.value })} /></Field>
          <Field label='Border Radius'><TextInput type='number' value={String(style.borderRadius ?? 0)} onChange={(e) => updateStyle(node.id, { borderRadius: Number(e.target.value) })} /></Field>
          <Field label='Box Shadow'><TextInput value={String(style.boxShadow ?? '')} onChange={(e) => updateStyle(node.id, { boxShadow: e.target.value })} /></Field>
        </Card>
      )}

      {tab === 'layout' && (
        <Card>
          <Field label='Display'><TextInput value={String(style.display ?? '')} onChange={(e) => updateStyle(node.id, { display: e.target.value })} /></Field>
          <Field label='Gap'><TextInput type='number' value={String(style.gap ?? 0)} onChange={(e) => updateStyle(node.id, { gap: Number(e.target.value) })} /></Field>
          <Field label='Padding'><TextInput type='number' value={String(style.padding ?? 0)} onChange={(e) => updateStyle(node.id, { padding: Number(e.target.value) })} /></Field>
          <Field label='Width'><TextInput value={String(style.width ?? '')} onChange={(e) => updateStyle(node.id, { width: e.target.value })} /></Field>
        </Card>
      )}

      {tab === 'responsive' && <Card>Switch breakpoint from topbar to override current style.</Card>}

      <GhostButton onClick={() => removeNode(node.id)} disabled={node.type === 'page'}>Delete block</GhostButton>
    </div>
  )
}
