import { Field, StyledSelect, TextInput, Toggle } from '../../../shared/ui'
import type { Node as BuilderNode } from '../../types/schema'
import { useNodePropUpdater } from './helpers'

type Props = {
  node: Extract<BuilderNode, { type: 'dateInput' }>
  updateProps: (id: string, patch: Record<string, unknown>) => void
}

export default function DateInputEditor({ node, updateProps }: Props) {
  const updateNodeProps = useNodePropUpdater(node.id, updateProps)

  return (
    <>
      <Field label='Label'>
        <TextInput value={node.props.label} onChange={(e) => updateNodeProps({ label: e.target.value })} />
      </Field>
      <Field label='Name'>
        <TextInput value={node.props.name} onChange={(e) => updateNodeProps({ name: e.target.value })} />
      </Field>
      <Field label='Mode'>
        <StyledSelect value={node.props.mode} onChange={(e) => updateNodeProps({ mode: e.target.value })}>
          <option value='date'>date</option>
          <option value='datetime'>datetime</option>
          <option value='time'>time</option>
          <option value='month'>month</option>
        </StyledSelect>
      </Field>
      <Field label='Placeholder'>
        <TextInput value={node.props.placeholder} onChange={(e) => updateNodeProps({ placeholder: e.target.value })} />
      </Field>
      <Toggle checked={node.props.required} label='Required' onChange={(v) => updateNodeProps({ required: v })} />
    </>
  )
}
