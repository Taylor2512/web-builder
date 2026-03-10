import type { FormField } from '../types/schema'

export type ParsedFieldValue = string | number | boolean | File | null
export type FormPayload = Record<string, ParsedFieldValue>
export type FieldErrors = Record<string, string>

const isEmptyString = (value: unknown) => typeof value === 'string' && value.trim().length === 0

export const parseFieldValue = (field: FormField, formData: FormData): ParsedFieldValue => {
  if (field.type === 'checkbox' || field.type === 'switch') {
    return formData.has(field.name)
  }

  if (field.type === 'file') {
    const raw = formData.get(field.name)
    return raw instanceof File && raw.size > 0 ? raw : null
  }

  const raw = formData.get(field.name)
  const rawValue = typeof raw === 'string' ? raw : ''

  if (field.type === 'number' || field.type === 'range') {
    if (rawValue.trim().length === 0) return null
    const parsed = Number(rawValue)
    return Number.isNaN(parsed) ? null : parsed
  }

  return rawValue
}

export const validateFieldValue = (field: FormField, value: ParsedFieldValue): string | null => {
  if (field.required) {
    if ((field.type === 'checkbox' || field.type === 'switch') && value !== true) {
      return `${field.label} is required`
    }

    if ((field.type === 'radio' || field.type === 'select') && isEmptyString(value)) {
      return `${field.label} is required`
    }

    if (value == null || isEmptyString(value)) {
      return `${field.label} is required`
    }
  }

  if (typeof value === 'string' && value.length > 0) {
    if (field.type === 'email' && !/^\S+@\S+\.\S+$/.test(value)) {
      return `${field.label} must be an email`
    }

    if (field.pattern && !new RegExp(field.pattern).test(value)) {
      return `${field.label} invalid format`
    }

    if (field.minLength != null && value.length < field.minLength) {
      return `${field.label} min length ${field.minLength}`
    }

    if (field.maxLength != null && value.length > field.maxLength) {
      return `${field.label} max length ${field.maxLength}`
    }
  }

  if ((field.type === 'number' || field.type === 'range') && value != null) {
    if (typeof value !== 'number') {
      return `${field.label} must be a number`
    }

    if (field.min != null && value < field.min) {
      return `${field.label} min ${field.min}`
    }

    if (field.max != null && value > field.max) {
      return `${field.label} max ${field.max}`
    }
  }

  return null
}

export const validateFormFields = (fields: FormField[], formData: FormData) => {
  const payload: FormPayload = {}
  const errors: FieldErrors = {}

  for (const field of fields) {
    const parsedValue = parseFieldValue(field, formData)
    payload[field.name] = parsedValue

    const validationError = validateFieldValue(field, parsedValue)
    if (validationError) {
      errors[field.name] = validationError
    }
  }

  return {
    payload,
    errors,
    isValid: Object.keys(errors).length === 0,
  }
}
