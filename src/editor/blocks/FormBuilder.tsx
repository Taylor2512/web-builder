import { useEffect, useRef, useState } from 'react'
import BlocksPanel from './BlocksPanel'
import Canvas from '../canvas/Canvas'
import Inspector from '../inspector/Inspector'
import { useEditorStore } from '../state/useEditorStore'
import { GhostButton, TextInput } from '../../shared/ui'
import { loadBuilderConfig } from '../config/loadBuilderConfig'
import FlowStudio from '../flows/FlowStudio'

export default function FormBuilder() {
  const mode = useEditorStore((s) => s.mode)
  const setMode = useEditorStore((s) => s.setMode)
  const projectName = useEditorStore((s) => s.projectName)
  const setProjectName = useEditorStore((s) => s.setProjectName)
  const setBreakpoint = useEditorStore((s) => s.setBreakpoint)
  const serialize = useEditorStore((s) => s.serialize)
  const hydrate = useEditorStore((s) => s.hydrate)
  const reset = useEditorStore((s) => s.reset)
  const setBuilderConfig = useEditorStore((s) => s.setBuilderConfig)
  const builderConfig = useEditorStore((s) => s.builderConfig)
  const pages = useEditorStore((s) => s.site.pages)
  const activePageId = useEditorStore((s) => s.site.activePageId)
  const addPage = useEditorStore((s) => s.addPage)
  const selectPage = useEditorStore((s) => s.selectPage)
  const updatePage = useEditorStore((s) => s.updatePage)
  const removePage = useEditorStore((s) => s.removePage)
  const fileRef = useRef<HTMLInputElement>(null)
  const [workspace, setWorkspace] = useState<'pages' | 'flows'>('pages')

  useEffect(() => {
    loadBuilderConfig().then((config) => {
      setBuilderConfig(config)
      document.documentElement.style.setProperty('--radius', `${config.themeTokens.radius}px`)
      document.documentElement.style.setProperty('--surface', config.themeTokens.surface)
      document.documentElement.style.setProperty('--primary', config.themeTokens.primary)
    })
  }, [setBuilderConfig])

  const activePage = pages.find((page) => page.id === activePageId)

  return (
    <div style={styles.shell}>
      <header style={styles.topbar}>
        <TextInput value={projectName} onChange={(e) => setProjectName(e.target.value)} style={{ minWidth: 220 }} />
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <GhostButton onClick={() => setWorkspace('pages')} style={{ background: workspace === 'pages' ? 'var(--surface-2)' : undefined }}>Pages</GhostButton>
          <GhostButton onClick={() => setWorkspace('flows')} style={{ background: workspace === 'flows' ? 'var(--surface-2)' : undefined }}>Flows</GhostButton>

          {workspace === 'pages' && (
            <>
              <select value={activePageId} onChange={(e) => selectPage(e.target.value)}>
                {pages.map((page) => <option key={page.id} value={page.id}>{page.name} ({page.path})</option>)}
              </select>
              <GhostButton onClick={() => addPage(`Page ${pages.length + 1}`, `/page-${pages.length + 1}`)}>+ Add Page</GhostButton>
              {activePage && (
                <>
                  <TextInput value={activePage.name} onChange={(e) => updatePage(activePage.id, { name: e.target.value })} style={{ width: 120 }} />
                  <TextInput value={activePage.path} onChange={(e) => updatePage(activePage.id, { path: e.target.value })} style={{ width: 120 }} />
                  <GhostButton onClick={() => removePage(activePage.id)} disabled={pages.length <= 1}>Delete Page</GhostButton>
                </>
              )}
            </>
          )}

          <GhostButton onClick={() => setMode(mode === 'edit' ? 'preview' : 'edit')} disabled={workspace === 'flows'}>{mode === 'edit' ? 'Preview' : 'Edit'}</GhostButton>
          <GhostButton onClick={() => setBreakpoint('desktop')}>Desktop ({builderConfig.breakpoints.desktop.width}px)</GhostButton>
          <GhostButton onClick={() => setBreakpoint('tablet')}>Tablet ({builderConfig.breakpoints.tablet.width}px)</GhostButton>
          <GhostButton onClick={() => setBreakpoint('mobile')}>Mobile ({builderConfig.breakpoints.mobile.width}px)</GhostButton>
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
        {workspace === 'pages' ? (
          <>
            <aside style={styles.left}><BlocksPanel /></aside>
            <section style={styles.center}><Canvas /></section>
            <aside style={styles.right}><Inspector /></aside>
          </>
        ) : (
          <section style={{ gridColumn: '1 / -1', overflow: 'auto' }}><FlowStudio /></section>
        )}
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
  topbar: { minHeight: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '8px 10px', borderBottom: '1px solid var(--border)', background: 'var(--panel)' },
  main: { flex: 1, display: 'grid', gridTemplateColumns: '300px 1fr 360px', minHeight: 0 },
  left: { borderRight: '1px solid var(--border)', background: 'var(--panel)', overflow: 'auto' },
  center: { overflow: 'auto' },
  right: { borderLeft: '1px solid var(--border)', background: 'var(--panel)', overflow: 'auto' },
}
