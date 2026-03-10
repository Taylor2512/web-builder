import { useState } from 'react'
import { useEditorStore } from '../state/useEditorStore'
import { createId, type FormField, type FormFieldType } from '../types/schema'
import {
  Card, ColorInput, DangerButton, Field, GhostButton,
  IconButton, PanelTitle, Separator, Slider, StyledSelect, TextArea, TextInput, Toggle,
} from '../../shared/ui'

const fieldTypes: FormFieldType[] = ['text', 'textarea', 'email', 'number', 'password', 'tel', 'url', 'date', 'time', 'datetime-local', 'select', 'radio', 'checkbox', 'switch', 'range', 'file', 'color']

const TYPE_ACCENT: Record<string, string> = {
  page: '#6366f1', section: '#8b5cf6', container: '#06b6d4',
  grid: '#10b981', text: '#f59e0b', image: '#ec4899',
  button: '#3b82f6', form: '#f97316', spacer: '#94a3b8', divider: '#94a3b8',
}

export default function Inspector() {
  const nodeId = useEditorStore((s) => s.selectedNodeId)
  const node = useEditorStore((s) => (nodeId ? s.nodesById[nodeId] : null))
  const updateNodePropsByType = useEditorStore((s) => s.updateNodePropsByType)
  const updateNodeStyleByBreakpoint = useEditorStore((s) => s.updateNodeStyleByBreakpoint)
  const removeNode = useEditorStore((s) => s.removeNode)
  const duplicateNode = useEditorStore((s) => s.duplicateNode)
  const breakpoint = useEditorStore((s) => s.activeBreakpoint)
  const [tab, setTab] = useState<'props' | 'style' | 'layout' | 'responsive'>('props')

  if (!node) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
          <PanelTitle>Inspector</PanelTitle>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--muted)', padding: 24 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: 'var(--surface)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, opacity: 0.5,
          }}>◫</div>
          <div style={{ fontSize: 12, textAlign: 'center', lineHeight: 1.6, maxWidth: 180 }}>
            Selecciona un bloque en el lienzo para inspeccionar y editar sus propiedades
          </div>
          <div style={{ fontSize: 10, color: 'var(--muted)', opacity: 0.6 }}>Click or drag to select</div>
        </div>
      </div>
    )
  }

  const style = node.styleByBreakpoint[breakpoint]
  const accent = TYPE_ACCENT[node.type] ?? '#6366f1'

  const addField = () => {
    if (node.type !== 'form') return
    const next: FormField[] = [...node.props.fields, { id: createId(), type: 'text', label: 'New Field', name: `field_${node.props.fields.length + 1}` }]
    updateNodePropsByType(node.id, { fields: next })
  }

  const TAB_LABELS: Record<string, string> = { props: 'Contenido', style: 'Estilo', layout: 'Diseño', responsive: 'Adaptable' }
  const TABS = ['props', 'style', 'layout', 'responsive'] as const

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Node identity header */}
      <div style={{ padding: '10px 14px 0', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          {/* Type icon */}
          <div style={{
            width: 26, height: 26, borderRadius: 7, flexShrink: 0,
            background: `${accent}22`, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: accent }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', textTransform: 'capitalize' }}>{node.type}</div>
            <div style={{ fontSize: 9, color: 'var(--muted)', fontFamily: 'monospace' }}>#{node.id.slice(-8)}</div>
          </div>
          {node.type !== 'page' && (
            <button
              type='button'
              onClick={() => duplicateNode(node.id)}
              title='Duplicar elemento'
              style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 6, color: 'var(--text-secondary)', cursor: 'pointer',
                padding: '4px 7px', fontSize: 11, lineHeight: 1,
              }}
            >⧉</button>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0 }}>
          {TABS.map((name) => (
            <button
              key={name}
              type='button'
              onClick={() => setTab(name)}
              style={{
                flex: 1, padding: '6px 2px', background: 'none', border: 'none',
                borderBottom: tab === name ? `2px solid ${accent}` : '2px solid transparent',
                color: tab === name ? accent : 'var(--text-secondary)',
                fontWeight: tab === name ? 700 : 500, fontSize: 10, cursor: 'pointer',
                letterSpacing: '0.03em', marginBottom: -1,
              }}
            >
              {TAB_LABELS[name]}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflow: 'auto', padding: 12, display: 'grid', gap: 10, alignContent: 'start' }}>

        {/* ── PROPS ── */}
        {tab === 'props' && (
          <div style={{ display: 'grid', gap: 12 }}>
            {node.type === 'text' && (
              <Card>
                <div style={{ display: 'grid', gap: 10 }}>
                  <Field label='Content'>
                    <TextArea value={node.props.text} onChange={(e) => updateNodePropsByType(node.id, { text: e.target.value })} />
                  </Field>
                  <Field label='HTML Tag'>
                    <StyledSelect value={node.props.tag} onChange={(e) => updateNodePropsByType(node.id, { tag: e.target.value as 'h1' | 'h2' | 'h3' | 'p' | 'span' })}>
                      {(['h1', 'h2', 'h3', 'p', 'span'] as const).map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </StyledSelect>
                  </Field>
                  <Field label='Align'>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 5 }}>
                      {(['left', 'center', 'right'] as const).map((a) => (
                        <GhostButton
                          key={a}
                          onClick={() => updateNodePropsByType(node.id, { align: a })}
                          style={{ background: node.props.align === a ? 'var(--primary-dim)' : undefined, fontSize: 13 }}
                          title={a}
                        >
                          {a === 'left' ? '⫷' : a === 'center' ? '≡' : '⫸'}
                        </GhostButton>
                      ))}
                    </div>
                  </Field>
                </div>
              </Card>
            )}

            {node.type === 'button' && (
              <Card>
                <div style={{ display: 'grid', gap: 10 }}>
                  <Field label='Label'>
                    <TextInput value={node.props.label} onChange={(e) => updateNodePropsByType(node.id, { label: e.target.value })} />
                  </Field>
                  <Field label='URL / Href'>
                    <TextInput value={node.props.href} onChange={(e) => updateNodePropsByType(node.id, { href: e.target.value })} placeholder='https://…' />
                  </Field>
                  <Field label='Open in'>
                    <StyledSelect value={node.props.target ?? '_self'} onChange={(e) => updateNodePropsByType(node.id, { target: e.target.value as '_self' | '_blank' })}>
                      <option value='_self'>Same tab</option>
                      <option value='_blank'>New tab</option>
                    </StyledSelect>
                  </Field>
                </div>
              </Card>
            )}

            {node.type === 'image' && (
              <Card>
                <div style={{ display: 'grid', gap: 10 }}>
                  <Field label='Image URL'>
                    <TextInput value={node.props.src} onChange={(e) => updateNodePropsByType(node.id, { src: e.target.value })} placeholder='https://…' />
                  </Field>
                  <Field label='Alt text'>
                    <TextInput value={node.props.alt} onChange={(e) => updateNodePropsByType(node.id, { alt: e.target.value })} placeholder='Describe the image' />
                  </Field>
                  <Field label='Object fit'>
                    <StyledSelect value={node.props.fit ?? 'cover'} onChange={(e) => updateNodePropsByType(node.id, { fit: e.target.value as 'cover' | 'contain' })}>
                      {(['contain', 'cover'] as const).map((f) => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </StyledSelect>
                  </Field>
                </div>
              </Card>
            )}

            {node.type === 'spacer' && (
              <Card>
                <Slider
                  label='Height'
                  value={typeof node.props.size === 'number' ? node.props.size : parseInt(String(node.props.size)) || 24}
                  min={4} max={320} step={4}
                  onChange={(v) => updateNodePropsByType(node.id, { size: v })}
                />
              </Card>
            )}

            {node.type === 'divider' && (
              <Card>
                <Slider
                  label='Thickness'
                  value={typeof node.props.thickness === 'number' ? node.props.thickness : 1}
                  min={1} max={16}
                  onChange={(v) => updateNodePropsByType(node.id, { thickness: v })}
                />
              </Card>
            )}

            {node.type === 'section' || node.type === 'container' || node.type === 'grid' ? (
              <Card>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Use the <strong>Layout</strong> tab to control padding, gap, direction, and dimensions of this {node.type}.
                </div>
              </Card>
            ) : null}

            {node.type === 'form' && (
              <div style={{ display: 'grid', gap: 8 }}>
                <Card>
                  <div style={{ display: 'grid', gap: 10 }}>
                    <Field label='Submit button text'>
                      <TextInput value={node.props.submitText} onChange={(e) => updateNodePropsByType(node.id, { submitText: e.target.value })} />
                    </Field>
                    <Field label='Layout'>
                      <StyledSelect value={node.props.layout ?? 'single'} onChange={(e) => updateNodePropsByType(node.id, { layout: e.target.value as 'stack' | 'grid' })}>
                        <option value='single'>Single column</option>
                        <option value='grid'>Two columns</option>
                      </StyledSelect>
                    </Field>
                  </div>
                </Card>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Fields ({node.props.fields.length})</span>
                  <GhostButton onClick={addField} style={{ fontSize: 11 }}>+ Add field</GhostButton>
                </div>

                {node.props.fields.map((field, index) => (
                  <Card key={field.id} style={{ borderLeft: '3px solid var(--primary-dim)' }}>
                    <div style={{ display: 'grid', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', flex: 1 }}>Field {index + 1}</span>
                        <div style={{ display: 'flex', gap: 3 }}>
                          <IconButton onClick={() => {
                            if (index === 0) return
                            const next = node.props.fields.slice()
                            ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
                            updateNodePropsByType(node.id, { fields: next })
                          }} disabled={index === 0} title='Move up'>↑</IconButton>
                          <IconButton onClick={() => {
                            if (index === node.props.fields.length - 1) return
                            const next = node.props.fields.slice()
                            ;[next[index + 1], next[index]] = [next[index], next[index + 1]]
                            updateNodePropsByType(node.id, { fields: next })
                          }} disabled={index === node.props.fields.length - 1} title='Move down'>↓</IconButton>
                          <IconButton onClick={() => updateNodePropsByType(node.id, { fields: node.props.fields.filter((x) => x.id !== field.id) })} title='Delete field' style={{ color: 'var(--danger)' }}>✕</IconButton>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                        <Field label='Label'>
                          <TextInput value={field.label} placeholder='Field label' onChange={(e) => {
                            const next = node.props.fields.slice(); next[index] = { ...field, label: e.target.value }; updateNodePropsByType(node.id, { fields: next })
                          }} />
                        </Field>
                        <Field label='Name'>
                          <TextInput value={field.name} placeholder='field_name' onChange={(e) => {
                            const next = node.props.fields.slice(); next[index] = { ...field, name: e.target.value }; updateNodePropsByType(node.id, { fields: next })
                          }} />
                        </Field>
                      </div>
                      <Field label='Type'>
                        <StyledSelect value={field.type} onChange={(e) => {
                          const next = node.props.fields.slice(); next[index] = { ...field, type: e.target.value as FormFieldType }; updateNodePropsByType(node.id, { fields: next })
                        }}>
                          {fieldTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                        </StyledSelect>
                      </Field>
                      <Field label='Placeholder'>
                        <TextInput value={field.placeholder ?? ''} placeholder='Placeholder text' onChange={(e) => {
                          const next = node.props.fields.slice(); next[index] = { ...field, placeholder: e.target.value }; updateNodePropsByType(node.id, { fields: next })
                        }} />
                      </Field>
                      <Toggle
                        checked={!!field.required}
                        label='Required field'
                        onChange={(v) => {
                          const next = node.props.fields.slice(); next[index] = { ...field, required: v }; updateNodePropsByType(node.id, { fields: next })
                        }}
                      />
                      {(field.type === 'select' || field.type === 'radio') && (
                        <Field label='Options' hint='value:Label, …'>
                          <TextInput
                            placeholder='opt1:Option 1,opt2:Option 2'
                            value={(field.options ?? []).map((x) => `${x.value}:${x.label}`).join(',')}
                            onChange={(e) => {
                              const options = e.target.value.split(',').filter(Boolean).map((pair) => {
                                const [value, label] = pair.split(':')
                                return { id: createId(), value: value?.trim() ?? '', label: label?.trim() ?? value?.trim() ?? '' }
                              })
                              const next = node.props.fields.slice(); next[index] = { ...field, options }; updateNodePropsByType(node.id, { fields: next })
                            }}
                          />
                        </Field>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── STYLE ── */}
        {tab === 'style' && (
          <div style={{ display: 'grid', gap: 12 }}>
            <Card>
              <div style={{ display: 'grid', gap: 12 }}>
                <Field label='Text color'>
                  <ColorInput value={String(style.color ?? '')} onChange={(v) => updateNodeStyleByBreakpoint(node.id, { color: v })} />
                </Field>
                <Separator />
                <Field label='Background'>
                  <ColorInput value={String(style.background ?? '')} onChange={(v) => updateNodeStyleByBreakpoint(node.id, { background: v })} />
                </Field>
              </div>
            </Card>
            <Card>
              <div style={{ display: 'grid', gap: 12 }}>
                <Slider label='Border radius' value={Number(style.borderRadius ?? 0)} min={0} max={80} onChange={(v) => updateNodeStyleByBreakpoint(node.id, { borderRadius: v })} />
                <Separator />
                <Field label='Border'>
                  <TextInput value={String(style.border ?? '')} onChange={(e) => updateNodeStyleByBreakpoint(node.id, { border: e.target.value })} placeholder='1px solid #ccc' />
                </Field>
                <Field label='Box shadow'>
                  <TextInput value={String(style.boxShadow ?? '')} onChange={(e) => updateNodeStyleByBreakpoint(node.id, { boxShadow: e.target.value })} placeholder='0 4px 12px rgba(0,0,0,0.1)' />
                </Field>
              </div>
            </Card>
            <Card>
              <div style={{ display: 'grid', gap: 12 }}>
                <Slider label='Opacity' value={Number(style.opacity ?? 1) * 100} min={0} max={100} unit='%' onChange={(v) => updateNodeStyleByBreakpoint(node.id, { opacity: v / 100 })} />
                <Field label='Font size'>
                  <TextInput value={String(style.fontSize ?? '')} onChange={(e) => updateNodeStyleByBreakpoint(node.id, { fontSize: e.target.value })} placeholder='16px' />
                </Field>
                <Field label='Font weight'>
                  <StyledSelect value={String(style.fontWeight ?? '')} onChange={(e) => updateNodeStyleByBreakpoint(node.id, { fontWeight: e.target.value })}>
                    <option value=''>Default</option>
                    {['300', '400', '500', '600', '700', '800', '900'].map((w) => <option key={w} value={w}>{w}</option>)}
                  </StyledSelect>
                </Field>
                <Field label='Line height'>
                  <TextInput value={String(style.lineHeight ?? '')} onChange={(e) => updateNodeStyleByBreakpoint(node.id, { lineHeight: e.target.value })} placeholder='1.5' />
                </Field>
              </div>
            </Card>
          </div>
        )}

        {/* ── LAYOUT ── */}
        {tab === 'layout' && (
          <div style={{ display: 'grid', gap: 12 }}>
            <Card>
              <div style={{ display: 'grid', gap: 12 }}>
                <Field label='Display'>
                  <StyledSelect value={String(style.display ?? '')} onChange={(e) => updateNodeStyleByBreakpoint(node.id, { display: e.target.value })}>
                    <option value=''>Default</option>
                    {['block', 'flex', 'grid', 'inline', 'inline-flex', 'inline-block', 'none'].map((d) => <option key={d} value={d}>{d}</option>)}
                  </StyledSelect>
                </Field>
                {(style.display === 'flex' || style.display === 'inline-flex') && (
                  <>
                    <Field label='Flex direction'>
                      <StyledSelect value={String(style.flexDirection ?? 'row')} onChange={(e) => updateNodeStyleByBreakpoint(node.id, { flexDirection: e.target.value })}>
                        {['row', 'column', 'row-reverse', 'column-reverse'].map((d) => <option key={d} value={d}>{d}</option>)}
                      </StyledSelect>
                    </Field>
                    <Field label='Justify content'>
                      <StyledSelect value={String(style.justifyContent ?? '')} onChange={(e) => updateNodeStyleByBreakpoint(node.id, { justifyContent: e.target.value })}>
                        <option value=''>Default</option>
                        {['flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'space-evenly'].map((d) => <option key={d} value={d}>{d}</option>)}
                      </StyledSelect>
                    </Field>
                    <Field label='Align items'>
                      <StyledSelect value={String(style.alignItems ?? '')} onChange={(e) => updateNodeStyleByBreakpoint(node.id, { alignItems: e.target.value })}>
                        <option value=''>Default</option>
                        {['flex-start', 'center', 'flex-end', 'stretch', 'baseline'].map((d) => <option key={d} value={d}>{d}</option>)}
                      </StyledSelect>
                    </Field>
                    <Field label='Flex wrap'>
                      <StyledSelect value={String(style.flexWrap ?? '')} onChange={(e) => updateNodeStyleByBreakpoint(node.id, { flexWrap: e.target.value })}>
                        <option value=''>Default</option>
                        {['nowrap', 'wrap', 'wrap-reverse'].map((d) => <option key={d} value={d}>{d}</option>)}
                      </StyledSelect>
                    </Field>
                  </>
                )}
              </div>
            </Card>
            <Card>
              <div style={{ display: 'grid', gap: 12 }}>
                <Slider label='Gap' value={Number(style.gap ?? 0)} min={0} max={80} onChange={(v) => updateNodeStyleByBreakpoint(node.id, { gap: v })} />
                <Separator />
                <Field label='Padding'>
                  <TextInput value={String(style.padding ?? '')} onChange={(e) => updateNodeStyleByBreakpoint(node.id, { padding: e.target.value })} placeholder='16px or 8px 16px' />
                </Field>
                <Field label='Margin'>
                  <TextInput value={String(style.margin ?? '')} onChange={(e) => updateNodeStyleByBreakpoint(node.id, { margin: e.target.value })} placeholder='0 auto' />
                </Field>
              </div>
            </Card>
            <Card>
              <div style={{ display: 'grid', gap: 12 }}>
                <Field label='Width'>
                  <TextInput value={String(style.width ?? '')} onChange={(e) => updateNodeStyleByBreakpoint(node.id, { width: e.target.value })} placeholder='100% / 400px' />
                </Field>
                <Field label='Max width'>
                  <TextInput value={String(style.maxWidth ?? '')} onChange={(e) => updateNodeStyleByBreakpoint(node.id, { maxWidth: e.target.value })} placeholder='1200px' />
                </Field>
                <Field label='Height'>
                  <TextInput value={String(style.height ?? '')} onChange={(e) => updateNodeStyleByBreakpoint(node.id, { height: e.target.value })} placeholder='auto / 400px' />
                </Field>
                <Field label='Min height'>
                  <TextInput value={String(style.minHeight ?? '')} onChange={(e) => updateNodeStyleByBreakpoint(node.id, { minHeight: e.target.value })} placeholder='120px' />
                </Field>
              </div>
            </Card>
          </div>
        )}

        {/* ── RESPONSIVE ── */}
        {tab === 'responsive' && (
          <div style={{ display: 'grid', gap: 10 }}>
            <Card>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Use the <strong>breakpoint buttons</strong> in the top toolbar to switch between Desktop, Tablet, and Mobile views. Style changes you make in each breakpoint are stored independently and cascade down (desktop → tablet → mobile).
              </div>
            </Card>
            <Card>
              <div style={{ display: 'grid', gap: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Breakpoint overrides</div>
                {(['desktop', 'tablet', 'mobile'] as const).map((bp) => {
                  const bpStyle = node.styleByBreakpoint[bp]
                  const hasOverrides = bpStyle && Object.keys(bpStyle).length > 0
                  return (
                    <div key={bp} style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px',
                      borderRadius: 'var(--radius-sm)',
                      background: bp === breakpoint ? 'var(--primary-dim)' : 'var(--surface)',
                      border: `1px solid ${bp === breakpoint ? 'var(--primary)' : 'var(--border)'}`,
                    }}>
                      <span style={{ fontSize: 12, flex: 1, fontWeight: bp === breakpoint ? 700 : 400, color: bp === breakpoint ? 'var(--primary)' : 'var(--text)' }}>{bp}</span>
                      {hasOverrides && <span style={{ fontSize: 10, color: 'var(--warning)' }}>{Object.keys(bpStyle).length} rule{Object.keys(bpStyle).length !== 1 ? 's' : ''}</span>}
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
        <DangerButton onClick={() => removeNode(node.id)} disabled={node.type === 'page'}>
          ✕ Eliminar {node.type}
        </DangerButton>
      </div>
    </div>
  )
}
