# Editor Contracts v2 (baseline interno)

Este documento fija el contrato base para el rebase de tracks sobre `chore/contracts-freeze`.

## 1) Campos nuevos en contrato

### `EditorProject.ui` (nuevo modelo global UI)

- **Obligatorio**: `ui.panels.left.open`, `ui.panels.left.width`, `ui.panels.left.activePanel`, `ui.panels.right.open`, `ui.panels.right.width`, `ui.focusMode.active`, `ui.focusMode.scope`, `ui.focusMode.nodeId`.
- **Compatibilidad legacy (aún soportado)**: `ui.leftPanelOpen`, `ui.rightPanelOpen`, `ui.leftPanelWidth`, `ui.rightPanelWidth`, `ui.activeLeftPanel`.

### `EditorNode` (visibilidad/responsive/interacciones)

- **Opcional**:
  - `visibility.hidden`
  - `visibility.hiddenByBreakpoint`
  - `responsive.breakpointOverrides`
  - `responsive.lockAspectRatio`
  - `interactions.pointerEvents`
  - `interactions.tabIndex`
  - `interactions.role`
  - `interactions.ariaLabel`
- **Legacy**: `isHidden` se mantiene para backward compatibility.

### SEO extendido en `PageDef.meta`

`meta` pasa a soportar estructura extendida:

- `description`
- `canonicalUrl`
- `robots.index` / `robots.follow`
- `og.title`, `og.description`, `og.image`, `og.type`
- `twitter.card`, `twitter.title`, `twitter.description`, `twitter.image`

### Hooks de historial

En `EditorStore`:

- `historyHooks.beforeCommit(project, context)`
- `historyHooks.afterCommit(project, context)`

Con contexto mínimo:

- `source`: `ui | nodes | site | flows | persistence`
- `action`: nombre de acción
- `timestamp`: ISO string

### Templates y collections mínimas

En `EditorProject`:

- `libraryTemplates?: LibraryTemplate[]`
- `dataCollections?: DataCollection[]`

Contratos mínimos:

- `LibraryTemplate`: `id`, `name`, `category`, `rootNodeId`, `version`, `tags?`
- `DataCollection`: `id`, `name`, `fields`, `records?`
- `DataCollectionField`: `id`, `key`, `type`, `required?`

## 2) Semántica de defaults

- `ui.panels.left`: abierto, ancho `240`, panel activo `blocks`.
- `ui.panels.right`: abierto, ancho `300`.
- `ui.focusMode`: inactivo, `scope=page`, `nodeId=null`.
- `EditorNode.visibility.hidden`: `false`.
- `EditorNode.visibility.hiddenByBreakpoint`: ausente (sin override).
- `EditorNode.responsive.breakpointOverrides`: `{}`.
- `EditorNode.interactions`: `{}`.
- `libraryTemplates` y `dataCollections`: `[]` a nivel base template.

## 3) Reglas de backward compatibility

1. Lectura: consumidores v2 **deben aceptar** payloads legacy que solo incluyan:
   - `ui.leftPanelOpen/rightPanelOpen/leftPanelWidth/rightPanelWidth/activeLeftPanel`
   - `node.isHidden`
   - `page.meta.description` y/o `page.meta.ogImage`
2. Escritura: hasta completar migración global, se permite dual-write de:
   - `ui.panels.*` + claves legacy de UI.
   - `visibility.hidden` + `isHidden`.
3. Ausencia de `libraryTemplates` / `dataCollections` no rompe contrato (se asume lista vacía).
4. Hooks de historial son opcionales y no bloquean commits cuando no existen.

## 4) Baseline interno

Este punto queda definido como **baseline interno de contratos** para rebase de todos los tracks.
