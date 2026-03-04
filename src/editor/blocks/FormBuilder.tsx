import { useRef } from 'react'
import BlocksPanel from './BlocksPanel'
import Canvas from '../canvas/Canvas'
import Inspector from '../inspector/Inspector'
import { useEditorStore } from '../state/useEditorStore'
import { GhostButton, TextInput } from '../../shared/ui'

export default function FormBuilder() {
  const mode = useEditorStore((s) => s.mode)
  const setMode = useEditorStore((s) => s.setMode)
  const projectName = useEditorStore((s) => s.projectName)
  const setProjectName = useEditorStore((s) => s.setProjectName)
  const setBreakpoint = useEditorStore((s) => s.setBreakpoint)
  const serialize = useEditorStore((s) => s.serialize)
  const hydrate = useEditorStore((s) => s.hydrate)
  const reset = useEditorStore((s) => s.reset)
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <div style={styles.shell}>
      <header style={styles.topbar}>
        <TextInput value={projectName} onChange={(e) => setProjectName(e.target.value)} style={{ minWidth: 260 }} />
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <GhostButton onClick={() => setMode(mode === 'edit' ? 'preview' : 'edit')}>{mode === 'edit' ? 'Preview' : 'Edit'}</GhostButton>
          <GhostButton onClick={() => setBreakpoint('desktop')}>Desktop</GhostButton>
          <GhostButton onClick={() => setBreakpoint('tablet')}>Tablet</GhostButton>
          <GhostButton onClick={() => setBreakpoint('mobile')}>Mobile</GhostButton>
          <GhostButton onClick={() => {
            const blob = new Blob([serialize()], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'web-builder-project.json'
            a.click()
            URL.revokeObjectURL(url)
          }}>Export JSON</GhostButton>
          <GhostButton onClick={() => fileRef.current?.click()}>Import JSON</GhostButton>
          <GhostButton onClick={reset}>Reset</GhostButton>
        </div>
      </header>

      <div style={styles.main}>
        <aside style={styles.left}><BlocksPanel /></aside>
        <section style={styles.center}><Canvas /></section>
        <aside style={styles.right}><Inspector /></aside>
      </div>

      <input
        ref={fileRef}
        type='file'
        accept='application/json'
        style={{ display: 'none' }}
        onChange={async (e) => {
          const file = e.target.files?.[0]
          if (!file) return
          const text = await file.text()
          hydrate(text)
        }}
      />
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  shell: { height: '100vh', display: 'flex', flexDirection: 'column' },
  topbar: { height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 10px', borderBottom: '1px solid var(--border)', background: 'var(--panel)' },
  main: { flex: 1, display: 'grid', gridTemplateColumns: '300px 1fr 360px', minHeight: 0 },
  left: { borderRight: '1px solid var(--border)', background: 'var(--panel)', overflow: 'auto' },
  center: { overflow: 'auto' },
  right: { borderLeft: '1px solid var(--border)', background: 'var(--panel)', overflow: 'auto' },
}
