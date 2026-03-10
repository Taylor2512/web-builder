import { useState } from 'react'
import { useEditorStore } from '../state/useEditorStore'

/* ─── Theme presets ─────────────────────────────────────── */
const THEME_PRESETS = [
  { name: 'Indigo', primary: '#6366f1', secondary: '#a855f7' },
  { name: 'Blue', primary: '#3b82f6', secondary: '#06b6d4' },
  { name: 'Emerald', primary: '#10b981', secondary: '#22c55e' },
  { name: 'Rose', primary: '#f43f5e', secondary: '#f97316' },
  { name: 'Amber', primary: '#f59e0b', secondary: '#eab308' },
  { name: 'Slate', primary: '#475569', secondary: '#64748b' },
]

const HEADING_FONTS = ['Inter', 'Montserrat', 'Playfair Display', 'Poppins', 'Raleway', 'Roboto']
const BODY_FONTS = ['Inter', 'Lato', 'Merriweather', 'Nunito', 'Open Sans', 'Source Sans Pro']

export default function SiteDesignPanel() {
  const [primaryColor, setPrimaryColor] = useState(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#6366f1',
  )
  const [headingFont, setHeadingFont] = useState('Inter')
  const [bodyFont, setBodyFont] = useState('Inter')
  const projectName = useEditorStore((s) => s.projectName)

  const applyColor = (color: string) => {
    setPrimaryColor(color)
    document.documentElement.style.setProperty('--primary', color)
    // Derive dim variant
    document.documentElement.style.setProperty('--primary-dim', `${color}22`)
    document.documentElement.style.setProperty('--primary-dark', color)
  }

  const applyFont = (type: 'heading' | 'body', font: string) => {
    if (type === 'heading') setHeadingFont(font)
    else setBodyFont(font)
    // Apply immediately via CSS var
    document.documentElement.style.setProperty(
      type === 'heading' ? '--font-heading' : '--font-body',
      `'${font}', sans-serif`,
    )
  }

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--muted)', textTransform: 'uppercase', padding: '14px 14px 8px' }}>
      {children}
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'auto' }}>
      {/* Project name preview */}
      <div style={{ padding: '14px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 2 }}>{projectName}</div>
        <div style={{ fontSize: 11, color: 'var(--muted)' }}>Tema global del sitio</div>
      </div>

      {/* Color palette */}
      <SectionTitle>Tema de color</SectionTitle>
      <div style={{ padding: '0 14px 14px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {THEME_PRESETS.map((preset) => (
          <button
            key={preset.name}
            onClick={() => applyColor(preset.primary)}
            title={preset.name}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: `linear-gradient(135deg, ${preset.primary}, ${preset.secondary})`,
              border: primaryColor === preset.primary ? '3px solid var(--text)' : '3px solid transparent',
              cursor: 'pointer', flexShrink: 0,
              boxShadow: primaryColor === preset.primary ? '0 0 0 2px var(--primary)' : 'none',
              transition: 'all 0.15s',
            }}
          />
        ))}
      </div>

      {/* Custom color */}
      <div style={{ padding: '0 14px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="color"
          value={primaryColor}
          onChange={(e) => applyColor(e.target.value)}
          style={{ width: 32, height: 32, padding: 0, border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', background: 'none' }}
        />
        <div>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>Color personalizado</div>
          <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'monospace' }}>{primaryColor}</div>
        </div>
      </div>

      <div style={{ height: 1, background: 'var(--border)', margin: '0 14px' }} />

      {/* Heading font */}
      <SectionTitle>Fuente de encabezados</SectionTitle>
      <div style={{ padding: '0 14px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {HEADING_FONTS.map((font) => (
          <button
            key={font}
            onClick={() => applyFont('heading', font)}
            style={{
              padding: '8px 10px', borderRadius: 6, cursor: 'pointer', textAlign: 'left',
              border: `1px solid ${headingFont === font ? 'var(--primary)' : 'transparent'}`,
              background: headingFont === font ? 'var(--primary-dim)' : 'transparent',
              color: headingFont === font ? 'var(--primary)' : 'var(--text)',
              fontFamily: `'${font}', sans-serif`,
              fontSize: 14, fontWeight: 600,
              transition: 'all 0.12s',
            }}
          >
            {font}
          </button>
        ))}
      </div>

      <div style={{ height: 1, background: 'var(--border)', margin: '0 14px' }} />

      {/* Body font */}
      <SectionTitle>Fuente de cuerpo</SectionTitle>
      <div style={{ padding: '0 14px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {BODY_FONTS.map((font) => (
          <button
            key={font}
            onClick={() => applyFont('body', font)}
            style={{
              padding: '8px 10px', borderRadius: 6, cursor: 'pointer', textAlign: 'left',
              border: `1px solid ${bodyFont === font ? 'var(--primary)' : 'transparent'}`,
              background: bodyFont === font ? 'var(--primary-dim)' : 'transparent',
              color: bodyFont === font ? 'var(--primary)' : 'var(--text)',
              fontFamily: `'${font}', sans-serif`,
              fontSize: 13,
              transition: 'all 0.12s',
            }}
          >
            {font}
          </button>
        ))}
      </div>

      <div style={{ height: 1, background: 'var(--border)', margin: '0 14px' }} />

      {/* Spacing scale */}
      <SectionTitle>Bordes redondeados</SectionTitle>
      <div style={{ padding: '0 14px 16px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {[{ label: 'Ninguno', r: '0px' }, { label: 'Suave', r: '4px' }, { label: 'Medio', r: '8px' }, { label: 'Grande', r: '16px' }, { label: 'Círculo', r: '999px' }].map((opt) => (
          <button
            key={opt.label}
            onClick={() => document.documentElement.style.setProperty('--radius', opt.r)}
            style={{
              padding: '6px 10px', border: '1px solid var(--border)', borderRadius: opt.r,
              background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer',
              fontSize: 11, transition: 'all 0.12s',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
