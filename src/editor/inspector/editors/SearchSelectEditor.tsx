import { Field, StyledSelect, TextArea, TextInput, Toggle } from '../../../shared/ui'
import { createId, type Node as BuilderNode } from '../../types/schema'

type Props = {
  node: Extract<BuilderNode, { type: 'searchSelect' }>
  updateProps: (id: string, patch: Record<string, unknown>) => void
}

export default function SearchSelectEditor({ node, updateProps }: Props) {
  return (
    <>
      <Field label='Label'><TextInput value={node.props.label} onChange={(e) => updateProps(node.id, { label: e.target.value })} /></Field>
      <Field label='Name'><TextInput value={node.props.name} onChange={(e) => updateProps(node.id, { name: e.target.value })} /></Field>
      <Field label='Placeholder'><TextInput value={node.props.placeholder} onChange={(e) => updateProps(node.id, { placeholder: e.target.value })} /></Field>
      <Field label='Source'>
        <StyledSelect value={node.props.source} onChange={(e) => updateProps(node.id, { source: e.target.value })}>
          <option value='static'>static</option>
          <option value='dataSource'>dataSource</option>
        </StyledSelect>
      </Field>
      <Toggle checked={node.props.searchable} label='Searchable' onChange={(v) => updateProps(node.id, { searchable: v })} />
      <Toggle checked={node.props.multiple} label='Multiple' onChange={(v) => updateProps(node.id, { multiple: v })} />
      <Toggle checked={node.props.required} label='Required' onChange={(v) => updateProps(node.id, { required: v })} />
      <Field label='Static options JSON'>
        <TextArea
          value={JSON.stringify(node.props.options, null, 2)}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value) as Array<{ label: string; value: string; id?: string }>
              updateProps(node.id, { options: parsed.map((item) => ({ id: item.id ?? createId(), label: item.label, value: item.value })) })
            } catch {
              // keep draft until valid JSON
            }
          }}
        />
      </Field>
    </>
  )
}
