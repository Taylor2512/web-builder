export type Theme = {
  id: string
  name: string
  vars: Record<string, string>
  defaults: {
    section?: Record<string, string>
    text?: Record<string, string>
    button?: Record<string, string>
  }
}

export const winx: Theme = {
  id: 'winx',
  name: 'Winx-like',
  vars: {
    '--bg': '#0b1220',
    '--panel': '#0f1724',
    '--muted': '#9aa4b2',
    '--accent': '#3ddc84',
    '--accent-2': '#2fb06f',
    '--surface': '#0e1622',
  },
  defaults: {
    section: { padding: '12px', background: 'transparent' },
    text: { color: '#e6eef8', fontSize: '14px' },
    button: { background: '#3ddc84', color: '#051418', padding: '8px 12px', borderRadius: '6px' },
  },
}

export const wordpressish: Theme = {
  id: 'wordpress',
  name: 'WordPress-ish',
  vars: {
    '--bg': '#ffffff',
    '--panel': '#f3f4f6',
    '--muted': '#6b7280',
    '--accent': '#21759b',
    '--accent-2': '#1e6a8b',
    '--surface': '#ffffff',
  },
  defaults: {
    section: { padding: '12px', background: '#ffffff' },
    text: { color: '#111827', fontSize: '14px' },
    button: { background: '#21759b', color: '#fff', padding: '8px 12px', borderRadius: '6px' },
  },
}

export const themes: Theme[] = [winx, wordpressish]

export function applyThemeVars(t: Theme) {
  const root = document.documentElement
  Object.entries(t.vars).forEach(([k, v]) => root.style.setProperty(k, v))
}
