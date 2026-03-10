import { useEffect, useMemo, useState } from 'react'
import { Field, TextArea } from '../../../../shared/ui'

type Props<T> = {
  label: string
  value: T
  onValidChange: (next: T) => void
  normalize?: (parsed: unknown) => T
  hint?: string
}

export default function JsonDraftField<T>({ label, value, onValidChange, normalize, hint }: Props<T>) {
  const serializedValue = useMemo(() => JSON.stringify(value, null, 2), [value])
  const [draft, setDraft] = useState(serializedValue)

  useEffect(() => {
    setDraft(serializedValue)
  }, [serializedValue])

  return (
    <Field label={label} hint={hint}>
      <TextArea
        value={draft}
        onChange={(e) => {
          const nextDraft = e.target.value
          setDraft(nextDraft)
          try {
            const parsed = JSON.parse(nextDraft)
            onValidChange(normalize ? normalize(parsed) : (parsed as T))
          } catch {
            // keep draft while JSON is invalid
          }
        }}
      />
    </Field>
  )
}
