import { isWorkspaceId, WORKSPACE_IDS, type WorkspaceId } from '../routing/workspaces';
import { isEditorThemePresetId, type EditorThemePresetId } from './editor-theme-presets';

export const WORKSPACE_PREFERENCES_SCHEMA_VERSION = 1 as const;

export type NavigationPosition = 'left' | 'right';
export type NavigationDisplayMode = 'icons' | 'labels' | 'both';
export type WorkspaceDensity = 'compact' | 'comfortable';
export type EditorThemeMode = 'light' | 'dark' | 'auto';

export interface WorkspacePreferences {
  schemaVersion: typeof WORKSPACE_PREFERENCES_SCHEMA_VERSION;
  navigationPosition: NavigationPosition;
  navigationWidth: number;
  navigationCollapsed: boolean;
  navigationDisplayMode: NavigationDisplayMode;
  workspaceOrder: WorkspaceId[];
  density: WorkspaceDensity;
  lastWorkspace: WorkspaceId;
  editorThemeMode: EditorThemeMode;
  editorThemePresetId: EditorThemePresetId;
}

export const MIN_NAVIGATION_WIDTH = 196;
export const MAX_NAVIGATION_WIDTH = 360;

export function clampNavigationWidth(width: number): number {
  return Math.round(Math.min(MAX_NAVIGATION_WIDTH, Math.max(MIN_NAVIGATION_WIDTH, width)));
}

export function createDefaultWorkspacePreferences(): WorkspacePreferences {
  return {
    schemaVersion: WORKSPACE_PREFERENCES_SCHEMA_VERSION,
    navigationPosition: 'left',
    navigationWidth: 232,
    navigationCollapsed: false,
    navigationDisplayMode: 'both',
    workspaceOrder: [...WORKSPACE_IDS],
    density: 'compact',
    lastWorkspace: 'editor',
    editorThemeMode: 'auto',
    editorThemePresetId: 'studio-pro',
  };
}

function isExactWorkspaceOrder(value: unknown): value is WorkspaceId[] {
  if (!Array.isArray(value) || value.length !== WORKSPACE_IDS.length || !value.every(isWorkspaceId)) {
    return false;
  }
  return new Set(value).size === WORKSPACE_IDS.length && WORKSPACE_IDS.every((id) => value.includes(id));
}

export function normalizeWorkspacePreferences(input: unknown): WorkspacePreferences {
  const defaults = createDefaultWorkspacePreferences();
  if (input === null || typeof input !== 'object' || Array.isArray(input)) return defaults;

  const value = input as Record<string, unknown>;
  if (value.schemaVersion !== WORKSPACE_PREFERENCES_SCHEMA_VERSION) return defaults;

  return {
    schemaVersion: WORKSPACE_PREFERENCES_SCHEMA_VERSION,
    navigationPosition:
      value.navigationPosition === 'right' || value.navigationPosition === 'left'
        ? value.navigationPosition
        : defaults.navigationPosition,
    navigationWidth:
      typeof value.navigationWidth === 'number' && Number.isFinite(value.navigationWidth)
        ? clampNavigationWidth(value.navigationWidth)
        : defaults.navigationWidth,
    navigationCollapsed:
      typeof value.navigationCollapsed === 'boolean'
        ? value.navigationCollapsed
        : defaults.navigationCollapsed,
    navigationDisplayMode:
      value.navigationDisplayMode === 'icons' || value.navigationDisplayMode === 'labels' || value.navigationDisplayMode === 'both'
        ? value.navigationDisplayMode
        : defaults.navigationDisplayMode,
    workspaceOrder: isExactWorkspaceOrder(value.workspaceOrder) ? [...value.workspaceOrder] : defaults.workspaceOrder,
    density: value.density === 'comfortable' || value.density === 'compact' ? value.density : defaults.density,
    lastWorkspace: isWorkspaceId(value.lastWorkspace) ? value.lastWorkspace : defaults.lastWorkspace,
    editorThemeMode:
      value.editorThemeMode === 'light' || value.editorThemeMode === 'dark' || value.editorThemeMode === 'auto'
        ? value.editorThemeMode
        : defaults.editorThemeMode,
    editorThemePresetId: isEditorThemePresetId(value.editorThemePresetId)
      ? value.editorThemePresetId
      : defaults.editorThemePresetId,
  };
}
