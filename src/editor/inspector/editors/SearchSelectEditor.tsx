import { Field, StyledSelect, TextInput, Toggle } from '../../../shared/ui'
import { createId, type Node as BuilderNode } from '../../types/schema'
import JsonDraftField from './components/JsonDraftField'
import { useNodePropUpdater } from './helpers'

type Props = {
  node: Extract<BuilderNode, { type: 'searchSelect' }>
  updateProps: (id: string, patch: Record<string, unknown>) => void
}

export default function SearchSelectEditor({ node, updateProps }: Props) {
  const updateNodeProps = useNodePropUpdater(node.id, updateProps)

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
    </>
  )
}
