import type { FormField } from "../types/schema.ts";

export const validateField = (
  field: FormField,
  raw: FormDataEntryValue | null,
): string | null => {
  const value = typeof raw === "string" ? raw : "";
  if (field.required && !value) return `${field.label} is required`;
  if (field.type === "email" && value && !/^\S+@\S+\.\S+$/.test(value)) {
    return `${field.label} must be an email`;
  }
  if (field.minLength && value.length < field.minLength) {
    return `${field.label} min length ${field.minLength}`;
  }
  if (field.maxLength && value.length > field.maxLength) {
    return `${field.label} max length ${field.maxLength}`;
  }
  if (field.pattern && value && !new RegExp(field.pattern).test(value)) {
    return `${field.label} invalid format`;
  }
  return null;
};
