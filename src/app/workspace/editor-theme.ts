import { useMediaQuery } from './use-media-query';
import type { EditorThemeMode } from './workspace-preferences';

export type ResolvedEditorTheme = 'light' | 'dark';

export function resolveEditorTheme(
  mode: EditorThemeMode,
  systemPrefersDark: boolean,
): ResolvedEditorTheme {
  if (mode === 'auto') return systemPrefersDark ? 'dark' : 'light';
  return mode;
}

export function useResolvedEditorTheme(mode: EditorThemeMode): ResolvedEditorTheme {
  const systemPrefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  return resolveEditorTheme(mode, systemPrefersDark);
}
