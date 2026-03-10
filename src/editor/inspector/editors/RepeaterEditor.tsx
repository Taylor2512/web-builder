import { Field, TextInput } from '../../../shared/ui'
import type { Node as BuilderNode } from '../../types/schema'

type Props = {
  node: Extract<BuilderNode, { type: 'repeater' }>
  updateProps: (id: string, patch: Record<string, unknown>) => void
}

export default function RepeaterEditor({ node, updateProps }: Props) {
  return (
    <>
      <Field label='Data source id'>
        <TextInput value={node.props.dataSourceId ?? ''} onChange={(e) => updateProps(node.id, { dataSourceId: e.target.value || undefined })} placeholder='optional' />
      </Field>
      <Field label='Data path'>
        <TextInput value={node.props.dataPath} onChange={(e) => updateProps(node.id, { dataPath: e.target.value })} />
      </Field>
      <Field label='Item context name'>
        <TextInput value={node.props.itemContextName} onChange={(e) => updateProps(node.id, { itemContextName: e.target.value })} />
      </Field>
    </>
  )
}
