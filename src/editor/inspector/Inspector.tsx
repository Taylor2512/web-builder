import { useEffect, useMemo, useState } from 'react'
import { useEditorStore } from '../state/useEditorStore'
import { createId, type FormField, type FormFieldType, type Node as BuilderNode, type NodeBinding } from '../types/schema'
import {
  Card, ColorInput, DangerButton, Field, GhostButton,
  IconButton, PanelTitle, Separator, Slider, StyledSelect, TextArea, TextInput,
} from '../../shared/ui'

const fieldTypes: FormFieldType[] = ['text', 'textarea', 'email', 'number', 'password', 'tel', 'url', 'date', 'time', 'datetime-local', 'select', 'radio', 'checkbox', 'switch', 'range', 'file', 'color']

const TYPE_ACCENT: Record<string, string> = {
  page: '#6366f1', section: '#8b5cf6', container: '#06b6d4',
  grid: '#10b981', text: '#f59e0b', image: '#ec4899',
  button: '#3b82f6', link: '#4f46e5', navbar: '#0f766e', form: '#f97316', spacer: '#94a3b8', divider: '#94a3b8',
}
import { validateNodePropsWithError } from './nodeSchemas'
import DateInputEditor from './editors/DateInputEditor'
import SearchSelectEditor from './editors/SearchSelectEditor'
import DataTableEditor from './editors/DataTableEditor'
import SearchBarEditor from './editors/SearchBarEditor'
import RepeaterEditor from './editors/RepeaterEditor'

const fieldTypes: FormFieldType[] = ['text', 'textarea', 'email', 'number', 'password', 'tel', 'url', 'date', 'time', 'datetime-local', 'select', 'radio', 'checkbox', 'switch', 'range', 'file', 'color']
const TYPE_ACCENT: Record<string, string> = { page: '#6366f1', section: '#8b5cf6', container: '#06b6d4', grid: '#10b981', text: '#f59e0b', image: '#ec4899', button: '#3b82f6', form: '#f97316', spacer: '#94a3b8', divider: '#94a3b8' }

export default function Inspector() {
  const nodeId = useEditorStore((s) => s.selectedNodeId)
  const node = useEditorStore((s) => (nodeId ? s.nodesById[nodeId] : null))
  const updateProps = useEditorStore((s) => s.updateProps)
  const replaceProps = useEditorStore((s) => s.replaceProps)
  const updateStyle = useEditorStore((s) => s.updateStyle)
  const setCustomCss = useEditorStore((s) => s.setCustomCss)
  const setBindings = useEditorStore((s) => s.setBindings)
  const removeNode = useEditorStore((s) => s.removeNode)
  const duplicateNode = useEditorStore((s) => s.duplicateNode)
  const breakpoint = useEditorStore((s) => s.activeBreakpoint)
  const [tab, setTab] = useState<'props' | 'style' | 'layout' | 'responsive' | 'code'>('props')

  const [jsonDraft, setJsonDraft] = useState('')
  const [jsonError, setJsonError] = useState<string | null>(null)
  const [bindingsDraft, setBindingsDraft] = useState('[]')

  useEffect(() => {
    if (!node) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setJsonDraft(JSON.stringify(node.props, null, 2))
    setJsonError(null)
    setBindingsDraft(JSON.stringify(node.bindings ?? [], null, 2))
  }, [node])

  const onApplyJson = () => {
    if (!node) return
    try {
      const parsed = JSON.parse(jsonDraft)
      const result = validateNodePropsWithError(node.type, parsed)
      if (!result.ok) {
        setJsonError(result.error)
        return
      }
      replaceProps(node.id, parsed)
      setJsonError(null)
    } catch {
      setJsonError('JSON inválido')
    }
  }

  const onApplyBindings = () => {
    if (!node) return
    try {
      const parsed = JSON.parse(bindingsDraft) as NodeBinding[]
      if (!Array.isArray(parsed) || parsed.some((item) => !item || typeof item.targetPath !== 'string' || typeof item.sourcePath !== 'string')) {
        setJsonError('Bindings inválidos: use [{"targetPath":"props.text","sourcePath":"flow.user.name"}]')
        return
      }
      setBindings(node.id, parsed.map((item) => ({ id: item.id ?? createId(), targetPath: item.targetPath, sourcePath: item.sourcePath })))
      setJsonError(null)
    } catch {
      setJsonError('Bindings JSON inválido')
    }
  }

  const TAB_LABELS: Record<string, string> = { props: 'Contenido', style: 'Estilo', layout: 'Diseño', responsive: 'Adaptable', code: 'Code' }
  const TABS = ['props', 'style', 'layout', 'responsive', 'code'] as const

  const typeEditor = useMemo(() => {
    if (!node) return null
    const typedNode = node as BuilderNode
    if (typedNode.type === 'dateInput') return <DateInputEditor node={typedNode} updateProps={updateProps} />
    if (typedNode.type === 'searchSelect') return <SearchSelectEditor node={typedNode} updateProps={updateProps} />
    if (typedNode.type === 'dataTable') return <DataTableEditor node={typedNode} updateProps={updateProps} />
    if (typedNode.type === 'searchBar') return <SearchBarEditor node={typedNode} updateProps={updateProps} />
    if (typedNode.type === 'repeater') return <RepeaterEditor node={typedNode} updateProps={updateProps} />
    return null
  }, [node, updateProps])

  if (!node) return <div style={{ padding: 14 }}><PanelTitle>Inspector</PanelTitle></div>

  const style = node.styleByBreakpoint[breakpoint]
  const accent = TYPE_ACCENT[node.type] ?? '#6366f1'
  const addField = () => {
    if (node.type !== 'form') return
    const next: FormField[] = [...node.props.fields, { id: createId(), type: 'text', label: 'New Field', name: `field_${node.props.fields.length + 1}` }]
    updateProps(node.id, { fields: next })
  }

  return <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
    <div style={{ padding: '10px 14px 0', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{ width: 26, height: 26, borderRadius: 7, flexShrink: 0, background: `${accent}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 10, height: 10, borderRadius: 3, background: accent }} /></div>
        <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', textTransform: 'capitalize' }}>{node.type}</div><div style={{ fontSize: 9, color: 'var(--muted)', fontFamily: 'monospace' }}>#{node.id.slice(-8)}</div></div>
        {node.type !== 'page' && <button type='button' onClick={() => duplicateNode(node.id)} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px 7px', fontSize: 11 }}>⧉</button>}
      </div>
      <div style={{ display: 'flex', gap: 0 }}>{TABS.map((name) => <button key={name} type='button' onClick={() => setTab(name)} style={{ flex: 1, padding: '6px 2px', background: 'none', border: 'none', borderBottom: tab === name ? `2px solid ${accent}` : '2px solid transparent', color: tab === name ? accent : 'var(--text-secondary)', fontWeight: tab === name ? 700 : 500, fontSize: 10, cursor: 'pointer', marginBottom: -1 }}>{TAB_LABELS[name]}</button>)}</div>
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
                    <TextArea value={node.props.text} onChange={(e) => updateProps(node.id, { text: e.target.value })} />
                  </Field>
                  <Field label='HTML Tag'>
                    <StyledSelect value={node.props.tag} onChange={(e) => updateProps(node.id, { tag: e.target.value })}>
                      {['h1', 'h2', 'h3', 'h4', 'p', 'span', 'label', 'li'].map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </StyledSelect>
                  </Field>
                  <Field label='Align'>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 5 }}>
                      {(['left', 'center', 'right', 'justify'] as const).map((a) => (
                        <GhostButton
                          key={a}
                          onClick={() => updateProps(node.id, { align: a })}
                          style={{ background: node.props.align === a ? 'var(--primary-dim)' : undefined, fontSize: 13 }}
                          title={a}
                        >
                          {a === 'left' ? '⫷' : a === 'center' ? '≡' : a === 'right' ? '⫸' : '⫶'}
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
                    <TextInput value={node.props.label} onChange={(e) => updateProps(node.id, { label: e.target.value })} />
                  </Field>
                  <Field label='URL / Href'>
                    <TextInput value={node.props.href} onChange={(e) => updateProps(node.id, { href: e.target.value })} placeholder='https://…' />
                  </Field>
                  <Field label='Open in'>
                    <StyledSelect value={node.props.target ?? '_self'} onChange={(e) => updateProps(node.id, { target: e.target.value })}>
                      <option value='_self'>Same tab</option>
                      <option value='_blank'>New tab</option>
                    </StyledSelect>
                  </Field>
                </div>
              </Card>
            )}



            {node.type === 'link' && (
              <Card>
                <div style={{ display: 'grid', gap: 10 }}>
                  <Field label='Label'>
                    <TextInput value={node.props.label} onChange={(e) => updateProps(node.id, { label: e.target.value })} />
                  </Field>
                  <Field label='Path'>
                    <TextInput value={node.props.path ?? ''} onChange={(e) => updateProps(node.id, { path: e.target.value })} placeholder='/about' />
                  </Field>
                  <Field label='Target page ID (optional)'>
                    <TextInput value={node.props.pageId ?? ''} onChange={(e) => updateProps(node.id, { pageId: e.target.value || undefined })} placeholder='page-home' />
                  </Field>
                  <Field label='Open in'>
                    <StyledSelect value={node.props.target ?? '_self'} onChange={(e) => updateProps(node.id, { target: e.target.value })}>
                      <option value='_self'>Same tab</option>
                      <option value='_blank'>New tab</option>
                    </StyledSelect>
                  </Field>
                </div>
              </Card>
            )}

            {node.type === 'navbar' && (
              <Card>
                <div style={{ display: 'grid', gap: 10 }}>
                  <Field label='Items (label|pageId|path per line)'>
                    <TextArea
                      value={node.props.items.map((item) => `${item.label}|${item.pageId ?? ''}|${item.path ?? ''}`).join('\n')}
                      onChange={(e) => {
                        const items = e.target.value
                          .split('\n')
                          .map((line) => line.trim())
                          .filter(Boolean)
                          .map((line, index) => {
                            const [label, pageId, path] = line.split('|')
                            return { id: node.props.items[index]?.id ?? createId(), label: label?.trim() || `Item ${index + 1}`, pageId: pageId?.trim() || undefined, path: path?.trim() || undefined }
                          })
                        updateProps(node.id, { items })
                      }}
                      placeholder={'Home|page-home|/\nAbout||/about'}
                    />
                  </Field>
                </div>
              </Card>
            )}

            {node.type === 'image' && (
              <Card>
                <div style={{ display: 'grid', gap: 10 }}>
                  <Field label='Image URL'>
                    <TextInput value={node.props.src} onChange={(e) => updateProps(node.id, { src: e.target.value })} placeholder='https://…' />
                  </Field>
                  <Field label='Alt text'>
                    <TextInput value={node.props.alt} onChange={(e) => updateProps(node.id, { alt: e.target.value })} placeholder='Describe the image' />
                  </Field>
                  <Field label='Object fit'>
                    <StyledSelect value={node.props.fit ?? 'cover'} onChange={(e) => updateProps(node.id, { fit: e.target.value })}>
                      {['contain', 'cover', 'fill', 'none', 'scale-down'].map((f) => (
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
                  onChange={(v) => updateProps(node.id, { size: v })}
                />
              </Card>
            )}

            {node.type === 'divider' && (
              <Card>
                <Slider
                  label='Thickness'
                  value={typeof node.props.thickness === 'number' ? node.props.thickness : 1}
                  min={1} max={16}
                  onChange={(v) => updateProps(node.id, { thickness: v })}
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
                      <TextInput value={node.props.submitText} onChange={(e) => updateProps(node.id, { submitText: e.target.value })} />
                    </Field>
                    <Field label='Layout'>
                      <StyledSelect value={node.props.layout ?? 'single'} onChange={(e) => updateProps(node.id, { layout: e.target.value })}>
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
                            updateProps(node.id, { fields: next })
                          }} disabled={index === 0} title='Move up'>↑</IconButton>
                          <IconButton onClick={() => {
                            if (index === node.props.fields.length - 1) return
                            const next = node.props.fields.slice()
                            ;[next[index + 1], next[index]] = [next[index], next[index + 1]]
                            updateProps(node.id, { fields: next })
                          }} disabled={index === node.props.fields.length - 1} title='Move down'>↓</IconButton>
                          <IconButton onClick={() => updateProps(node.id, { fields: node.props.fields.filter((x) => x.id !== field.id) })} title='Delete field' style={{ color: 'var(--danger)' }}>✕</IconButton>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                        <Field label='Label'>
                          <TextInput value={field.label} placeholder='Field label' onChange={(e) => {
                            const next = node.props.fields.slice(); next[index] = { ...field, label: e.target.value }; updateProps(node.id, { fields: next })
                          }} />
                        </Field>
                        <Field label='Name'>
                          <TextInput value={field.name} placeholder='field_name' onChange={(e) => {
                            const next = node.props.fields.slice(); next[index] = { ...field, name: e.target.value }; updateProps(node.id, { fields: next })
                          }} />
                        </Field>
                      </div>
                      <Field label='Type'>
                        <StyledSelect value={field.type} onChange={(e) => {
                          const next = node.props.fields.slice(); next[index] = { ...field, type: e.target.value as FormFieldType }; updateProps(node.id, { fields: next })
                        }}>
                          {fieldTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                        </StyledSelect>
                      </Field>
                      <Field label='Placeholder'>
                        <TextInput value={field.placeholder ?? ''} placeholder='Placeholder text' onChange={(e) => {
                          const next = node.props.fields.slice(); next[index] = { ...field, placeholder: e.target.value }; updateProps(node.id, { fields: next })
                        }} />
                      </Field>
                      <Toggle
                        checked={!!field.required}
                        label='Required field'
                        onChange={(v) => {
                          const next = node.props.fields.slice(); next[index] = { ...field, required: v }; updateProps(node.id, { fields: next })
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
                              const next = node.props.fields.slice(); next[index] = { ...field, options }; updateProps(node.id, { fields: next })
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
                  <ColorInput value={String(style.color ?? '')} onChange={(v) => updateStyle(node.id, { color: v })} />
                </Field>
                <Separator />
                <Field label='Background'>
                  <ColorInput value={String(style.background ?? '')} onChange={(v) => updateStyle(node.id, { background: v })} />
                </Field>
              </div>
            </Card>
            <Card>
              <div style={{ display: 'grid', gap: 12 }}>
                <Slider label='Border radius' value={Number(style.borderRadius ?? 0)} min={0} max={80} onChange={(v) => updateStyle(node.id, { borderRadius: v })} />
                <Separator />
                <Field label='Border'>
                  <TextInput value={String(style.border ?? '')} onChange={(e) => updateStyle(node.id, { border: e.target.value })} placeholder='1px solid #ccc' />
                </Field>
                <Field label='Box shadow'>
                  <TextInput value={String(style.boxShadow ?? '')} onChange={(e) => updateStyle(node.id, { boxShadow: e.target.value })} placeholder='0 4px 12px rgba(0,0,0,0.1)' />
                </Field>
              </div>
            </Card>
            <Card>
              <div style={{ display: 'grid', gap: 12 }}>
                <Slider label='Opacity' value={Number(style.opacity ?? 1) * 100} min={0} max={100} unit='%' onChange={(v) => updateStyle(node.id, { opacity: v / 100 })} />
                <Field label='Font size'>
                  <TextInput value={String(style.fontSize ?? '')} onChange={(e) => updateStyle(node.id, { fontSize: e.target.value })} placeholder='16px' />
                </Field>
                <Field label='Font weight'>
                  <StyledSelect value={String(style.fontWeight ?? '')} onChange={(e) => updateStyle(node.id, { fontWeight: e.target.value })}>
                    <option value=''>Default</option>
                    {['300', '400', '500', '600', '700', '800', '900'].map((w) => <option key={w} value={w}>{w}</option>)}
                  </StyledSelect>
                </Field>
                <Field label='Line height'>
                  <TextInput value={String(style.lineHeight ?? '')} onChange={(e) => updateStyle(node.id, { lineHeight: e.target.value })} placeholder='1.5' />
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
                  <StyledSelect value={String(style.display ?? '')} onChange={(e) => updateStyle(node.id, { display: e.target.value })}>
                    <option value=''>Default</option>
                    {['block', 'flex', 'grid', 'inline', 'inline-flex', 'inline-block', 'none'].map((d) => <option key={d} value={d}>{d}</option>)}
                  </StyledSelect>
                </Field>
                {(style.display === 'flex' || style.display === 'inline-flex') && (
                  <>
                    <Field label='Flex direction'>
                      <StyledSelect value={String(style.flexDirection ?? 'row')} onChange={(e) => updateStyle(node.id, { flexDirection: e.target.value })}>
                        {['row', 'column', 'row-reverse', 'column-reverse'].map((d) => <option key={d} value={d}>{d}</option>)}
                      </StyledSelect>
                    </Field>
                    <Field label='Justify content'>
                      <StyledSelect value={String(style.justifyContent ?? '')} onChange={(e) => updateStyle(node.id, { justifyContent: e.target.value })}>
                        <option value=''>Default</option>
                        {['flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'space-evenly'].map((d) => <option key={d} value={d}>{d}</option>)}
                      </StyledSelect>
                    </Field>
                    <Field label='Align items'>
                      <StyledSelect value={String(style.alignItems ?? '')} onChange={(e) => updateStyle(node.id, { alignItems: e.target.value })}>
                        <option value=''>Default</option>
                        {['flex-start', 'center', 'flex-end', 'stretch', 'baseline'].map((d) => <option key={d} value={d}>{d}</option>)}
                      </StyledSelect>
                    </Field>
                    <Field label='Flex wrap'>
                      <StyledSelect value={String(style.flexWrap ?? '')} onChange={(e) => updateStyle(node.id, { flexWrap: e.target.value })}>
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
                <Slider label='Gap' value={Number(style.gap ?? 0)} min={0} max={80} onChange={(v) => updateStyle(node.id, { gap: v })} />
                <Separator />
                <Field label='Padding'>
                  <TextInput value={String(style.padding ?? '')} onChange={(e) => updateStyle(node.id, { padding: e.target.value })} placeholder='16px or 8px 16px' />
                </Field>
                <Field label='Margin'>
                  <TextInput value={String(style.margin ?? '')} onChange={(e) => updateStyle(node.id, { margin: e.target.value })} placeholder='0 auto' />
                </Field>
              </div>
            </Card>
            <Card>
              <div style={{ display: 'grid', gap: 12 }}>
                <Field label='Width'>
                  <TextInput value={String(style.width ?? '')} onChange={(e) => updateStyle(node.id, { width: e.target.value })} placeholder='100% / 400px' />
                </Field>
                <Field label='Max width'>
                  <TextInput value={String(style.maxWidth ?? '')} onChange={(e) => updateStyle(node.id, { maxWidth: e.target.value })} placeholder='1200px' />
                </Field>
                <Field label='Height'>
                  <TextInput value={String(style.height ?? '')} onChange={(e) => updateStyle(node.id, { height: e.target.value })} placeholder='auto / 400px' />
                </Field>
                <Field label='Min height'>
                  <TextInput value={String(style.minHeight ?? '')} onChange={(e) => updateStyle(node.id, { minHeight: e.target.value })} placeholder='120px' />
                </Field>
              </div>
            </Card>
    <div style={{ flex: 1, overflow: 'auto', padding: 12, display: 'grid', gap: 10, alignContent: 'start' }}>
      {tab === 'props' && <div style={{ display: 'grid', gap: 12 }}>
        {node.type === 'text' && <Card><Field label='Content'><TextArea value={node.props.text} onChange={(e) => updateProps(node.id, { text: e.target.value })} /></Field></Card>}
        {node.type === 'button' && <Card><Field label='Label'><TextInput value={node.props.label} onChange={(e) => updateProps(node.id, { label: e.target.value })} /></Field></Card>}
        {node.type === 'image' && <Card><Field label='Image URL'><TextInput value={node.props.src} onChange={(e) => updateProps(node.id, { src: e.target.value })} /></Field></Card>}
        {node.type === 'spacer' && <Card><Slider label='Height' value={typeof node.props.size === 'number' ? node.props.size : 24} min={4} max={320} step={4} onChange={(v) => updateProps(node.id, { size: v })} /></Card>}
        {node.type === 'divider' && <Card><Slider label='Thickness' value={typeof node.props.thickness === 'number' ? node.props.thickness : 1} min={1} max={16} onChange={(v) => updateProps(node.id, { thickness: v })} /></Card>}
        {node.type === 'form' && <div style={{ display: 'grid', gap: 8 }}><Card><Field label='Submit text'><TextInput value={node.props.submitText} onChange={(e) => updateProps(node.id, { submitText: e.target.value })} /></Field></Card><GhostButton onClick={addField}>+ Add field</GhostButton>{node.props.fields.map((field, index) => <Card key={field.id}><div style={{ display: 'grid', gap: 8 }}><Field label='Label'><TextInput value={field.label} onChange={(e) => { const next = node.props.fields.slice(); next[index] = { ...field, label: e.target.value }; updateProps(node.id, { fields: next }) }} /></Field><Field label='Type'><StyledSelect value={field.type} onChange={(e) => { const next = node.props.fields.slice(); next[index] = { ...field, type: e.target.value as FormFieldType }; updateProps(node.id, { fields: next }) }}>{fieldTypes.map((t) => <option key={t} value={t}>{t}</option>)}</StyledSelect></Field><IconButton onClick={() => updateProps(node.id, { fields: node.props.fields.filter((x) => x.id !== field.id) })}>✕</IconButton></div></Card>)}</div>}
        {typeEditor && <Card><div style={{ display: 'grid', gap: 8 }}>{typeEditor}</div></Card>}
      </div>}

      {tab === 'style' && <div style={{ display: 'grid', gap: 12 }}><Card><Field label='Text color'><ColorInput value={String(style.color ?? '#111111')} onChange={(v) => updateStyle(node.id, { color: v })} /></Field><Slider label='Font size' value={Number(style.fontSize ?? 16)} min={8} max={120} onChange={(v) => updateStyle(node.id, { fontSize: v })} /></Card></div>}
      {tab === 'layout' && <div style={{ display: 'grid', gap: 12 }}><Card><Field label='Display'><StyledSelect value={String(style.display ?? 'block')} onChange={(e) => updateStyle(node.id, { display: e.target.value })}><option value='block'>block</option><option value='flex'>flex</option><option value='grid'>grid</option></StyledSelect></Field><Field label='Padding'><TextInput value={String(style.padding ?? '')} onChange={(e) => updateStyle(node.id, { padding: e.target.value })} /></Field><Field label='Margin'><TextInput value={String(style.margin ?? '')} onChange={(e) => updateStyle(node.id, { margin: e.target.value })} /></Field></Card></div>}
      {tab === 'responsive' && <Card>Use toolbar breakpoints (Desktop/Tablet/Mobile).</Card>}
      {tab === 'code' && <div style={{ display: 'grid', gap: 12 }}>
        <Card>
          <Field label='Props JSON (schema por NodeType)' hint='Apply valida / Rollback restaura'>
            <TextArea value={jsonDraft} onChange={(e) => setJsonDraft(e.target.value)} style={{ minHeight: 220, fontFamily: 'var(--font-mono)' }} />
          </Field>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <GhostButton onClick={onApplyJson}>Apply</GhostButton>
            <GhostButton onClick={() => { setJsonDraft(JSON.stringify(node.props, null, 2)); setJsonError(null) }}>Rollback</GhostButton>
          </div>
        </Card>
        <Card>
          <Field label='customCss (scoped automáticamente a [data-node-id])'>
            <TextArea value={node.customCss ?? ''} onChange={(e) => setCustomCss(node.id, e.target.value)} style={{ minHeight: 120, fontFamily: 'var(--font-mono)' }} />
          </Field>
        </Card>
        <Card>
          <Field label='Bindings JSON (targetPath/sourcePath, sin eval)'>
            <TextArea value={bindingsDraft} onChange={(e) => setBindingsDraft(e.target.value)} style={{ minHeight: 140, fontFamily: 'var(--font-mono)' }} />
          </Field>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <GhostButton onClick={onApplyBindings}>Apply bindings</GhostButton>
            <GhostButton onClick={() => setBindingsDraft(JSON.stringify(node.bindings ?? [], null, 2))}>Rollback</GhostButton>
          </div>
        </Card>
        {jsonError && <Card style={{ color: 'var(--danger)' }}>{jsonError}</Card>}
      </div>}
    </div>

    <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
      <Separator style={{ marginBottom: 10 }} />
      <DangerButton onClick={() => removeNode(node.id)} disabled={node.type === 'page'}>✕ Eliminar {node.type}</DangerButton>
    </div>
  </div>
}
