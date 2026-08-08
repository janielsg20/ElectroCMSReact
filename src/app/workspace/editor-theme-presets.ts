export const EDITOR_THEME_PRESET_IDS = [
  'high-density',
  'bento-grid',
  'minimal-clean',
  'material-expressive',
  'saas-dashboard',
  'enterprise-corporate',
  'glassmorphism',
  'sophisticated-dark',
  'monochrome-pro',
  'developer-console',
] as const;

export type EditorThemePresetId = (typeof EDITOR_THEME_PRESET_IDS)[number];

export interface EditorThemePreset {
  id: EditorThemePresetId;
  label: string;
  description: string;
  character: 'dense' | 'spacious' | 'expressive' | 'technical';
}

export const EDITOR_THEME_PRESETS: readonly EditorThemePreset[] = [
  { id: 'high-density', label: 'High Density', description: 'Maximum information density with compact professional panels.', character: 'dense' },
  { id: 'bento-grid', label: 'Bento Grid', description: 'Compact modular surfaces with stronger card grouping.', character: 'dense' },
  { id: 'minimal-clean', label: 'Minimal Clean', description: 'Reduced chrome and quiet neutral surfaces.', character: 'spacious' },
  { id: 'material-expressive', label: 'Material Expressive', description: 'Rounded expressive controls and elevated surfaces.', character: 'expressive' },
  { id: 'saas-dashboard', label: 'SaaS Dashboard', description: 'Metric-oriented admin shell with crisp panel hierarchy.', character: 'dense' },
  { id: 'enterprise-corporate', label: 'Enterprise / Corporate', description: 'Conservative high-information administration styling.', character: 'dense' },
  { id: 'glassmorphism', label: 'Glassmorphism', description: 'Translucent layered surfaces while retaining dense layout.', character: 'expressive' },
  { id: 'sophisticated-dark', label: 'Sophisticated Dark', description: 'Editorial dark treatment with restrained contrast.', character: 'expressive' },
  { id: 'monochrome-pro', label: 'Monochrome Pro', description: 'Grayscale professional chrome with a single accent.', character: 'technical' },
  { id: 'developer-console', label: 'Developer Console', description: 'Technical console-inspired panels and monospace accents.', character: 'technical' },
];

export function isEditorThemePresetId(value: unknown): value is EditorThemePresetId {
  return typeof value === 'string' && EDITOR_THEME_PRESET_IDS.includes(value as EditorThemePresetId);
}

export function getEditorThemePreset(id: EditorThemePresetId): EditorThemePreset {
  return EDITOR_THEME_PRESETS.find((preset) => preset.id === id) ?? EDITOR_THEME_PRESETS[0]!;
}
