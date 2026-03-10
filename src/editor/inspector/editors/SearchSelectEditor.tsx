import { Field, StyledSelect, TextInput, Toggle } from '../../../shared/ui'
import { createId, type Node as BuilderNode } from '../../types/schema'
import { inferCollectionFields } from '../../data/engine'
import { useEditorStore } from '../../state/useEditorStore'
import JsonDraftField from './components/JsonDraftField'
import { useNodePropUpdater } from './helpers'

type Props = {
  node: Extract<BuilderNode, { type: 'searchSelect' }>
  updateProps: (id: string, patch: Record<string, unknown>) => void
}

export default function SearchSelectEditor({ node, updateProps }: Props) {
  const updateNodeProps = useNodePropUpdater(node.id, updateProps)
  const flows = useEditorStore((s) => s.flows)
  const flowOptions = flows.flowOrder.map((id) => flows.flowsById[id]).filter(Boolean)
  const sourceFields = inferCollectionFields(node.props.options)

  return (
    <>
      <Field label='Label'><TextInput value={node.props.label} onChange={(e) => updateNodeProps({ label: e.target.value })} /></Field>
      <Field label='Name'><TextInput value={node.props.name} onChange={(e) => updateNodeProps({ name: e.target.value })} /></Field>
      <Field label='Placeholder'><TextInput value={node.props.placeholder} onChange={(e) => updateNodeProps({ placeholder: e.target.value })} /></Field>
      <Field label='Source'>
        <StyledSelect value={node.props.source} onChange={(e) => updateNodeProps({ source: e.target.value })}>
          <option value='static'>static</option>
          <option value='dataSource'>dataSource</option>
        </StyledSelect>
      </Field>
      {node.props.source === 'dataSource' && (
        <>
          <Field label='Data source id'><TextInput value={node.props.dataSourceId ?? ''} onChange={(e) => updateNodeProps({ dataSourceId: e.target.value || undefined })} /></Field>
          <Field label='Collection path'><TextInput value={node.props.dataPath ?? ''} onChange={(e) => updateNodeProps({ dataPath: e.target.value })} placeholder='e.g. data.items' /></Field>
          <Field label='Label field path'><TextInput value={node.props.labelPath ?? ''} onChange={(e) => updateNodeProps({ labelPath: e.target.value })} placeholder='e.g. name' /></Field>
          <Field label='Value field path'><TextInput value={node.props.valuePath ?? ''} onChange={(e) => updateNodeProps({ valuePath: e.target.value })} placeholder='e.g. id' /></Field>
        </>
      )}
      <Toggle checked={node.props.searchable} label='Searchable' onChange={(v) => updateNodeProps({ searchable: v })} />
      <Toggle checked={node.props.multiple} label='Multiple' onChange={(v) => updateNodeProps({ multiple: v })} />
      <Toggle checked={node.props.required} label='Required' onChange={(v) => updateNodeProps({ required: v })} />
      <JsonDraftField
        label='Static options JSON'
        value={node.props.options}
        normalize={(parsed) => {
          const options = Array.isArray(parsed) ? parsed : []
          return options.map((item) => {
            const option = item as { id?: string; label?: string; value?: string }
            return {
              id: option.id ?? createId(),
              label: typeof option.label === 'string' ? option.label : '',
              value: typeof option.value === 'string' ? option.value : '',
            }
          })
        }}
        onValidChange={(options) => updateNodeProps({ options })}
      />
      <Field label='Evento click → flow'>
        <StyledSelect value={node.props.events?.clickFlowId ?? ''} onChange={(e) => updateNodeProps({ events: { ...(node.props.events ?? {}), clickFlowId: e.target.value || undefined } })}>
          <option value=''>none</option>
          {flowOptions.map((flow) => <option key={flow.id} value={flow.id}>{flow.name}</option>)}
        </StyledSelect>
      </Field>
      <Field label='Evento hover → flow'>
        <StyledSelect value={node.props.events?.hoverFlowId ?? ''} onChange={(e) => updateNodeProps({ events: { ...(node.props.events ?? {}), hoverFlowId: e.target.value || undefined } })}>
          <option value=''>none</option>
          {flowOptions.map((flow) => <option key={flow.id} value={flow.id}>{flow.name}</option>)}
        </StyledSelect>
      </Field>
      <Field label='Evento load → flow'>
        <StyledSelect value={node.props.events?.loadFlowId ?? ''} onChange={(e) => updateNodeProps({ events: { ...(node.props.events ?? {}), loadFlowId: e.target.value || undefined } })}>
          <option value=''>none</option>
          {flowOptions.map((flow) => <option key={flow.id} value={flow.id}>{flow.name}</option>)}
        </StyledSelect>
      </Field>
      {sourceFields.length > 0 && <Field label='Campos detectados (static)'><div style={{ fontSize: 12, color: 'var(--muted)' }}>{sourceFields.map((item) => `${item.path}:${item.sampleType}`).join(', ')}</div></Field>}
    </>
  )
}
