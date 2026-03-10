import { useState } from 'react'
import { useEditorStore } from '../state/useEditorStore'

/* ─── Data ────────────────────────────────────────────────── */
const COLOR_THEMES = [
  { name: 'Índigo', colors: ['#6366f1', '#a855f7', '#22d3ee', '#f1f5f9', '#0d1117'] },
  { name: 'Azul',   colors: ['#3b82f6', '#06b6d4', '#6366f1', '#f8fafc', '#0f172a'] },
  { name: 'Verde',  colors: ['#10b981', '#22c55e', '#06b6d4', '#f0fdf4', '#0a0f0a'] },
  { name: 'Rojo',   colors: ['#f43f5e', '#f97316', '#fb923c', '#fff1f2', '#0f0a0a'] },
  { name: 'Ámbar',  colors: ['#f59e0b', '#eab308', '#ea580c', '#fffbeb', '#111'] },
  { name: 'Pizarra', colors: ['#475569', '#64748b', '#94a3b8', '#f8fafc', '#111'] },
]

const HEADING_FONTS = ['Inter', 'Montserrat', 'Playfair Display', 'Poppins', 'Raleway', 'Roboto']
const BODY_FONTS    = ['Inter', 'Lato', 'Merriweather', 'Nunito', 'Open Sans', 'Source Sans Pro']
const RADIUS_OPTS   = [
  { label: 'Ninguno', r: '0px' },
  { label: 'Suave',   r: '4px' },
  { label: 'Medio',   r: '10px' },
  { label: 'Grande',  r: '16px' },
  { label: 'Máximo',  r: '999px' },
]

function FontSelect({
  type,
  value,
  options,
  onSelect,
}: {
  type: 'heading' | 'body'
  value: string
  options: string[]
  onSelect: (font: string) => void
}) {
  return (
    <div style={{
      border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
      background: 'var(--surface)', overflow: 'hidden',
    }}>
      {options.map((font) => (
        <button key={font} type='button' onClick={() => onSelect(font)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            width: '100%', padding: '9px 12px',
            background: value === font ? 'var(--primary-dim)' : 'transparent',
            border: 'none', borderBottom: '1px solid var(--border)',
            color: value === font ? 'var(--primary)' : 'var(--text)',
            cursor: 'pointer', textAlign: 'left', transition: 'background 100ms',
            fontFamily: `'${font}', sans-serif`,
            fontSize: type === 'heading' ? 15 : 13,
            fontWeight: type === 'heading' ? 700 : 400,
          }}
        >
          <span>{font}</span>
          {value === font && <span style={{ fontSize: 12 }}>✓</span>}
        </button>
      ))}
    </div>
  )
}

/* ─── Sub-panel chevron row ───────────────────────────────── */
function NavRow({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      type='button'
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        width: '100%', padding: '13px 16px',
        background: hov ? 'var(--surface-hover)' : 'transparent',
        border: 'none', borderBottom: '1px solid var(--border)',
        color: 'var(--text)', cursor: 'pointer', textAlign: 'left',
        transition: 'background 120ms',
      }}
    >
      <span style={{ fontSize: 17, width: 22, textAlign: 'center', flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 11, color: 'var(--muted)' }}>›</span>
    </button>
  )
}

/* ─── Back header shared by sub-panels ────────────────────── */
function SubPanelHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '0 12px', height: 46, flexShrink: 0,
      borderBottom: '1px solid var(--border)',
      position: 'sticky', top: 0, zIndex: 2,
      background: 'var(--panel)',
    }}>
      <button
        type='button'
        onClick={onBack}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          background: 'none', border: 'none', color: 'var(--text-secondary)',
          cursor: 'pointer', fontSize: 12, padding: '4px 8px', borderRadius: 6,
        }}
      >
        ‹ Volver
      </button>
      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', flex: 1 }}>{title}</span>
    </div>
  )
}

/* ─── Color Theme Sub-panel ───────────────────────────────── */
function ColorThemePanel({ onBack }: { onBack: () => void }) {
  const [activeTheme, setActiveTheme] = useState(0)
  const [customColor, setCustomColor] = useState('#6366f1')
  const [radius, setRadius] = useState('10px')

  const applyTheme = (idx: number) => {
    setActiveTheme(idx)
    const c = COLOR_THEMES[idx].colors
    document.documentElement.style.setProperty('--primary',      c[0])
    document.documentElement.style.setProperty('--primary-dim',  `${c[0]}22`)
    document.documentElement.style.setProperty('--primary-dark', c[0])
    document.documentElement.style.setProperty('--accent',       c[1])
    document.documentElement.style.setProperty('--accent-dim',   `${c[1]}22`)
  }

  const applyCustom = (color: string) => {
    setCustomColor(color)
    document.documentElement.style.setProperty('--primary',      color)
    document.documentElement.style.setProperty('--primary-dim',  `${color}22`)
    document.documentElement.style.setProperty('--primary-dark', color)
  }

  const applyRadius = (r: string) => {
    setRadius(r)
    document.documentElement.style.setProperty('--radius', r)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <SubPanelHeader title='Tema de color' onBack={onBack} />
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>

        {/* Preset swatches */}
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
          Temas predefinidos
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {COLOR_THEMES.map((theme, i) => (
            <button
              key={theme.name}
              type='button'
              onClick={() => applyTheme(i)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 'var(--radius-sm)',
                border: `1px solid ${activeTheme === i ? 'var(--primary)' : 'var(--border)'}`,
                background: activeTheme === i ? 'var(--primary-dim)' : 'var(--surface)',
                cursor: 'pointer', transition: 'all 0.13s',
              }}
            >
              {/* Color dots */}
              <div style={{ display: 'flex', gap: 4 }}>
                {theme.colors.slice(0, 4).map((c, ci) => (
                  <div key={ci} style={{ width: 18, height: 18, borderRadius: 4, background: c, border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }} />
                ))}
              </div>
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', flex: 1, textAlign: 'left' }}>{theme.name}</span>
              {activeTheme === i && <span style={{ fontSize: 12, color: 'var(--primary)' }}>✓</span>}
            </button>
          ))}
        </div>

        {/* Custom color */}
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
          Color personalizado
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
          border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
          background: 'var(--surface)', marginBottom: 20,
        }}>
          <div style={{ position: 'relative', width: 36, height: 36, flexShrink: 0 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: customColor, border: '2px solid rgba(255,255,255,0.15)' }} />
            <input
              type='color' value={customColor}
              onChange={(e) => applyCustom(e.target.value)}
              style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
            />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>Color primario</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{customColor.toUpperCase()}</div>
          </div>
          <button type='button' onClick={() => applyCustom(customColor)}
            style={{ marginLeft: 'auto', fontSize: 11, padding: '5px 10px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--surface-2)', color: 'var(--text)', cursor: 'pointer' }}>
            Aplicar
          </button>
        </div>

        {/* Border radius */}
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
          Bordes redondeados
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 6 }}>
          {RADIUS_OPTS.map((opt) => (
            <button key={opt.label} type='button' onClick={() => applyRadius(opt.r)}
              style={{
                padding: '8px 4px', border: `1px solid ${radius === opt.r ? 'var(--primary)' : 'var(--border)'}`,
                borderRadius: opt.r === '999px' ? 999 : 6,
                background: radius === opt.r ? 'var(--primary-dim)' : 'var(--surface)',
                color: radius === opt.r ? 'var(--primary)' : 'var(--text-secondary)',
                cursor: 'pointer', fontSize: 10, fontWeight: 600, textAlign: 'center',
                transition: 'all 0.12s',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
        <button type='button' onClick={onBack}
          style={{
            width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--primary)', background: 'var(--primary)',
            color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600,
          }}>
          ↺ Cambiar tema de color
        </button>
      </div>
    </div>
  )
}

/* ─── Text Theme Sub-panel ────────────────────────────────── */
function TextThemePanel({ onBack }: { onBack: () => void }) {
  const [headingFont, setHeadingFont] = useState('Inter')
  const [bodyFont,    setBodyFont]    = useState('Inter')

  const applyFont = (type: 'heading' | 'body', font: string) => {
    if (type === 'heading') setHeadingFont(font)
    else setBodyFont(font)
    document.documentElement.style.setProperty(
      type === 'heading' ? '--font-heading' : '--font-body',
      `'${font}', sans-serif`,
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <SubPanelHeader title='Tema de texto' onBack={onBack} />
      <div style={{ flex: 1, overflow: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Preview */}
        <div style={{ padding: '16px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'var(--surface)' }}>
          <div style={{ fontFamily: `'${headingFont}', sans-serif`, fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
            Título de ejemplo
          </div>
          <div style={{ fontFamily: `'${bodyFont}', sans-serif`, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Este es un párrafo de ejemplo con la fuente seleccionada para el cuerpo del texto de tu sitio.
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
            Fuente de encabezados
          </div>
          <FontSelect type='heading' value={headingFont} options={HEADING_FONTS} onSelect={(font) => applyFont('heading', font)} />
        </div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
            Fuente de párrafos
          </div>
          <FontSelect type='body' value={bodyFont} options={BODY_FONTS} onSelect={(font) => applyFont('body', font)} />
        </div>
      </div>

      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
        <button type='button' onClick={onBack}
          style={{
            width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--primary)', background: 'var(--primary)',
            color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600,
          }}>
          ↺ Cambiar tema de texto
        </button>
      </div>
    </div>
  )
}

/* ─── Page Background Sub-panel ──────────────────────────── */
function PageBgPanel({ onBack }: { onBack: () => void }) {
  const BG_PRESETS = [
    { label: 'Oscuro',   bg: '#0d1117' },
    { label: 'Gris',     bg: '#1a1f2e' },
    { label: 'Azul noche', bg: '#0f1729' },
    { label: 'Blanco',   bg: '#ffffff' },
    { label: 'Crema',    bg: '#faf9f6' },
    { label: 'Gris claro', bg: '#f1f5f9' },
  ]
  const [active, setActive] = useState('#0d1117')
  const apply = (bg: string) => {
    setActive(bg)
    document.documentElement.style.setProperty('--bg', bg)
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <SubPanelHeader title='Fondo de la página' onBack={onBack} />
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {BG_PRESETS.map((p) => (
            <button key={p.label} type='button' onClick={() => apply(p.bg)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                padding: '12px', border: `2px solid ${active === p.bg ? 'var(--primary)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-sm)', background: 'var(--surface)',
                cursor: 'pointer', transition: 'all 0.12s',
              }}
            >
              <div style={{ width: '100%', height: 40, borderRadius: 6, background: p.bg, border: '1px solid rgba(255,255,255,0.08)' }} />
              <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500 }}>{p.label}</span>
              {active === p.bg && <span style={{ fontSize: 10, color: 'var(--primary)' }}>✓ Activo</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── Main Design Panel ───────────────────────────────────── */
type SubPanel = 'color' | 'text' | 'background' | null

export default function SiteDesignPanel() {
  const projectName = useEditorStore((s) => s.projectName)
  const [subPanel, setSubPanel] = useState<SubPanel>(null)

  if (subPanel === 'color')      return <ColorThemePanel onBack={() => setSubPanel(null)} />
  if (subPanel === 'text')       return <TextThemePanel  onBack={() => setSubPanel(null)} />
  if (subPanel === 'background') return <PageBgPanel     onBack={() => setSubPanel(null)} />

  /* Current primary colors preview dots */
  const previewColors = ['var(--primary)', 'var(--accent)', 'var(--success)', 'var(--warning)', 'var(--danger)']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'auto' }}>

      {/* Site theme card */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 4 }}>{projectName || 'Mi sitio'}</div>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 12 }}>Tema global del sitio</div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '12px',
          border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
          background: 'var(--surface)',
        }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {previewColors.map((c, i) => (
              <div key={i} style={{ width: 20, height: 20, borderRadius: 4, background: c, border: '1px solid rgba(255,255,255,0.1)' }} />
            ))}
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', flex: 1 }}>Tema activo</span>
        </div>
      </div>

      {/* Navigation items */}
      <div style={{ flex: 1 }}>
        <div style={{ padding: '12px 16px 6px', fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Personaliza el diseño
        </div>
        <NavRow icon='🎨' label='Tema de color'       onClick={() => setSubPanel('color')} />
        <NavRow icon='T'  label='Tema de texto'        onClick={() => setSubPanel('text')} />
        <NavRow icon='🖼' label='Fondo de la página'   onClick={() => setSubPanel('background')} />
      </div>
    </div>
  )
}
