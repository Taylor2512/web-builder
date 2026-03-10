import React, { useState } from 'react'

/* ─── PanelTitle ─────────────────────────────────────────────────── */
export function PanelTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
      <span style={{ fontWeight: 700, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
        {children}
      </span>
      {action}
    </div>
  )
}

/* ─── Card ───────────────────────────────────────────────────────── */
export function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: 12,
      ...style,
    }}>
      {children}
    </div>
  )
}

/* ─── Field ──────────────────────────────────────────────────────── */
export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div style={{ display: 'grid', gap: 5 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</label>
        {hint && <span style={{ fontSize: 10, color: 'var(--muted)' }}>{hint}</span>}
      </div>
      {children}
    </div>
  )
}

/* ─── TextInput ──────────────────────────────────────────────────── */
export function TextInput({ style, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{
        width: '100%',
        padding: '7px 10px',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border-2)',
        background: 'rgba(0,0,0,0.28)',
        color: 'var(--text)',
        outline: 'none',
        fontSize: 13,
        boxSizing: 'border-box',
        ...style,
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = 'var(--primary)';
        e.currentTarget.style.boxShadow = '0 0 0 2px var(--primary-glow)';
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = '';
        e.currentTarget.style.boxShadow = '';
        props.onBlur?.(e);
      }}
    />
  )
}

/* ─── TextArea ───────────────────────────────────────────────────── */
export function TextArea({ style, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      style={{
        width: '100%',
        padding: '7px 10px',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border-2)',
        background: 'rgba(0,0,0,0.28)',
        color: 'var(--text)',
        outline: 'none',
        minHeight: 80,
        resize: 'vertical',
        fontSize: 13,
        fontFamily: 'var(--font)',
        boxSizing: 'border-box',
        ...style,
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = 'var(--primary)';
        e.currentTarget.style.boxShadow = '0 0 0 2px var(--primary-glow)';
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = '';
        e.currentTarget.style.boxShadow = '';
        props.onBlur?.(e);
      }}
    />
  )
}

/* ─── GhostButton ────────────────────────────────────────────────── */
export function GhostButton({ style, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const [hov, setHov] = useState(false)
  return (
    <button
      {...props}
      onMouseEnter={(e) => { setHov(true); props.onMouseEnter?.(e) }}
      onMouseLeave={(e) => { setHov(false); props.onMouseLeave?.(e) }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        padding: '6px 10px',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border)',
        background: hov ? 'var(--surface-hover)' : 'transparent',
        color: props.disabled ? 'var(--muted)' : 'var(--text)',
        cursor: props.disabled ? 'not-allowed' : 'pointer',
        fontWeight: 500,
        fontSize: 12,
        whiteSpace: 'nowrap',
        opacity: props.disabled ? 0.5 : 1,
        ...style,
      }}
    >
      {children}
    </button>
  )
}

/* ─── PrimaryButton ──────────────────────────────────────────────── */
export function PrimaryButton({ style, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const [hov, setHov] = useState(false)
  return (
    <button
      {...props}
      onMouseEnter={(e) => { setHov(true); props.onMouseEnter?.(e) }}
      onMouseLeave={(e) => { setHov(false); props.onMouseLeave?.(e) }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        padding: '6px 12px',
        borderRadius: 'var(--radius-sm)',
        border: 'none',
        background: hov ? 'var(--primary-dark)' : 'var(--primary)',
        color: '#fff',
        cursor: props.disabled ? 'not-allowed' : 'pointer',
        fontWeight: 600,
        fontSize: 12,
        opacity: props.disabled ? 0.5 : 1,
        boxShadow: hov ? '0 0 0 3px var(--primary-glow)' : 'none',
        ...style,
      }}
    >
      {children}
    </button>
  )
}

/* ─── DangerButton ───────────────────────────────────────────────── */
export function DangerButton({ style, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const [hov, setHov] = useState(false)
  return (
    <button
      {...props}
      onMouseEnter={(e) => { setHov(true); props.onMouseEnter?.(e) }}
      onMouseLeave={(e) => { setHov(false); props.onMouseLeave?.(e) }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        padding: '7px 12px',
        borderRadius: 'var(--radius-sm)',
        border: `1px solid ${hov ? 'var(--danger)' : 'var(--danger-dim)'}`,
        background: hov ? 'var(--danger-dim)' : 'transparent',
        color: 'var(--danger)',
        cursor: props.disabled ? 'not-allowed' : 'pointer',
        fontWeight: 600,
        fontSize: 12,
        opacity: props.disabled ? 0.4 : 1,
        width: '100%',
        ...style,
      }}
    >
      {children}
    </button>
  )
}

/* ─── IconButton ─────────────────────────────────────────────────── */
export function IconButton({ style, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const [hov, setHov] = useState(false)
  return (
    <button
      {...props}
      onMouseEnter={(e) => { setHov(true); props.onMouseEnter?.(e) }}
      onMouseLeave={(e) => { setHov(false); props.onMouseLeave?.(e) }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 28,
        height: 28,
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border)',
        background: hov ? 'var(--surface-2)' : 'transparent',
        color: 'var(--text)',
        cursor: props.disabled ? 'not-allowed' : 'pointer',
        fontSize: 13,
        padding: 0,
        flexShrink: 0,
        ...style,
      }}
    >
      {props.children}
    </button>
  )
}

/* ─── Badge ──────────────────────────────────────────────────────── */
export function Badge({ children, color = 'default' }: { children: React.ReactNode; color?: 'default' | 'primary' | 'success' | 'warning' | 'danger' }) {
  const colors = {
    default: { bg: 'var(--surface-2)', text: 'var(--text-secondary)' },
    primary: { bg: 'var(--primary-dim)', text: 'var(--primary)' },
    success: { bg: 'var(--success-dim)', text: 'var(--success)' },
    warning: { bg: 'var(--warning-dim)', text: 'var(--warning)' },
    danger:  { bg: 'var(--danger-dim)',  text: 'var(--danger)' },
  }
  const c = colors[color]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 6px', borderRadius: 99,
      background: c.bg, color: c.text,
      fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
    }}>
      {children}
    </span>
  )
}

/* ─── Separator ──────────────────────────────────────────────────── */
export function Separator({ style }: { style?: React.CSSProperties }) {
  return <div style={{ height: 1, background: 'var(--border)', margin: '4px 0', ...style }} />
}

/* ─── StyledSelect ───────────────────────────────────────────────── */
export function StyledSelect({ style, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      style={{
        width: '100%',
        padding: '7px 10px',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border-2)',
        background: 'rgba(0,0,0,0.28)',
        color: 'var(--text)',
        outline: 'none',
        fontSize: 13,
        cursor: 'pointer',
        appearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%238b949e'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 10px center',
        paddingRight: 28,
        boxSizing: 'border-box',
        ...style,
      }}
    />
  )
}

/* ─── ColorInput ─────────────────────────────────────────────────── */
export function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const safeColor = /^#[0-9a-fA-F]{3,8}$/.test(value) ? value : '#000000'
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      <div style={{ position: 'relative', width: 32, height: 32, flexShrink: 0 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 'var(--radius-sm)',
          background: safeColor, border: '2px solid var(--border-2)',
          cursor: 'pointer',
        }} />
        <input
          type='color'
          value={safeColor}
          onChange={(e) => onChange(e.target.value)}
          style={{
            position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%',
            cursor: 'pointer', border: 'none', padding: 0,
          }}
        />
      </div>
      <TextInput
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder='#000 / transparent'
        style={{ flex: 1 }}
      />
    </div>
  )
}

/* ─── Slider ─────────────────────────────────────────────────────── */
export function Slider({ label, value, min = 0, max = 100, step = 1, onChange, unit = 'px' }:
  { label?: string; value: number; min?: number; max?: number; step?: number; onChange: (v: number) => void; unit?: string }) {
  return (
    <div style={{ display: 'grid', gap: 5 }}>
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</label>
          <span style={{ fontSize: 11, color: 'var(--muted)', fontVariantNumeric: 'tabular-nums' }}>{value}{unit}</span>
        </div>
      )}
      <input
        type='range'
        min={min} max={max} step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }}
      />
    </div>
  )
}

/* ─── Toggle ─────────────────────────────────────────────────────── */
export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: 32, height: 18, borderRadius: 99,
          background: checked ? 'var(--primary)' : 'var(--surface-3)',
          position: 'relative', transition: 'background var(--transition)',
          flexShrink: 0,
        }}
      >
        <div style={{
          position: 'absolute', top: 2, left: checked ? 16 : 2,
          width: 14, height: 14, borderRadius: '50%',
          background: '#fff',
          transition: 'left var(--transition)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
        }} />
      </div>
      {label && <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>}
    </label>
  )
}
