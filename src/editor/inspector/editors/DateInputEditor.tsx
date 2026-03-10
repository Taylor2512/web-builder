import { Field, StyledSelect, TextInput, Toggle } from '../../../shared/ui'
import type { Node as BuilderNode } from '../../types/schema'

type Props = {
  node: Extract<BuilderNode, { type: 'dateInput' }>
  updateProps: (id: string, patch: Record<string, unknown>) => void
}

export default function DateInputEditor({ node, updateProps }: Props) {
  return (
    <>
      <Field label='Label'>
        <TextInput value={node.props.label} onChange={(e) => updateProps(node.id, { label: e.target.value })} />
      </Field>
      <Field label='Name'>
        <TextInput value={node.props.name} onChange={(e) => updateProps(node.id, { name: e.target.value })} />
      </Field>
      <Field label='Mode'>
        <StyledSelect value={node.props.mode} onChange={(e) => updateProps(node.id, { mode: e.target.value })}>
          <option value='date'>date</option>
          <option value='datetime'>datetime</option>
          <option value='time'>time</option>
          <option value='month'>month</option>
        </StyledSelect>
      </Field>
      <Field label='Placeholder'>
        <TextInput value={node.props.placeholder} onChange={(e) => updateProps(node.id, { placeholder: e.target.value })} />
      </Field>
      <Toggle checked={node.props.required} label='Required' onChange={(v) => updateProps(node.id, { required: v })} />
    </>
  )
}
