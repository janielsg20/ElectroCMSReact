import { isWorkspaceId, WORKSPACE_IDS, type WorkspaceId } from '../routing/workspaces';

export const WORKSPACE_PREFERENCES_SCHEMA_VERSION = 2 as const;

export type NavigationPosition = 'left' | 'right';
export type NavigationDisplayMode = 'both';
export type WorkspaceDensity = 'compact';

export interface WorkspacePreferences {
  schemaVersion: typeof WORKSPACE_PREFERENCES_SCHEMA_VERSION;
  navigationPosition: NavigationPosition;
  navigationWidth: number;
  navigationCollapsed: boolean;
  navigationDisplayMode: NavigationDisplayMode;
  workspaceOrder: WorkspaceId[];
  density: WorkspaceDensity;
  lastWorkspace: WorkspaceId;
}

export const MIN_NAVIGATION_WIDTH = 208;
export const MAX_NAVIGATION_WIDTH = 344;

export function clampNavigationWidth(width: number): number {
  return Math.round(Math.min(MAX_NAVIGATION_WIDTH, Math.max(MIN_NAVIGATION_WIDTH, width)));
}

export function createDefaultWorkspacePreferences(): WorkspacePreferences {
  return {
    schemaVersion: WORKSPACE_PREFERENCES_SCHEMA_VERSION,
    navigationPosition: 'left',
    navigationWidth: 236,
    navigationCollapsed: false,
    navigationDisplayMode: 'both',
    workspaceOrder: [...WORKSPACE_IDS],
    density: 'compact',
    lastWorkspace: 'editor',
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
  // Schema v1 is migrated in-place: obsolete theme, preset, density and
  // label-only navigation fields are intentionally ignored.
  if (value.schemaVersion !== 1 && value.schemaVersion !== WORKSPACE_PREFERENCES_SCHEMA_VERSION) {
    return defaults;
  }

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
    navigationDisplayMode: 'both',
    workspaceOrder: isExactWorkspaceOrder(value.workspaceOrder) ? [...value.workspaceOrder] : defaults.workspaceOrder,
    density: 'compact',
    lastWorkspace: isWorkspaceId(value.lastWorkspace) ? value.lastWorkspace : defaults.lastWorkspace,
  };
}
