import type { FormField } from '../types/schema'
import { parseFieldValue, validateFieldValue } from './validators'

export const validateField = (field: FormField, raw: FormDataEntryValue | null): string | null => {
  const formData = new FormData()
  if (raw != null) {
    formData.set(field.name, raw)
  }
  const parsedValue = parseFieldValue(field, formData)
  return validateFieldValue(field, parsedValue)
}
