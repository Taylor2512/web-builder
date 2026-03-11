export type Locale = 'es' | 'en'

export type LabelKey =
  | 'topbar.search'
  | 'topbar.preview'
  | 'topbar.publish'
  | 'topbar.undo'
  | 'topbar.redo'
  | 'leftRail.elements'
  | 'leftRail.pages'
  | 'leftRail.layers'
  | 'pageMenu.sitePages'
  | 'pageMenu.managePages'
  | 'pageMenu.menuTab'
  | 'pageMenu.hiddenTab'
  | 'search.placeholder'
  | 'search.noResults'
  | 'search.recent'
  | 'addDrawer.title'
  | 'addDrawer.quickAdd'
  | 'addDrawer.close'
  | 'inspector.title'
  | 'inspector.pin'
  | 'inspector.unpin'
  | 'panelAction.close'
  | 'panelAction.open'
  | 'panelAction.expand'
  | 'panelAction.collapse'

export const EDITOR_LABELS: Record<Locale, Record<LabelKey, string>> = {
  es: {
    'topbar.search': 'Buscar',
    'topbar.preview': 'Vista previa',
    'topbar.publish': 'Publicar',
    'topbar.undo': 'Deshacer',
    'topbar.redo': 'Rehacer',
    'leftRail.elements': 'Elementos',
    'leftRail.pages': 'Páginas',
    'leftRail.layers': 'Capas',
    'pageMenu.sitePages': 'Páginas del sitio',
    'pageMenu.managePages': 'Administrar páginas',
    'pageMenu.menuTab': 'Menú del sitio',
    'pageMenu.hiddenTab': 'Páginas ocultas',
    'search.placeholder': 'Buscar herramientas, acciones, formularios, SEO…',
    'search.noResults': 'No se encontraron resultados',
    'search.recent': 'Búsquedas recientes',
    'addDrawer.title': 'Agregar elementos',
    'addDrawer.quickAdd': 'Inserción rápida',
    'addDrawer.close': 'Cerrar panel',
    'inspector.title': 'Inspector',
    'inspector.pin': 'Fijar inspector',
    'inspector.unpin': 'Inspector por hover',
    'panelAction.close': 'Cerrar',
    'panelAction.open': 'Abrir',
    'panelAction.expand': 'Expandir',
    'panelAction.collapse': 'Contraer',
  },
  en: {
    'topbar.search': 'Search',
    'topbar.preview': 'Preview',
    'topbar.publish': 'Publish',
    'topbar.undo': 'Undo',
    'topbar.redo': 'Redo',
    'leftRail.elements': 'Elements',
    'leftRail.pages': 'Pages',
    'leftRail.layers': 'Layers',
    'pageMenu.sitePages': 'Site pages',
    'pageMenu.managePages': 'Manage pages',
    'pageMenu.menuTab': 'Site menu',
    'pageMenu.hiddenTab': 'Hidden pages',
    'search.placeholder': 'Search tools, actions, forms, SEO…',
    'search.noResults': 'No results found',
    'search.recent': 'Recent searches',
    'addDrawer.title': 'Add elements',
    'addDrawer.quickAdd': 'Quick add',
    'addDrawer.close': 'Close panel',
    'inspector.title': 'Inspector',
    'inspector.pin': 'Pin inspector',
    'inspector.unpin': 'Hover inspector',
    'panelAction.close': 'Close',
    'panelAction.open': 'Open',
    'panelAction.expand': 'Expand',
    'panelAction.collapse': 'Collapse',
  },
}

export function getEditorLabel(locale: Locale, key: LabelKey): string {
  const localized = EDITOR_LABELS[locale]?.[key]
  if (localized && localized.trim().length > 0) return localized

  const fallback = EDITOR_LABELS.en[key]
  if (fallback && fallback.trim().length > 0) return fallback

  return key
}
