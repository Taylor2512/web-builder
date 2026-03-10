# Web Builder (React + TypeScript + Vite)

Editor visual tipo "page builder" con drag-and-drop, árbol de capas, inspector de propiedades/estilos, breakpoints responsivos, gestión de páginas, flujo de automatizaciones y persistencia local/remota (json-server).

---

## 1) Resumen funcional

Este proyecto permite:

- Construir páginas por bloques (`section`, `container`, `grid`, `text`, `image`, `button`, `form`, etc.).
- Reordenar y mover nodos en el canvas con `@dnd-kit`.
- Editar propiedades y estilos por breakpoint (`desktop`, `tablet`, `mobile`).
- Cambiar entre modo edición y vista previa.
- Gestionar múltiples páginas dentro de un sitemap simple.
- Administrar un módulo de flujos (`Flow Studio`) con variables y grafo básico.
- Guardar/cargar automáticamente en `localStorage` y opcionalmente sincronizar a `json-server`.

---

## 2) Stack técnico

- **Frontend**: React 19, TypeScript, Vite 8 beta.
- **Estado**: Zustand + Immer.
- **Drag & Drop**: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`.
- **Persistencia remota opcional**: `json-server`.
- **Linting/Tooling**: ESLint, Prettier, TypeScript.

Dependencias principales declaradas en `package.json`.

---

## 3) Instalación y ejecución

### Requisitos

- Node.js 20+ (recomendado 22+).
- npm.

### Instalar dependencias

```bash
npm install
```

### Desarrollo (frontend)

```bash
npm run dev
```

### Desarrollo completo (frontend + json-server)

```bash
npm run dev:full
```

### Servidor JSON (opcional, para persistencia remota)

```bash
npm run json-server
```

Por defecto usa `http://localhost:3001` y datos en `db.json`.

### Build de producción

```bash
npm run build
```

### Preview de build

```bash
npm run preview
```

---

## 4) Variables de entorno

Puedes configurar la URL del backend remoto:

- `VITE_JSON_SERVER_URL` (opcional)

Si no existe, el cliente usa:

- `http://localhost:3001`

Ejemplo:

```bash
VITE_JSON_SERVER_URL=http://localhost:3001
```

---

## 5) Estructura del proyecto

```text
src/
  main.tsx
  App.tsx
  editor/
    api/
      jsonServer.ts
    blocks/
      FormBuilder.tsx
      BlocksPanel.tsx
    canvas/
      Canvas.tsx
      viewport/
        GridOverlay.tsx
        useViewport.ts
    config/
      loadBuilderConfig.ts
    flows/
      FlowStudio.tsx
      types/schema.ts
    inspector/
      Inspector.tsx
    state/
      useEditorStore.ts
    types/
      schema.ts
    panels/
      PagesPanel.tsx
      SiteDesignPanel.tsx
    utils/
      themes.ts
  shared/
    ui.tsx
    Button.tsx
styles/
  tokens.css
public/
  builder.config.json
db.json
```

---

## 6) Arquitectura y flujo general

### Flujo de UI

1. `main.tsx` monta `App`.
2. `App.tsx` renderiza `FormBuilder`.
3. `FormBuilder` compone:
   - izquierda: `BlocksPanel`
   - centro: `Canvas`
   - derecha: `Inspector`
   - modo alterno: `FlowStudio`.

### Flujo de estado

- `useEditorStore.ts` concentra todo el estado de proyecto:
  - nodos y árbol (`nodesById`)
  - selección (`selectedNodeId`)
  - breakpoints
  - páginas (`site.pages`)
  - flujos (`flows`)
  - envíos de formulario (`submissions`)
- Las acciones (`addNode`, `moveNode`, `updateProps`, etc.) mutan con Immer.
- Cada cambio relevante persiste en `localStorage` (`withAutosave`).

### Flujo de persistencia remota

- `FormBuilder` intenta hidratar al iniciar con `loadRemoteProject()`.
- Luego sincroniza cambios con debounce de ~700ms usando `saveRemoteProject()`.
- Formularios guardan envíos con `saveRemoteSubmission()`.

---

## 7) Modelo de datos (core)

Definido en `src/editor/types/schema.ts`.

### Tipos de nodo (`NodeType`)

- `page`, `section`, `container`, `grid`
- `spacer`, `divider`
- `text`, `image`, `button`
- `form`, `dateInput`, `searchSelect`, `dataTable`, `searchBar`, `repeater`

### Nodo editor (`EditorNode`)

Cada nodo contiene:

- `id`
- `type`
- `props` tipados por tipo de nodo
- `styleByBreakpoint` (`desktop/tablet/mobile`)
- `children` (IDs de hijos)

### Sitio y páginas

- `site.pages`: lista de páginas (`id`, `name`, `path`, `rootId`, `title`).
- `site.activePageId`: página activa.

### Flujos

- `flows.activeFlowId`, `flows.flowsById`, `flows.flowOrder`.
- Grafo con nodos y aristas (`FlowGraph`).

---

## 8) Configuración dinámica del builder

Archivo base: `public/builder.config.json`.

Se carga por `loadBuilderConfig()` en este orden:

1. `GET /builderConfig` (json-server, remoto)
2. `GET /builder.config.json` (estático)
3. fallback embebido en código

La configuración controla:

- anchos de breakpoints
- grid overlay (size/show/snap)
- bloques habilitados
- restricciones de jerarquía (`allowedParents`)
- límites por contenedor (`maxChildren`)
- tokens de tema (`radius`, `surface`, `primary`)

---

## 9) Manual de uso (usuario)

### 9.1 Crear y editar contenido

1. Desde **BlocksPanel**, busca o elige un bloque.
2. Arrastra al canvas (o clic para insertar en el contenedor objetivo).
3. Selecciona un nodo en el canvas.
4. Edita en **Inspector**:
   - **Contenido** (`props`)
   - **Estilo**
   - **Diseño/Layout**
   - **Adaptable/Responsive**

### 9.2 Reordenar / mover

- Arrastra nodos dentro del árbol visual.
- En selección activa usa toolbar contextual (arriba del nodo):
  - mover arriba/abajo
  - duplicar
  - eliminar

### 9.3 Texto inline

- Doble clic sobre bloque `text` en canvas para editar `contentEditable`.

### 9.4 Modo preview

- Botón superior: alterna entre `edit` y `preview`.

### 9.5 Páginas

- Selector superior para página activa.
- Botón `+ Page` para crear.
- Remover página activa (si hay más de una).

### 9.6 Importar / Exportar / Reset

- **Export**: descarga snapshot JSON del proyecto.
- **Import**: hidrata desde JSON.
- **Reset**: vuelve a plantilla base.

### 9.7 Flujos

- Cambia a workspace `Flows`.
- Crea/elimina flujos.
- Renombra flujo.
- Agrega/borra variables tipadas.

---

## 10) ¿Cómo funciona cada componente?

### Arranque y shell

- `src/main.tsx`: bootstrap React.
- `src/App.tsx`: entrada simple, renderiza `FormBuilder`.
- `src/editor/blocks/FormBuilder.tsx`:
  - layout principal (topbar + 3 paneles)
  - carga de config
  - hidratación remota inicial
  - autosync remoto con debounce
  - shortcuts globales (`Delete`/`Backspace`)
  - import/export/reset.

### Panel izquierdo

- `src/editor/blocks/BlocksPanel.tsx`:
  - catálogo por categorías
  - búsqueda de bloques
  - validación de restricciones de inserción
  - modo `Layers` con árbol jerárquico
  - drag source para `@dnd-kit`.

### Canvas

- `src/editor/canvas/Canvas.tsx`:
  - `DndContext` global
  - reglas de drop (parent permitido, capacidad máxima, prevención de ciclos)
  - render recursivo de nodos (`RenderNode`)
  - toolbar contextual por nodo
  - `NodeResizer` con handles
  - overlay de drop y hints visuales
  - vista preview y modo edición.

### Viewport

- `src/editor/canvas/viewport/useViewport.ts`:
  - zoom in/out/reset
  - estado `zoom`, `panX`, `panY`.
- `src/editor/canvas/viewport/GridOverlay.tsx`:
  - grid en `<canvas>`
  - redibujo en resize y cambios de zoom.

### Inspector

- `src/editor/inspector/Inspector.tsx`:
  - panel contextual del nodo seleccionado
  - edición de props por tipo
  - edición de estilo/layout por breakpoint
  - constructor de campos para `form`
  - duplicado y eliminación de nodo.

### Flujos

- `src/editor/flows/FlowStudio.tsx`:
  - CRUD básico de flujos
  - variables tipadas por flujo
  - resumen de nodos/aristas del grafo.
- `src/editor/flows/types/schema.ts`:
  - tipos de dominio de flujo y creador de flujo default.

### Estado global

- `src/editor/state/useEditorStore.ts`:
  - acciones de nodos: agregar, mover, borrar, duplicar, reordenar siblings
  - acciones de estilos/props
  - acciones de páginas y flows
  - persistencia local y envío de formularios.

### Tipos y utilidades

- `src/editor/types/schema.ts`: contrato tipado del editor (nodos, pages, sitemap, breakpoints).
- `src/editor/config/loadBuilderConfig.ts`: carga/valida config runtime.
- `src/editor/api/jsonServer.ts`: cliente HTTP para proyecto, config y submissions.
- `src/editor/utils/themes.ts`: presets de tema (utilidad, no conectada aún al shell principal).

### UI compartida y estilos

- `src/shared/ui.tsx`: biblioteca de componentes UI reutilizables (`Card`, `Field`, `TextInput`, `GhostButton`, `PrimaryButton`, `DangerButton`, `IconButton`, `StyledSelect`, `ColorInput`, `Slider`, `Toggle`, etc.).
- `src/shared/Button.tsx`: wrapper mínimo legacy.
- `src/styles/tokens.css`: design tokens globales (colores, radios, sombras, tipografía, transiciones).

### Panels adicionales

- `src/editor/panels/PagesPanel.tsx`
- `src/editor/panels/SiteDesignPanel.tsx`

Estos módulos existen y están funcionales, pero actualmente **no están montados** en `FormBuilder.tsx` de forma activa.

---

## 11) Contrato de backend local (`db.json`)

Estructura principal:

- `projects[]`
  - `id`
  - `name`
  - `data` (`EditorProject` completo)
  - `updatedAt`
- `submissions[]`
- `builderConfig`

Endpoints usados por el frontend:

- `GET /projects/p1`
- `PUT /projects/p1`
- `POST /submissions`
- `GET /builderConfig`

---

## 12) Scripts disponibles

- `npm run dev`: servidor Vite en desarrollo.
- `npm run json-server`: backend fake REST sobre `db.json` en `:3001`.
- `npm run build`: `tsc -b` + build de Vite.
- `npm run lint`: ESLint.
- `npm run preview`: preview del build.

---

## 13) Accesibilidad y diseño (estado actual)

Implementado actualmente:

- botones con `title` y foco visual en inputs.
- contraste mejorado en paneles oscuros.
- señales visuales claras de selección/drop/acciones.

Pendientes sugeridos:

- navegación completa por teclado en canvas (roving tabindex).
- atajos documentados (`Cmd/Ctrl + D` para duplicar, etc.).
- etiquetas ARIA más profundas en controles del inspector.

---

## 14) Troubleshooting

### No carga persistencia remota

- Verifica `json-server` activo en `:3001`.
- Revisa `VITE_JSON_SERVER_URL`.
- Si falla, el editor sigue funcionando con `localStorage`.

### Drag-and-drop no inserta

- Revisa restricciones en `builder.config.json > constraints.allowedParents`.
- Revisa límites `maxChildren`.

### Build falla por tipos

- Ejecuta `npm run build` para ver errores completos.
- Valida cambios en `schema.ts` y `useEditorStore.ts` cuando agregues nuevos `NodeType`.

---

## 15) Guía rápida para extender el editor

### Agregar un nuevo tipo de bloque

1. Añadir `NodeType` en `src/editor/types/schema.ts`.
2. Definir `NodePropsByType` y defaults en el mismo archivo.
3. Incluir el tipo en `builder.config.json > blocks.enabled`.
4. Agregar metadata/icono en `BlocksPanel.tsx`.
5. Renderizar en `Canvas.tsx` (`RenderNode`).
6. Agregar edición en `Inspector.tsx`.

### Agregar una nueva regla de restricción

- Editar `public/builder.config.json` en `constraints`.
- (Opcional) persistir también en `db.json > builderConfig`.

---

## 16) Estado del proyecto

El editor está operativo para creación visual, edición de estilos por breakpoint, gestión de páginas, preview y persistencia local/remota.

Módulos en evolución:

- paneles alternativos (`pages/design`) aún sin montar en el shell principal actual,
- mejora de accesibilidad avanzada (teclado/ARIA),
- roadmap de features Wix-like adicionales.

## 10) Deploy en Vercel desde GitHub

El repositorio incluye configuración lista para Vercel:

- `vercel.json` para build de Vite + fallback SPA.
- función serverless `api/[...path].ts` que levanta `json-server` con `db.json`.
- cliente configurado para usar `/api` automáticamente en producción.

### Pasos

1. Importa el repositorio en Vercel (GitHub Integration).
2. Framework: **Vite** (detectado automáticamente).
3. Build Command: `npm run build` (ya definido).
4. Output Directory: `dist` (ya definido).
5. Deploy.

### Endpoint API en producción

En Vercel, los endpoints quedan bajo `/api`, por ejemplo:

- `GET /api/projects/p1`
- `PUT /api/projects/p1`
- `POST /api/submissions`
- `GET /api/builderConfig`

> Nota: en Serverless, la escritura en `db.json` es efímera. Para persistencia real en producción, migra a una base de datos externa.
