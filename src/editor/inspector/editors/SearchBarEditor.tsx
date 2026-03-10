import { Field, StyledSelect, TextInput } from '../../../shared/ui'
import type { Node as BuilderNode } from '../../types/schema'

type Props = {
  node: Extract<BuilderNode, { type: 'searchBar' }>
  updateProps: (id: string, patch: Record<string, unknown>) => void
}

export default function SearchBarEditor({ node, updateProps }: Props) {
  return (
    <>
      <Field label='Placeholder'><TextInput value={node.props.placeholder} onChange={(e) => updateProps(node.id, { placeholder: e.target.value })} /></Field>
      <Field label='Button text'><TextInput value={node.props.buttonText} onChange={(e) => updateProps(node.id, { buttonText: e.target.value })} /></Field>
      <Field label='Mode'>
        <StyledSelect value={node.props.mode} onChange={(e) => updateProps(node.id, { mode: e.target.value })}>
          <option value='localFilter'>localFilter</option>
          <option value='navigate'>navigate</option>
        </StyledSelect>
      </Field>
      <Field label='Target query key'><TextInput value={node.props.targetQueryKey} onChange={(e) => updateProps(node.id, { targetQueryKey: e.target.value })} /></Field>
    </>
  )
}
