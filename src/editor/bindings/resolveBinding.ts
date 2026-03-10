import { bindingHelpers, isWhitelistedHelper, type BindingPrimitive } from './helpers'

export type BindingError = {
  expression: string
  message: string
}

export type ResolveBindingResult = {
  value: unknown
  errors: BindingError[]
}

type PathSegment = string | number

const isQuoted = (value: string) =>
  (value.startsWith("'") && value.endsWith("'")) ||
  (value.startsWith('"') && value.endsWith('"'))

const parsePath = (path: string): PathSegment[] | null => {
  const source = path.trim()
  if (!source) return null
  const segments: PathSegment[] = []
  const pattern = /([A-Za-z_$][\w$]*)|\[(\d+)\]/g
  let currentIndex = 0

  while (currentIndex < source.length) {
    const dot = source[currentIndex]
    if (dot === '.') {
      currentIndex += 1
      continue
    }

    pattern.lastIndex = currentIndex
    const match = pattern.exec(source)
    if (!match || match.index !== currentIndex) return null

    if (match[1]) segments.push(match[1])
    if (match[2]) segments.push(Number(match[2]))
    currentIndex = pattern.lastIndex
  }

  return segments
}

const readPath = (context: unknown, path: string): ResolveBindingResult => {
  const segments = parsePath(path)
  if (!segments) {
    return {
      value: undefined,
      errors: [{ expression: path, message: `Invalid path: "${path}"` }],
    }
  }

  let current: unknown = context
  for (const segment of segments) {
    if (current == null) {
      return {
        value: undefined,
        errors: [{ expression: path, message: `Path not found: "${path}"` }],
      }
    }
    if (typeof segment === 'number') {
      if (!Array.isArray(current) || segment >= current.length) {
        return {
          value: undefined,
          errors: [{ expression: path, message: `Index out of bounds in path: "${path}"` }],
        }
      }
      current = current[segment]
      continue
    }

    if (typeof current !== 'object' || !(segment in current)) {
      return {
        value: undefined,
        errors: [{ expression: path, message: `Path not found: "${path}"` }],
      }
    }

    current = (current as Record<string, unknown>)[segment]
  }

  return { value: current, errors: [] }
}

const resolveExpression = (expression: string, context: unknown): ResolveBindingResult => {
  const source = expression.trim()
  const helperMatch = source.match(/^([A-Za-z_$][\w$]*)\((.*)\)$/)

  if (helperMatch) {
    const helperName = helperMatch[1]
    const helperArgRaw = helperMatch[2].trim()

    if (!isWhitelistedHelper(helperName)) {
      return {
        value: undefined,
        errors: [{ expression: source, message: `Helper "${helperName}" is not allowed` }],
      }
    }

    let argResult: ResolveBindingResult
    if (isQuoted(helperArgRaw)) {
      argResult = { value: helperArgRaw.slice(1, -1), errors: [] }
    } else if (/^-?\d+(\.\d+)?$/.test(helperArgRaw)) {
      argResult = { value: Number(helperArgRaw), errors: [] }
    } else {
      argResult = readPath(context, helperArgRaw)
    }

    if (argResult.errors.length) return argResult
    const helper = bindingHelpers[helperName]
    return { value: helper(argResult.value) as BindingPrimitive, errors: [] }
  }

  return readPath(context, source)
}

export const resolveBinding = (
  rawValue: unknown,
  context: unknown,
): ResolveBindingResult => {
  if (typeof rawValue !== 'string') return { value: rawValue, errors: [] }

  const input = rawValue.trim()
  if (!input) return { value: rawValue, errors: [] }

  const exactMustache = input.match(/^{{\s*(.*?)\s*}}$/)
  if (exactMustache) return resolveExpression(exactMustache[1], context)

  if (input.includes('{{')) {
    const errors: BindingError[] = []
    const value = rawValue.replace(/{{\s*(.*?)\s*}}/g, (_, expression: string) => {
      const result = resolveExpression(expression, context)
      if (result.errors.length) {
        errors.push(...result.errors)
        return ''
      }
      return String(result.value ?? '')
    })
    return { value, errors }
  }

  if (/^[A-Za-z_$][\w$]*(?:\[(?:\d+)\]|\.[A-Za-z_$][\w$]*)*$/.test(input)) {
    return readPath(context, input)
  }

  return { value: rawValue, errors: [] }
}
