import { Field, StyledSelect, TextInput, Toggle } from '../../../shared/ui'
import type { Node as BuilderNode } from '../../types/schema'
import { inferCollectionFields } from '../../data/engine'
import { useEditorStore } from '../../state/useEditorStore'
import JsonDraftField from './components/JsonDraftField'
import { useNodePropUpdater } from './helpers'

type Props = {
  node: Extract<BuilderNode, { type: 'dataTable' }>
  updateProps: (id: string, patch: Record<string, unknown>) => void
}

export default function DataTableEditor({ node, updateProps }: Props) {
  const updateNodeProps = useNodePropUpdater(node.id, updateProps)
  const flows = useEditorStore((s) => s.flows)
  const flowOptions = flows.flowOrder.map((id) => flows.flowsById[id]).filter(Boolean)
  const rowFields = inferCollectionFields(node.props.rows)

  return (
    <>
      <Field label='Source'>
        <StyledSelect value={node.props.source} onChange={(e) => updateNodeProps({ source: e.target.value })}>
          <option value='static'>static</option>
          <option value='dataSource'>dataSource</option>
        </StyledSelect>
      </Field>
      <Field label='Page size'>
        <TextInput value={String(node.props.pageSize)} onChange={(e) => updateNodeProps({ pageSize: Number(e.target.value) || 1 })} />
      </Field>
      {node.props.source === 'dataSource' && (
        <>
          <Field label='Data source id'><TextInput value={node.props.dataSourceId ?? ''} onChange={(e) => updateNodeProps({ dataSourceId: e.target.value || undefined })} /></Field>
          <Field label='Collection path'><TextInput value={node.props.dataPath ?? ''} onChange={(e) => updateNodeProps({ dataPath: e.target.value })} placeholder='e.g. data.rows' /></Field>
        </>
      )}
      <Toggle checked={node.props.searchable} label='Searchable' onChange={(v) => updateNodeProps({ searchable: v })} />
      <Toggle checked={node.props.pagination} label='Pagination' onChange={(v) => updateNodeProps({ pagination: v })} />
      <Toggle checked={node.props.selectableRows} label='Selectable rows' onChange={(v) => updateNodeProps({ selectableRows: v })} />
      <JsonDraftField
        label='Columns JSON'
        value={node.props.columns}
        onValidChange={(columns) => updateNodeProps({ columns })}
      />
      <JsonDraftField
        label='Rows JSON'
        value={node.props.rows}
        onValidChange={(rows) => updateNodeProps({ rows })}
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
      {rowFields.length > 0 && <Field label='Campos detectados (rows)'><div style={{ fontSize: 12, color: 'var(--muted)' }}>{rowFields.map((item) => item.path).join(', ')}</div></Field>}
    </>
  )
}
