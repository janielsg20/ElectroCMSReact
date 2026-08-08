import { useCallback, useMemo, useState, type ReactNode } from 'react';
import type { WorkspaceId } from '../routing/workspaces';
import type { EditorThemePresetId } from './editor-theme-presets';
import {
  BrowserWorkspacePreferencesRepository,
  type WorkspacePreferencesRepository,
} from './workspace-preferences-repository';
import {
  clampNavigationWidth,
  createDefaultWorkspacePreferences,
  type EditorThemeMode,
  type NavigationDisplayMode,
  type NavigationPosition,
  type WorkspaceDensity,
  type WorkspacePreferences,
} from './workspace-preferences';
import { WorkspacePreferencesContext, type WorkspacePreferencesState } from './workspace-preferences-store';

export interface WorkspacePreferencesProviderProps {
  children: ReactNode;
  repository?: WorkspacePreferencesRepository;
}

export function WorkspacePreferencesProvider({
  children,
  repository: repositoryProp,
}: WorkspacePreferencesProviderProps) {
  const repository = useMemo(
    () => repositoryProp ?? new BrowserWorkspacePreferencesRepository(),
    [repositoryProp],
  );
  const [preferences, setPreferences] = useState<WorkspacePreferences>(() => repository.load());

  const commit = useCallback(
    (updater: (current: WorkspacePreferences) => WorkspacePreferences) => {
      setPreferences((current) => {
        const next = updater(current);
        repository.save(next);
        return next;
      });
    },
    [repository],
  );

  const setNavigationPosition = useCallback(
    (navigationPosition: NavigationPosition) => commit((current) => ({ ...current, navigationPosition })),
    [commit],
  );
  const setNavigationWidth = useCallback(
    (navigationWidth: number) => commit((current) => ({ ...current, navigationWidth: clampNavigationWidth(navigationWidth) })),
    [commit],
  );
  const setNavigationCollapsed = useCallback(
    (navigationCollapsed: boolean) => commit((current) => ({ ...current, navigationCollapsed })),
    [commit],
  );
  const setNavigationDisplayMode = useCallback(
    (navigationDisplayMode: NavigationDisplayMode) => commit((current) => ({ ...current, navigationDisplayMode })),
    [commit],
  );
  const moveWorkspace = useCallback(
    (workspaceId: WorkspaceId, direction: -1 | 1) => {
      commit((current) => {
        const from = current.workspaceOrder.indexOf(workspaceId);
        const to = from + direction;
        if (from < 0 || to < 0 || to >= current.workspaceOrder.length) return current;
        const workspaceOrder = [...current.workspaceOrder];
        const [item] = workspaceOrder.splice(from, 1);
        if (!item) return current;
        workspaceOrder.splice(to, 0, item);
        return { ...current, workspaceOrder };
      });
    },
    [commit],
  );
  const setDensity = useCallback((density: WorkspaceDensity) => commit((current) => ({ ...current, density })), [commit]);
  const setLastWorkspace = useCallback((lastWorkspace: WorkspaceId) => commit((current) => ({ ...current, lastWorkspace })), [commit]);
  const setEditorThemeMode = useCallback((editorThemeMode: EditorThemeMode) => commit((current) => ({ ...current, editorThemeMode })), [commit]);
  const setEditorThemePresetId = useCallback((editorThemePresetId: EditorThemePresetId) => commit((current) => ({ ...current, editorThemePresetId })), [commit]);
  const reset = useCallback(() => {
    const defaults = createDefaultWorkspacePreferences();
    repository.save(defaults);
    setPreferences(defaults);
  }, [repository]);

  const value = useMemo<WorkspacePreferencesState>(
    () => ({
      preferences,
      setNavigationPosition,
      setNavigationWidth,
      setNavigationCollapsed,
      setNavigationDisplayMode,
      moveWorkspace,
      setDensity,
      setLastWorkspace,
      setEditorThemeMode,
      setEditorThemePresetId,
      reset,
    }),
    [
      moveWorkspace,
      preferences,
      reset,
      setDensity,
      setEditorThemeMode,
      setEditorThemePresetId,
      setLastWorkspace,
      setNavigationCollapsed,
      setNavigationDisplayMode,
      setNavigationPosition,
      setNavigationWidth,
    ],
  );

  return <WorkspacePreferencesContext.Provider value={value}>{children}</WorkspacePreferencesContext.Provider>;
}
