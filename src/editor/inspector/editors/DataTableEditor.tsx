import { Field, StyledSelect, TextArea, TextInput, Toggle } from '../../../shared/ui'
import type { Node as BuilderNode } from '../../types/schema'

type Props = {
  node: Extract<BuilderNode, { type: 'dataTable' }>
  updateProps: (id: string, patch: Record<string, unknown>) => void
}

export default function DataTableEditor({ node, updateProps }: Props) {
  return (
    <>
      <Field label='Source'>
        <StyledSelect value={node.props.source} onChange={(e) => updateProps(node.id, { source: e.target.value })}>
          <option value='static'>static</option>
          <option value='dataSource'>dataSource</option>
        </StyledSelect>
      </Field>
      <Field label='Page size'>
        <TextInput value={String(node.props.pageSize)} onChange={(e) => updateProps(node.id, { pageSize: Number(e.target.value) || 1 })} />
      </Field>
      <Toggle checked={node.props.searchable} label='Searchable' onChange={(v) => updateProps(node.id, { searchable: v })} />
      <Toggle checked={node.props.pagination} label='Pagination' onChange={(v) => updateProps(node.id, { pagination: v })} />
      <Toggle checked={node.props.selectableRows} label='Selectable rows' onChange={(v) => updateProps(node.id, { selectableRows: v })} />
      <Field label='Columns JSON'><TextArea value={JSON.stringify(node.props.columns, null, 2)} onChange={(e) => { try { updateProps(node.id, { columns: JSON.parse(e.target.value) }) } catch {} }} /></Field>
      <Field label='Rows JSON'><TextArea value={JSON.stringify(node.props.rows, null, 2)} onChange={(e) => { try { updateProps(node.id, { rows: JSON.parse(e.target.value) }) } catch {} }} /></Field>
    </>
  )
}
