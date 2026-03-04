export type NodeType = 'section' | 'text' | 'button'

// compact node shape for smaller payloads
export type Node = {
  id: string
  type: NodeType
  // common compact props
  p?: { t?: string; label?: string }
  s?: Record<string, string | number | undefined> // inline style overrides
  c?: string[] // children ids
}

export type NodesById = Record<string, Node>

export const createNode = (overrides: Partial<Node> & { type: NodeType; id?: string }): Node => {
  const id = overrides.id ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`
  return {
    id,
    type: overrides.type,
    p: overrides.p ?? {},
    s: overrides.s ?? {},
    c: overrides.c ?? [],
  }
}
