export type TipGroup = 'Acciones del sitio' | 'Herramientas y opciones' | 'Panel de control'

export type TipEntry = {
  id: string
  title: string
  desc: string
  cta: string
  group: TipGroup
  tags?: string[]
}

export const IN_APP_TIPS_CATALOG: TipEntry[] = [
  {
    id: 'automations-welcome-flow',
    title: 'Automatiza el flujo de bienvenida',
    desc: 'Configura una secuencia automática para enviar mensajes de bienvenida y seguimiento a nuevos registros.',
    cta: 'Crear automatización',
    group: 'Acciones del sitio',
    tags: ['automations', 'email', 'nuevos leads'],
  },
  {
    id: 'forms-lead-capture',
    title: 'Mejora tus formularios de captación',
    desc: 'Añade validaciones y campos clave para aumentar conversiones en formularios de contacto y registro.',
    cta: 'Editar formulario',
    group: 'Herramientas y opciones',
    tags: ['forms', 'conversion', 'captación'],
  },
  {
    id: 'seo-home-optimization',
    title: 'Optimiza SEO en la página principal',
    desc: 'Define título SEO, meta descripción y encabezados estratégicos para mejorar tu posicionamiento orgánico.',
    cta: 'Ir a ajustes SEO',
    group: 'Panel de control',
    tags: ['seo', 'metadata', 'google'],
  },
  {
    id: 'facebook-ads-sync-pixel',
    title: 'Conecta Facebook Ads con tu sitio',
    desc: 'Vincula tu píxel y eventos clave para medir campañas y optimizar la inversión publicitaria.',
    cta: 'Configurar Facebook Ads',
    group: 'Panel de control',
    tags: ['facebook_ads', 'pixel', 'campañas'],
  },
  {
    id: 'payments-checkout-methods',
    title: 'Activa métodos de pago',
    desc: 'Habilita tarjetas, transferencias u otros proveedores para reducir fricción en el checkout.',
    cta: 'Configurar pagos',
    group: 'Acciones del sitio',
    tags: ['payments', 'checkout', 'ecommerce'],
  },
  {
    id: 'multilingual-site-languages',
    title: 'Publica en varios idiomas',
    desc: 'Agrega idiomas alternativos y revisa traducciones para llegar a audiencias internacionales.',
    cta: 'Gestionar idiomas',
    group: 'Herramientas y opciones',
    tags: ['multilingual', 'traducción', 'internacional'],
  },
]

export function searchTips(query: string, source = IN_APP_TIPS_CATALOG): TipEntry[] {
  const normalizedQuery = query.trim().toLowerCase()

  if (!normalizedQuery) {
    return source
  }

  return source.filter((tip) => {
    const searchableFields = [tip.title, tip.desc, tip.cta, tip.group, ...(tip.tags ?? [])]
      .join(' ')
      .toLowerCase()

    return searchableFields.includes(normalizedQuery)
  })
}
