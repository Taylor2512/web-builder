export type BindingPrimitive = string | number | boolean | null | undefined

export type BindingHelper = (value: unknown) => BindingPrimitive

const formatNumberFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 2,
})

export const bindingHelpers: Record<string, BindingHelper> = {
  uppercase: (value) => String(value ?? '').toUpperCase(),
  lowercase: (value) => String(value ?? '').toLowerCase(),
  formatNumber: (value) => {
    if (typeof value === 'number') return formatNumberFormatter.format(value)
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value)
      return Number.isFinite(parsed) ? formatNumberFormatter.format(parsed) : value
    }
    return ''
  },
}

export const isWhitelistedHelper = (name: string) =>
  Object.prototype.hasOwnProperty.call(bindingHelpers, name)
