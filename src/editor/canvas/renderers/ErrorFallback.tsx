import type { CSSProperties } from 'react'

const cardStyle: CSSProperties = {
  border: '1px solid #fecaca',
  borderRadius: 8,
  background: '#fef2f2',
  color: '#991b1b',
  padding: '10px 12px',
  fontSize: 12,
  display: 'grid',
  gap: 4,
}

export function ErrorFallback({ title, issues }: { title: string; issues: string[] }) {
  return (
    <div style={cardStyle}>
      <strong>{title}</strong>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        {issues.map((issue) => (
          <li key={issue}>{issue}</li>
        ))}
      </ul>
    </div>
  )
}
