export type FlowNodeType = 'start' | 'step' | 'formStep' | 'decision' | 'compute' | 'action' | 'end'

export type FlowVariableType = 'string' | 'number' | 'boolean' | 'date' | 'enum' | 'object'

export type RuleExpr =
  | { op: '==' | '!=' | '>' | '<' | '>=' | '<='; left: RuleValueExpr; right: RuleValueExpr }
  | { op: 'and' | 'or'; args: RuleExpr[] }
  | { op: 'exists'; value: RuleValueExpr }
  | { op: 'in'; left: RuleValueExpr; right: RuleValueExpr[] }

export type RuleValueExpr = { var: string } | string | number | boolean | null

export type FlowVariable = {
  type: FlowVariableType
  defaultValue?: unknown
  enumValues?: string[]
}

export type FlowNode = {
  id: string
  type: FlowNodeType
  label: string
  x: number
  y: number
  data?: Record<string, unknown>
}

export type FlowEdge = {
  id: string
  from: string
  to: string
  condition?: RuleExpr
}

export type FlowGraph = {
  nodesById: Record<string, FlowNode>
  edges: FlowEdge[]
}

export type FlowDefinition = {
  id: string
  name: string
  variables: Record<string, FlowVariable>
  graph: FlowGraph
  createdAt: string
  updatedAt: string
}

export type FlowsState = {
  activeFlowId: string | null
  flowsById: Record<string, FlowDefinition>
  flowOrder: string[]
}

export const createDefaultFlow = (id: string, name: string): FlowDefinition => {
  const now = new Date().toISOString()
  const startId = `${id}-start`
  const endId = `${id}-end`

  return {
    id,
    name,
    variables: {},
    createdAt: now,
    updatedAt: now,
    graph: {
      nodesById: {
        [startId]: { id: startId, type: 'start', label: 'Start', x: 120, y: 120 },
        [endId]: { id: endId, type: 'end', label: 'End', x: 420, y: 120 },
      },
      edges: [{ id: `${id}-edge-start-end`, from: startId, to: endId }],
    },
  }
}
