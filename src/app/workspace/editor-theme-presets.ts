export const EDITOR_THEME_PRESET_IDS = ['bento-high-density'] as const;

export type EditorThemePresetId = (typeof EDITOR_THEME_PRESET_IDS)[number];

export interface EditorThemePreset {
  id: EditorThemePresetId;
  label: string;
  description: string;
  character: 'dense';
}

/**
 * ElectroCMS intentionally exposes one editor visual language.
 * Light/dark/auto remain appearance modes of the same Bento High Density theme;
 * generated frontend/backend project themes stay independent.
 */
export const EDITOR_THEME_PRESETS: readonly EditorThemePreset[] = [
  {
    id: 'bento-high-density',
    label: 'Bento High Density',
    description: 'Compact modular authoring surfaces, strong hierarchy, accessible motion and professional information density.',
    character: 'dense',
  },
];

export function isEditorThemePresetId(value: unknown): value is EditorThemePresetId {
  return value === 'bento-high-density';
}

export function getEditorThemePreset(id: EditorThemePresetId): EditorThemePreset {
  return EDITOR_THEME_PRESETS.find((preset) => preset.id === id) ?? EDITOR_THEME_PRESETS[0]!;
}
