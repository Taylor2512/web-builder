import type { NodeType } from '../../types/schema'
import { buttonRenderer, dividerRenderer, emptyRenderer, formRenderer, imageRenderer, linkRenderer, navbarRenderer, spacerRenderer } from './basicRenderers'
import { dataTableRenderer } from './dataTableRenderer'
import { dateInputRenderer } from './dateInputRenderer'
import { repeaterRenderer } from './repeaterRenderer'
import { searchBarRenderer } from './searchBarRenderer'
import { searchSelectRenderer } from './searchSelectRenderer'
import { textRenderer } from './textRenderer'
import type { NodeRenderer } from './types'

export const rendererRegistry: Record<NodeType, NodeRenderer> = {
  page: emptyRenderer,
  section: emptyRenderer,
  container: emptyRenderer,
  grid: emptyRenderer,
  spacer: spacerRenderer,
  divider: dividerRenderer,
  text: textRenderer,
  image: imageRenderer,
  button: buttonRenderer,
  link: linkRenderer,
  navbar: navbarRenderer,
  form: formRenderer,
  dateInput: dateInputRenderer,
  searchSelect: searchSelectRenderer,
  dataTable: dataTableRenderer,
  searchBar: searchBarRenderer,
  repeater: repeaterRenderer,
}
