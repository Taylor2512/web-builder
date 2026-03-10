import { Field, StyledSelect, TextInput } from '../../../shared/ui'
import type { Node as BuilderNode } from '../../types/schema'
import { useNodePropUpdater } from './helpers'

type Props = {
  node: Extract<BuilderNode, { type: 'searchBar' }>
  updateProps: (id: string, patch: Record<string, unknown>) => void
}

export default function SearchBarEditor({ node, updateProps }: Props) {
  const updateNodeProps = useNodePropUpdater(node.id, updateProps)

  return (
    <>
      <Field label='Placeholder'><TextInput value={node.props.placeholder} onChange={(e) => updateNodeProps({ placeholder: e.target.value })} /></Field>
      <Field label='Button text'><TextInput value={node.props.buttonText} onChange={(e) => updateNodeProps({ buttonText: e.target.value })} /></Field>
      <Field label='Mode'>
        <StyledSelect value={node.props.mode} onChange={(e) => updateNodeProps({ mode: e.target.value })}>
          <option value='localFilter'>localFilter</option>
          <option value='navigate'>navigate</option>
        </StyledSelect>
      </Field>
      <Field label='Target query key'><TextInput value={node.props.targetQueryKey} onChange={(e) => updateNodeProps({ targetQueryKey: e.target.value })} /></Field>
    </>
  )
}
