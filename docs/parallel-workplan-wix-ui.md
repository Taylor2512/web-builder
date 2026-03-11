# Plan de trabajo paralelo para Wix UI

## 1) Ownership por carpeta

Para minimizar conflictos, cada flujo/tarea tendrá ownership exclusivo de una carpeta.

| Área / Tarea | Carpeta asignada | Owner sugerido | Alcance permitido |
|---|---|---|---|
| Search | `search/` | Equipo Search | Componentes, hooks, estilos y utilidades específicas de búsqueda. |
| Topbar | `topbar/` | Equipo Navigation | Elementos de barra superior, menús, badges y comportamiento asociado. |
| Add Drawer | `add-drawer/` | Equipo Create | UI/estado del drawer de alta y sus subcomponentes. |
| Internacionalización | `i18n/` | Equipo Localization | Traducciones, diccionarios, helpers y configuración i18n. |
| Iconografía | `icons/` | Equipo Design System | SVGs, wrappers de iconos y mapeos de iconos. |
| E2E | `tests/e2e/` | Equipo QA | Specs E2E, fixtures y utilidades de prueba E2E. |

---

## 2) Regla estricta de paralelización

**Regla obligatoria:** cada tarea/PR **solo puede añadir archivos nuevos** dentro de su carpeta asignada.

- No se permite editar ni borrar archivos fuera de la carpeta propia.
- No se permite editar archivos compartidos durante la fase paralela.
- Si una tarea requiere tocar otra carpeta, se debe:
  1. cerrar primero el PR de la tarea original,
  2. abrir un PR de integración posterior.

> Objetivo: evitar bloqueos por conflictos de merge y permitir integración continua en paralelo.

---

## 3) Plantilla de PR (para trabajo paralelo)

Usar la siguiente plantilla mínima en cada PR:

```md
## Resumen
- [ ] Describe brevemente el objetivo de la tarea.

## Carpeta asignada
- Carpeta: `<search/ | topbar/ | add-drawer/ | i18n/ | icons/ | tests/e2e/>`

## Archivos tocados
- [ ] `ruta/archivo-1`
- [ ] `ruta/archivo-2`
- [ ] `...`

## Validación de no-superposición
- [ ] Confirmo que todos los archivos tocados pertenecen únicamente a la carpeta asignada.
- [ ] Confirmo que no edité archivos compartidos fuera de la carpeta asignada.

## Dependencias / Integración posterior
- [ ] Sin dependencias (merge inmediato posible)
- [ ] Requiere PR de integración posterior (detallar): `...`
```

---

## 4) Matriz de dependencias

### Tareas totalmente independientes (fase paralela)

- `search/`
- `topbar/`
- `add-drawer/`
- `i18n/`
- `icons/`
- `tests/e2e/` (si testea solo flujos ya disponibles dentro de su propio scope)

### Tareas con integración posterior esperada

Estas tareas pueden requerir un PR de integración una vez mergeadas en paralelo:

- `topbar/` + `search/` (si Topbar incorpora entrada o acciones de búsqueda).
- `add-drawer/` + `i18n/` (si nuevos textos requieren wiring de traducciones en puntos compartidos).
- `search/` + `icons/` (si el consumo de iconos exige registro o mapeo fuera del scope aislado).
- `tests/e2e/` + cualquier carpeta funcional (cuando el test final deba cubrir comportamiento integrado cross-feature).

> Recomendación: mantener los PR paralelos 100% aislados y mover todo “wiring cruzado” a PRs de integración explícitos.

---

## 5) Criterio de merge

**Merge inmediato permitido** cuando se cumplen todas las condiciones:

1. El PR toca únicamente archivos de su carpeta asignada.
2. No hay archivos compartidos modificados.
3. El checklist de no-superposición está completo.
4. CI de la tarea está en verde.

Si cualquier condición falla, el PR pasa a estado **“integración posterior requerida”**.
