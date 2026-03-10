import { loadRemoteBuilderConfig } from '../api/jsonServer'
import type { Breakpoint, NodeType } from '../types/schema'

export type BuilderConfig = {
  breakpoints: Record<Breakpoint, { width: number }>
  grid: { size: number; show: boolean; snap: boolean }
  snap: { grid: boolean; guides: boolean; spacing: boolean; threshold: number }
  blocks: { enabled: NodeType[]; defaults: Partial<Record<NodeType, Record<string, unknown>>> }
  constraints: {
    allowedParents: Partial<Record<NodeType, NodeType[]>>
    maxChildren: Partial<Record<NodeType, number>>
  }
  themeTokens: { radius: number; spacing: number; surface: string; primary: string }
}

const fallbackConfig: BuilderConfig = {
  breakpoints: {
    desktop: { width: 1200 },
    tablet: { width: 900 },
    mobile: { width: 430 },
  },
  grid: { size: 8, show: true, snap: true },
  snap: { grid: true, guides: true, spacing: false, threshold: 6 },
  blocks: {
    enabled: ['section', 'container', 'grid', 'spacer', 'divider', 'text', 'image', 'button', 'link', 'navbar', 'form', 'dateInput', 'searchSelect', 'dataTable', 'searchBar', 'repeater'],
    defaults: {},
  },
  constraints: {
    allowedParents: {},
    maxChildren: { page: 100, section: 30, container: 30, grid: 40 },
  },
  themeTokens: { radius: 14, spacing: 8, surface: 'rgba(255,255,255,0.04)', primary: '#7c3aed' },
}

const isBool = (value: unknown): value is boolean => typeof value === 'boolean'
const isNum = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)

export const validateBuilderConfig = (raw: unknown): BuilderConfig => {
  if (!raw || typeof raw !== 'object') {
    console.warn('[builder-config] Invalid config shape, using defaults.')
    return fallbackConfig
  }

  const input = raw as Partial<BuilderConfig>

  const width = (bp: Breakpoint) => (isNum(input.breakpoints?.[bp]?.width) ? input.breakpoints[bp].width : fallbackConfig.breakpoints[bp].width)

  const safeConfig: BuilderConfig = {
    breakpoints: {
      desktop: { width: width('desktop') },
      tablet: { width: width('tablet') },
      mobile: { width: width('mobile') },
    },
    grid: {
      size: isNum(input.grid?.size) ? input.grid.size : fallbackConfig.grid.size,
      show: isBool(input.grid?.show) ? input.grid.show : fallbackConfig.grid.show,
      snap: isBool(input.grid?.snap) ? input.grid.snap : fallbackConfig.grid.snap,
    },
    snap: {
      grid: isBool(input.snap?.grid) ? input.snap.grid : fallbackConfig.snap.grid,
      guides: isBool(input.snap?.guides) ? input.snap.guides : fallbackConfig.snap.guides,
      spacing: isBool(input.snap?.spacing) ? input.snap.spacing : fallbackConfig.snap.spacing,
      threshold: isNum(input.snap?.threshold) ? input.snap.threshold : fallbackConfig.snap.threshold,
    },
    blocks: {
      enabled: Array.isArray(input.blocks?.enabled) && input.blocks?.enabled.length ? (input.blocks.enabled.filter(Boolean) as NodeType[]) : fallbackConfig.blocks.enabled,
      defaults: input.blocks?.defaults ?? {},
    },
    constraints: {
      allowedParents: input.constraints?.allowedParents ?? fallbackConfig.constraints.allowedParents,
      maxChildren: input.constraints?.maxChildren ?? fallbackConfig.constraints.maxChildren,
    },
    themeTokens: {
      radius: isNum(input.themeTokens?.radius) ? input.themeTokens.radius : fallbackConfig.themeTokens.radius,
      spacing: isNum(input.themeTokens?.spacing) ? input.themeTokens.spacing : fallbackConfig.themeTokens.spacing,
      surface: typeof input.themeTokens?.surface === 'string' ? input.themeTokens.surface : fallbackConfig.themeTokens.surface,
      primary: typeof input.themeTokens?.primary === 'string' ? input.themeTokens.primary : fallbackConfig.themeTokens.primary,
    },
  }

  return safeConfig
}

export const loadBuilderConfig = async (): Promise<BuilderConfig> => {
  try {
    const remote = await loadRemoteBuilderConfig()
    return validateBuilderConfig(remote)
  } catch {
    // fallback to static config for local-only usage
  }

  try {
    const response = await fetch('/builder.config.json')
    if (!response.ok) {
      console.warn('[builder-config] Could not fetch /builder.config.json, using defaults.')
      return fallbackConfig
    }
    const json: unknown = await response.json()
    return validateBuilderConfig(json)
  } catch {
    console.warn('[builder-config] Failed to load config, using defaults.')
    return fallbackConfig
  }
}

export const defaultBuilderConfig = fallbackConfig
