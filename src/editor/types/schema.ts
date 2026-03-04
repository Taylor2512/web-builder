export type EditorMode = 'edit' | 'preview'
export type Breakpoint = 'desktop' | 'tablet' | 'mobile'
export type NodeId = string

export type NodeType =
  | 'page'
  | 'section'
  | 'container'
  | 'grid'
  | 'spacer'
  | 'divider'
  | 'text'
  | 'image'
  | 'button'
  | 'form'

export type StyleValue = string | number | undefined
export type StyleMap = Record<string, StyleValue>
export type StyleByBreakpoint = Record<Breakpoint, StyleMap>

export type FormFieldType =
  | 'text'
  | 'textarea'
  | 'email'
  | 'number'
  | 'password'
  | 'tel'
  | 'url'
  | 'date'
  | 'time'
  | 'datetime-local'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'switch'
  | 'range'
  | 'file'
  | 'color'

export type FormFieldOption = { id: string; label: string; value: string }

export type FormField = {
  id: string
  type: FormFieldType
  label: string
  name: string
  placeholder?: string
  required?: boolean
  defaultValue?: string
  helpText?: string
  min?: number
  max?: number
  minLength?: number
  maxLength?: number
  pattern?: string
  options?: FormFieldOption[]
}

export type NodePropsByType = {
  page: { title: string }
  section: { name: string }
  container: { name: string }
  grid: { columns: number; gap: number }
  spacer: { size: number }
  divider: { thickness: number }
  text: { text: string; tag: 'h1' | 'h2' | 'h3' | 'p' | 'span'; align: 'left' | 'center' | 'right' }
  image: { src: string; alt: string; fit: 'cover' | 'contain' }
  button: { label: string; href: string; target: '_self' | '_blank'; variant: 'solid' | 'outline' }
  form: { submitText: string; layout: 'stack' | 'grid'; fields: FormField[] }
}

export type EditorNode<T extends NodeType = NodeType> = {
  id: NodeId
  type: T
  props: NodePropsByType[T]
  styleByBreakpoint: StyleByBreakpoint
  children: NodeId[]
}

export type Node = { [K in NodeType]: EditorNode<K> }[NodeType]
export type NodesById = Record<NodeId, Node>

export type EditorProject = {
  projectName: string
  rootId: NodeId
  nodesById: NodesById
  mode: EditorMode
}

const makeId = () => `${Math.random().toString(36).slice(2, 9)}-${Date.now().toString(36)}`
export const createId = () => makeId()

export const emptyStyle = (): StyleByBreakpoint => ({ desktop: {}, tablet: {}, mobile: {} })

const defaults: { [K in NodeType]: NodePropsByType[K] } = {
  page: { title: 'Landing Page' },
  section: { name: 'Section' },
  container: { name: 'Container' },
  grid: { columns: 2, gap: 16 },
  spacer: { size: 24 },
  divider: { thickness: 1 },
  text: { text: 'Editable text', tag: 'p', align: 'left' },
  image: { src: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200', alt: 'Image', fit: 'cover' },
  button: { label: 'Button', href: '#', target: '_self', variant: 'solid' },
  form: {
    submitText: 'Send',
    layout: 'stack',
    fields: [{ id: createId(), type: 'text', label: 'Name', name: 'name', placeholder: 'Your name', required: true }],
  },
}

export const createNode = <T extends NodeType>(type: T, id: string = createId()): EditorNode<T> => ({
  id,
  type,
  props: structuredClone(defaults[type]),
  styleByBreakpoint: emptyStyle(),
  children: [],
})

export const containerTypes: NodeType[] = ['page', 'section', 'container', 'grid']

export const baseTemplate = (): EditorProject => {
  const page = createNode('page', 'root-page')
  const section = createNode('section')
  const heading = createNode('text')
  heading.props = { text: 'Build your page visually', tag: 'h1', align: 'left' }
  const paragraph = createNode('text')
  paragraph.props = { text: 'Drag blocks, style them, and preview instantly.', tag: 'p', align: 'left' }

  page.children = [section.id]
  section.children = [heading.id, paragraph.id]

  return {
    projectName: 'My Web Builder Project',
    rootId: page.id,
    mode: 'edit',
    nodesById: {
      [page.id]: page,
      [section.id]: section,
      [heading.id]: heading,
      [paragraph.id]: paragraph,
    },
  }
}

export const sanitizeUrl = (value: string) => {
  const input = value.trim()
  if (!input) return '#'
  if (input.startsWith('/')) return input
  if (input.startsWith('#')) return input
  try {
    const url = new URL(input)
    if (url.protocol === 'http:' || url.protocol === 'https:') return url.toString()
  } catch {
    return '#'
  }
  return '#'
}
