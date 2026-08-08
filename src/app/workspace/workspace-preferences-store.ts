import { createContext, useContext } from 'react';
import type { WorkspaceId } from '../routing/workspaces';
import type {
  NavigationPosition,
  WorkspacePreferences,
} from './workspace-preferences';

export interface WorkspacePreferencesState {
  preferences: WorkspacePreferences;
  setNavigationPosition(position: NavigationPosition): void;
  setNavigationWidth(width: number): void;
  setNavigationCollapsed(collapsed: boolean): void;
  moveWorkspace(workspaceId: WorkspaceId, direction: -1 | 1): void;
  setLastWorkspace(workspaceId: WorkspaceId): void;
  reset(): void;
}

export const WorkspacePreferencesContext = createContext<WorkspacePreferencesState | null>(null);

export function useWorkspacePreferences(): WorkspacePreferencesState {
  const value = useContext(WorkspacePreferencesContext);
  if (!value) throw new Error('useWorkspacePreferences must be used inside WorkspacePreferencesProvider.');
  return value;
}
