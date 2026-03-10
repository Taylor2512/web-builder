import { Field, StyledSelect, TextInput } from '../../../shared/ui'
import type { Node as BuilderNode } from '../../types/schema'
import { useEditorStore } from '../../state/useEditorStore'
import { useNodePropUpdater } from './helpers'

type Props = {
  node: Extract<BuilderNode, { type: 'repeater' }>
  updateProps: (id: string, patch: Record<string, unknown>) => void
}

export default function RepeaterEditor({ node, updateProps }: Props) {
  const updateNodeProps = useNodePropUpdater(node.id, updateProps)
  const flows = useEditorStore((s) => s.flows)
  const flowOptions = flows.flowOrder.map((id) => flows.flowsById[id]).filter(Boolean)

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
      <Field label='Evento click → flow'>
        <StyledSelect value={node.props.events?.clickFlowId ?? ''} onChange={(e) => updateNodeProps({ events: { ...(node.props.events ?? {}), clickFlowId: e.target.value || undefined } })}>
          <option value=''>none</option>
          {flowOptions.map((flow) => <option key={flow.id} value={flow.id}>{flow.name}</option>)}
        </StyledSelect>
      </Field>
      <Field label='Evento hover → flow'>
        <StyledSelect value={node.props.events?.hoverFlowId ?? ''} onChange={(e) => updateNodeProps({ events: { ...(node.props.events ?? {}), hoverFlowId: e.target.value || undefined } })}>
          <option value=''>none</option>
          {flowOptions.map((flow) => <option key={flow.id} value={flow.id}>{flow.name}</option>)}
        </StyledSelect>
      </Field>
      <Field label='Evento load → flow'>
        <StyledSelect value={node.props.events?.loadFlowId ?? ''} onChange={(e) => updateNodeProps({ events: { ...(node.props.events ?? {}), loadFlowId: e.target.value || undefined } })}>
          <option value=''>none</option>
          {flowOptions.map((flow) => <option key={flow.id} value={flow.id}>{flow.name}</option>)}
        </StyledSelect>
      </Field>
    </>
  )
}
