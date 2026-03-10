import type { ReactNode } from 'react'
import type { EditorMode, Node } from '../../types/schema'

export type NodeRendererContext = {
  node: Node
  mode: EditorMode
  renderChildren: (keyPrefix?: string) => ReactNode
  updateProps: (id: string, patch: Record<string, unknown>) => void
}

export type RendererOutput = {
  content: ReactNode
  handlesChildren?: boolean
}

export type NodeRenderer = (context: NodeRendererContext) => RendererOutput
