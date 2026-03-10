import { createDefaultFlow, type FlowsState } from '../flows/types/schema'

export type EditorMode = 'edit' | 'preview'
export type Breakpoint = 'desktop' | 'tablet' | 'mobile'
export type NodeId = string
export type NodeBinding = {
  id: string
  targetPath: string
  sourcePath: string
}

export type SeoMetadata = {
  description?: string
  ogImage?: string // legacy compatibility
  canonicalUrl?: string
  robots?: {
    index?: boolean
    follow?: boolean
  }
  og?: {
    title?: string
    description?: string
    image?: string
    type?: 'website' | 'article' | 'product'
  }
  twitter?: {
    card?: 'summary' | 'summary_large_image'
    title?: string
    description?: string
    image?: string
  }
}

export type EditorPanelId = 'blocks' | 'layers' | 'pages' | 'design'

export type EditorPanelsState = {
  left: {
    open: boolean
    width: number
    activePanel: EditorPanelId | null
  }
  right: {
    open: boolean
    width: number
  }
}

export type FocusModeState = {
  active: boolean
  scope: 'page' | 'node'
  nodeId: NodeId | null
}

export type EditorUIState = {
  panels?: EditorPanelsState
  focusMode: FocusModeState | boolean
  leftPanelOpen: boolean // legacy compatibility
  rightPanelOpen: boolean // legacy compatibility
  leftPanelWidth: number // legacy compatibility
  rightPanelWidth: number // legacy compatibility
  activeLeftPanel: EditorPanelId | null // legacy compatibility
}

export type NodeVisibilityState = {
  hidden: boolean
  hiddenByBreakpoint?: Partial<Record<Breakpoint, boolean>>
}

export type NodeResponsiveState = {
  breakpointOverrides?: Partial<Record<Breakpoint, StyleMap>>
  lockAspectRatio?: boolean
}

export type NodeInteractionState = {
  pointerEvents?: 'auto' | 'none'
  tabIndex?: number
  role?: string
  ariaLabel?: string
}

export type LibraryTemplate = {
  id: string
  name: string
  category: string
  rootNodeId: NodeId
  version: number
  tags?: string[]
}

export type DataCollectionField = {
  id: string
  key: string
  type: 'text' | 'number' | 'boolean' | 'date' | 'json'
  required?: boolean
}

export type DataCollection = {
  id: string
  name: string
  fields: DataCollectionField[]
  records?: Record<string, unknown>[]
}

export type PageDef = {
  id: string
  name: string
  path: string
  rootId: NodeId
  title?: string
  meta?: SeoMetadata
}

export type SiteMap = {
  pages: PageDef[]
  activePageId: string
}

export type DateInputMode = 'date' | 'datetime' | 'time' | 'month'

export type SearchSelectOption = {
  id: string
  label: string
  value: string
}

export type WidgetEventFlows = {
  clickFlowId?: string
  hoverFlowId?: string
  loadFlowId?: string
}

export type DataTableColumn = {
  id: string
  header: string
  accessor: string
  width?: number
  align: 'left' | 'center' | 'right'
  format: 'text' | 'number' | 'currency' | 'date' | 'badge'
}

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
  | 'dateInput'
  | 'searchSelect'
  | 'dataTable'
  | 'searchBar'
  | 'link'
  | 'navbar'
  | 'repeater'

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
  dateInput: {
    label: string
    name: string
    mode: DateInputMode
    placeholder: string
    required: boolean
    min?: string
    max?: string
    defaultValue?: string
    helpText?: string
  }
  searchSelect: {
    label: string
    name: string
    placeholder: string
    required: boolean
    multiple: boolean
    searchable: boolean
    source: 'static' | 'dataSource'
    options: SearchSelectOption[]
    dataSourceId?: string
    dataPath?: string
    labelPath?: string
    valuePath?: string
    events?: WidgetEventFlows
  }
  dataTable: {
    source: 'static' | 'dataSource'
    rows: Record<string, unknown>[]
    columns: DataTableColumn[]
    dataSourceId?: string
    dataPath?: string
    searchable: boolean
    pagination: boolean
    pageSize: number
    selectableRows: boolean
    striped: boolean
    dense: boolean
    events?: WidgetEventFlows
  }
  searchBar: {
    placeholder: string
    buttonText: string
    mode: 'localFilter' | 'navigate'
    targetQueryKey: string
  }
  link: {
    label: string
    pageId?: string
    path?: string
    target: '_self' | '_blank'
  }
  navbar: {
    items: { id: string; label: string; pageId?: string; path?: string }[]
  }
  repeater: {
    dataSourceId?: string
    dataPath: string
    itemContextName: string
    events?: WidgetEventFlows
  }
}

export type EditorNode<T extends NodeType = NodeType> = {
  id: NodeId
  type: T
  props: NodePropsByType[T]
  styleByBreakpoint: StyleByBreakpoint
  children: NodeId[]
  isHidden?: boolean
  visibility?: NodeVisibilityState
  responsive?: NodeResponsiveState
  interactions?: NodeInteractionState
  customCss?: string
  bindings?: NodeBinding[]
}

export type Node = { [K in NodeType]: EditorNode<K> }[NodeType]
export type NodesById = Record<NodeId, Node>

export type EditorProject = {
  projectName: string
  rootId: NodeId // legacy compatibility
  nodesById: NodesById
  mode: EditorMode
  flows: FlowsState
  site: SiteMap
  ui: EditorUIState
  libraryTemplates?: LibraryTemplate[]
  dataCollections?: DataCollection[]
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
  dateInput: {
    label: 'Date',
    name: 'date',
    mode: 'date',
    placeholder: 'Select date',
    required: false,
  },
  searchSelect: {
    label: 'Search Select',
    name: 'searchSelect',
    placeholder: 'Search...',
    required: false,
    multiple: false,
    searchable: true,
    source: 'static',
    options: [
      { id: createId(), label: 'Option 1', value: 'option-1' },
      { id: createId(), label: 'Option 2', value: 'option-2' },
    ],
    events: {},
  },
  dataTable: {
    source: 'static',
    rows: [
      { id: '1', name: 'Item A', price: 42 },
      { id: '2', name: 'Item B', price: 99 },
    ],
    columns: [
      { id: 'col-name', header: 'Name', accessor: 'name', align: 'left', format: 'text' },
      { id: 'col-price', header: 'Price', accessor: 'price', align: 'right', format: 'currency' },
    ],
    searchable: true,
    pagination: true,
    pageSize: 10,
    selectableRows: false,
    striped: true,
    dense: false,
    events: {},
  },
  searchBar: {
    placeholder: 'Search...',
    buttonText: 'Search',
    mode: 'navigate',
    targetQueryKey: 'q',
  },
  link: {
    label: 'Go to page',
    target: '_self',
  },
  navbar: {
    items: [
      { id: createId(), label: 'Home', path: '/' },
      { id: createId(), label: 'About', path: '/about' },
    ],
  },
  repeater: {
    dataPath: 'items',
    itemContextName: 'item',
    events: {},
  },
}

export const createNode = <T extends NodeType>(type: T, id: string = createId()): EditorNode<T> => ({
  id,
  type,
  props: structuredClone(defaults[type]),
  styleByBreakpoint: emptyStyle(),
  children: [],
  isHidden: false,
  visibility: {
    hidden: false,
  },
  responsive: {
    breakpointOverrides: {},
  },
  interactions: {},
  customCss: '',
  bindings: [],
})

export const containerTypes: NodeType[] = ['page', 'section', 'container', 'grid', 'repeater']

export const baseTemplate = (): EditorProject => {
  const page = createNode('page', 'root-page')
  const section = createNode('section')
  const heading = createNode('text')
  heading.props = { text: 'Build your page visually', tag: 'h1', align: 'left' }
  const paragraph = createNode('text')
  paragraph.props = { text: 'Drag blocks, style them, and preview instantly.', tag: 'p', align: 'left' }

  page.children = [section.id]
  section.children = [heading.id, paragraph.id]

  const flow = createDefaultFlow('flow-main', 'Main Flow')
  const homePage: PageDef = { id: 'page-home', name: 'Home', path: '/', rootId: page.id, title: 'Home' }

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
    flows: {
      activeFlowId: flow.id,
      flowsById: { [flow.id]: flow },
      flowOrder: [flow.id],
    },
    site: {
      pages: [homePage],
      activePageId: homePage.id,
    },
    ui: {
      panels: {
        left: {
          open: true,
          width: 240,
          activePanel: 'blocks',
        },
        right: {
          open: true,
          width: 300,
        },
      },
      focusMode: {
        active: false,
        scope: 'page',
        nodeId: null,
      },
      leftPanelOpen: true,
      rightPanelOpen: true,
      leftPanelWidth: 240,
      rightPanelWidth: 300,
      activeLeftPanel: 'blocks' as const,
    },
    libraryTemplates: [],
    dataCollections: [],
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
