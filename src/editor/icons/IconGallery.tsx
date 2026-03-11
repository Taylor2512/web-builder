import {
  AddElementsIcon,
  AddSectionIcon,
  AppsIcon,
  BusinessIcon,
  CmsIcon,
  DesignIcon,
  MediaIcon,
  PagesIcon,
  SearchActionIcon,
} from './editorShellIcons'

const ICONS = [
  { name: 'AddElementsIcon', Icon: AddElementsIcon },
  { name: 'AddSectionIcon', Icon: AddSectionIcon },
  { name: 'PagesIcon', Icon: PagesIcon },
  { name: 'DesignIcon', Icon: DesignIcon },
  { name: 'AppsIcon', Icon: AppsIcon },
  { name: 'BusinessIcon', Icon: BusinessIcon },
  { name: 'MediaIcon', Icon: MediaIcon },
  { name: 'CmsIcon', Icon: CmsIcon },
  { name: 'SearchActionIcon', Icon: SearchActionIcon },
]

export function IconGallery() {
  return (
    <section style={{ display: 'grid', gap: 16 }}>
      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Editor shell icon gallery</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        {ICONS.map(({ name, Icon }) => (
          <div
            key={name}
            style={{
              border: '1px solid #d8dde8',
              borderRadius: 10,
              padding: 12,
              background: '#ffffff',
              display: 'grid',
              justifyItems: 'center',
              gap: 8,
            }}
          >
            <Icon size={20} title={name} />
            <code style={{ fontSize: 11, color: '#4a5568' }}>{name}</code>
          </div>
        ))}
      </div>
    </section>
  )
}
