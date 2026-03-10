import { Field, StyledSelect, TextInput, Toggle } from '../../../shared/ui'
import type { Node as BuilderNode } from '../../types/schema'
import JsonDraftField from './components/JsonDraftField'
import { useNodePropUpdater } from './helpers'

type Props = {
  node: Extract<BuilderNode, { type: 'dataTable' }>
  updateProps: (id: string, patch: Record<string, unknown>) => void
}

export default function DataTableEditor({ node, updateProps }: Props) {
  const updateNodeProps = useNodePropUpdater(node.id, updateProps)

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
    </>
  )
}
