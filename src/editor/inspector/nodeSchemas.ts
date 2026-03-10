import type { NodeType, NodePropsByType } from '../types/schema'

type ValidationResult = { ok: true } | { ok: false; error: string }

type Rule = (props: unknown) => ValidationResult

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value)

const hasString = (value: Record<string, unknown>, key: string) => typeof value[key] === 'string'
const hasBoolean = (value: Record<string, unknown>, key: string) => typeof value[key] === 'boolean'
const hasNumber = (value: Record<string, unknown>, key: string) => typeof value[key] === 'number' && Number.isFinite(value[key])

const rules: Record<NodeType, Rule> = {
  page: (props) => (isObject(props) && hasString(props, 'title') ? { ok: true } : { ok: false, error: 'page.title debe ser string' }),
  section: (props) => (isObject(props) && hasString(props, 'name') ? { ok: true } : { ok: false, error: 'section.name debe ser string' }),
  container: (props) => (isObject(props) && hasString(props, 'name') ? { ok: true } : { ok: false, error: 'container.name debe ser string' }),
  grid: (props) => (isObject(props) && hasNumber(props, 'columns') && hasNumber(props, 'gap') ? { ok: true } : { ok: false, error: 'grid.columns/gap deben ser number' }),
  spacer: (props) => (isObject(props) && hasNumber(props, 'size') ? { ok: true } : { ok: false, error: 'spacer.size debe ser number' }),
  divider: (props) => (isObject(props) && hasNumber(props, 'thickness') ? { ok: true } : { ok: false, error: 'divider.thickness debe ser number' }),
  text: (props) => (isObject(props) && hasString(props, 'text') && hasString(props, 'tag') && hasString(props, 'align') ? { ok: true } : { ok: false, error: 'text.{text,tag,align} inválido' }),
  image: (props) => (isObject(props) && hasString(props, 'src') && hasString(props, 'alt') && hasString(props, 'fit') ? { ok: true } : { ok: false, error: 'image.{src,alt,fit} inválido' }),
  button: (props) => (isObject(props) && hasString(props, 'label') && hasString(props, 'href') && hasString(props, 'target') && hasString(props, 'variant') ? { ok: true } : { ok: false, error: 'button props inválidas' }),
  form: (props) => (isObject(props) && hasString(props, 'submitText') && hasString(props, 'layout') && Array.isArray(props.fields) ? { ok: true } : { ok: false, error: 'form props inválidas' }),
  dateInput: (props) => (isObject(props) && hasString(props, 'label') && hasString(props, 'name') && hasString(props, 'mode') && hasString(props, 'placeholder') && hasBoolean(props, 'required') ? { ok: true } : { ok: false, error: 'dateInput props inválidas' }),
  searchSelect: (props) => (isObject(props) && hasString(props, 'label') && hasString(props, 'name') && hasString(props, 'placeholder') && hasBoolean(props, 'required') && hasBoolean(props, 'multiple') && hasBoolean(props, 'searchable') && hasString(props, 'source') && Array.isArray(props.options) ? { ok: true } : { ok: false, error: 'searchSelect props inválidas' }),
  dataTable: (props) => (isObject(props) && hasString(props, 'source') && Array.isArray(props.rows) && Array.isArray(props.columns) && hasBoolean(props, 'searchable') && hasBoolean(props, 'pagination') && hasNumber(props, 'pageSize') ? { ok: true } : { ok: false, error: 'dataTable props inválidas' }),
  searchBar: (props) => (isObject(props) && hasString(props, 'placeholder') && hasString(props, 'buttonText') && hasString(props, 'mode') && hasString(props, 'targetQueryKey') ? { ok: true } : { ok: false, error: 'searchBar props inválidas' }),
  repeater: (props) => (isObject(props) && hasString(props, 'dataPath') && hasString(props, 'itemContextName') ? { ok: true } : { ok: false, error: 'repeater props inválidas' }),
}

export const validateNodeProps = <T extends NodeType>(type: T, props: unknown): props is NodePropsByType[T] => rules[type](props).ok

export const validateNodePropsWithError = (type: NodeType, props: unknown): ValidationResult => rules[type](props)
