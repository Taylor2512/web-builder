import { Field, TextInput } from '../../../shared/ui'
import type { Node as BuilderNode } from '../../types/schema'
import { useNodePropUpdater } from './helpers'

type Props = {
  node: Extract<BuilderNode, { type: 'repeater' }>
  updateProps: (id: string, patch: Record<string, unknown>) => void
}

export default function RepeaterEditor({ node, updateProps }: Props) {
  const updateNodeProps = useNodePropUpdater(node.id, updateProps)

  return (
    <>
      <Field label='Data source id'>
        <TextInput value={node.props.dataSourceId ?? ''} onChange={(e) => updateNodeProps({ dataSourceId: e.target.value || undefined })} placeholder='optional' />
      </Field>
      <Field label='Data path'>
        <TextInput value={node.props.dataPath} onChange={(e) => updateNodeProps({ dataPath: e.target.value })} />
      </Field>
      <Field label='Item context name'>
        <TextInput value={node.props.itemContextName} onChange={(e) => updateNodeProps({ itemContextName: e.target.value })} />
      </Field>
    </>
  )
}
