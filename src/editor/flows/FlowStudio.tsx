import { useMemo, useState } from 'react'
import { useEditorStore } from '../state/useEditorStore'
import { Card, Field, GhostButton, PanelTitle, TextInput } from '../../shared/ui'
import type { FlowVariableType } from './types/schema'

const variableTypes: FlowVariableType[] = ['string', 'number', 'boolean', 'date', 'enum', 'object']

export default function FlowStudio() {
  const flows = useEditorStore((s) => s.flows)
  const createFlow = useEditorStore((s) => s.createFlow)
  const deleteFlow = useEditorStore((s) => s.deleteFlow)
  const selectFlow = useEditorStore((s) => s.selectFlow)
  const renameFlow = useEditorStore((s) => s.renameFlow)
  const upsertFlowVariable = useEditorStore((s) => s.upsertFlowVariable)
  const removeFlowVariable = useEditorStore((s) => s.removeFlowVariable)

  const activeFlow = useMemo(
    () => (flows.activeFlowId ? flows.flowsById[flows.activeFlowId] : null),
    [flows.activeFlowId, flows.flowsById],
  )

  const [newFlowName, setNewFlowName] = useState('')
  const [varName, setVarName] = useState('')
  const [varType, setVarType] = useState<FlowVariableType>('string')

  return (
    <div style={{ height: '100%', display: 'grid', gridTemplateColumns: '320px 1fr', gap: 12, padding: 12 }}>
      <Card>
        <PanelTitle>Flows</PanelTitle>
        <div style={{ display: 'grid', gap: 8 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <TextInput
              aria-label='New flow name'
              placeholder='New flow name'
              value={newFlowName}
              onChange={(event) => setNewFlowName(event.target.value)}
            />
            <GhostButton
              onClick={() => {
                createFlow(newFlowName.trim() || 'Untitled Flow')
                setNewFlowName('')
              }}
            >
              +
            </GhostButton>
          </div>
          {flows.flowOrder.map((flowId) => {
            const flow = flows.flowsById[flowId]
            if (!flow) return null
            const selected = flows.activeFlowId === flow.id
            return (
              <div key={flow.id} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 8, background: selected ? 'var(--surface-2)' : 'transparent' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                  <button
                    style={{ background: 'transparent', border: 'none', color: 'var(--text)', cursor: 'pointer', textAlign: 'left', padding: 0 }}
                    onClick={() => selectFlow(flow.id)}
                  >
                    {flow.name}
                  </button>
                  <GhostButton onClick={() => deleteFlow(flow.id)}>Delete</GhostButton>
                </div>
                <small style={{ color: 'var(--muted)' }}>{Object.keys(flow.variables).length} variables</small>
              </div>
            )
          })}
        </div>
      </Card>

      <Card>
        {!activeFlow ? (
          <div style={{ color: 'var(--muted)' }}>Select a flow.</div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            <PanelTitle>Flow Inspector</PanelTitle>
            <Field label='Flow name'>
              <TextInput value={activeFlow.name} onChange={(event) => renameFlow(activeFlow.id, event.target.value)} />
            </Field>

            <div>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Variables</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <TextInput value={varName} placeholder='variable key' onChange={(event) => setVarName(event.target.value)} />
                <select value={varType} onChange={(event) => setVarType(event.target.value as FlowVariableType)}>
                  {variableTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
                <GhostButton
                  onClick={() => {
                    if (!varName.trim()) return
                    upsertFlowVariable(activeFlow.id, varName.trim(), { type: varType })
                    setVarName('')
                  }}
                >
                  Add variable
                </GhostButton>
              </div>

              <div style={{ display: 'grid', gap: 6 }}>
                {Object.entries(activeFlow.variables).map(([key, value]) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--border)', borderRadius: 10, padding: 8 }}>
                    <div>
                      <strong>{key}</strong> <span style={{ color: 'var(--muted)' }}>({value.type})</span>
                    </div>
                    <GhostButton onClick={() => removeFlowVariable(activeFlow.id, key)}>Remove</GhostButton>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ color: 'var(--muted)' }}>
              Graph nodes: {Object.keys(activeFlow.graph.nodesById).length} · edges: {activeFlow.graph.edges.length}
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
