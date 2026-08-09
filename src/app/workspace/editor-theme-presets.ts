export const EDITOR_THEME_PRESET_IDS = ['studio-pro'] as const;

export type EditorThemePresetId = (typeof EDITOR_THEME_PRESET_IDS)[number];

export interface EditorThemePreset {
  id: EditorThemePresetId;
  label: string;
  description: string;
  character: 'professional';
}

/**
 * ElectroCMS exposes one editor visual language: Studio Pro.
 * Light/dark/auto are appearance modes of the same authoring system;
 * generated frontend/backend project themes remain independent.
 */
export const EDITOR_THEME_PRESETS: readonly EditorThemePreset[] = [
  {
    id: 'studio-pro',
    label: 'Studio Pro',
    description: 'Professional canvas-first visual builder with compact desktop chrome and touch-first mobile sheets.',
    character: 'professional',
  },
];

export function isEditorThemePresetId(value: unknown): value is EditorThemePresetId {
  return value === 'studio-pro';
}

export function getEditorThemePreset(id: EditorThemePresetId): EditorThemePreset {
  return EDITOR_THEME_PRESETS.find((preset) => preset.id === id) ?? EDITOR_THEME_PRESETS[0]!;
}
