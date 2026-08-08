import { useCallback, useEffect, useState } from 'react';
import type { CanonicalProject } from '../core/project';
import type { ProjectThemeRegistry } from '../core/themes';
import { AppHeader } from './components/AppHeader';
import type { EditorProjectPersistence } from './project/editor-project-persistence';
import { ProjectSessionProvider } from './project/project-session';
import { useWorkspaceRoute } from './routing/use-workspace-route';
import type { WorkspaceId } from './routing/workspaces';
import { ProductionStudio } from './studio/ProductionStudio';
import './studio/production-studio-theme.css';
import { ProjectThemeRegistryProvider } from './themes/ProjectThemeRegistryProvider';
import { EditorWidgetRegistryProvider } from './widgets/EditorWidgetRegistryProvider';
import type { EditorWidgetRegistry } from './widgets/editor-widget-registry';
import { useResolvedEditorTheme } from './workspace/editor-theme';
import './workspace/editor-theme-presets.css';
import { WorkspacePreferencesProvider } from './workspace/workspace-preferences-context';
import type { WorkspacePreferencesRepository } from './workspace/workspace-preferences-repository';
import { useWorkspacePreferences } from './workspace/workspace-preferences-store';

export interface AppProps {
  initialProject?: CanonicalProject;
  projectPersistence?: EditorProjectPersistence | null;
  preferencesRepository?: WorkspacePreferencesRepository;
  widgetRegistry?: EditorWidgetRegistry;
  projectThemeRegistry?: ProjectThemeRegistry;
}

function useCompactStudioLayout(): boolean {
  const query = '(max-width: 960px)';
  const [compact, setCompact] = useState(() =>
    typeof globalThis.matchMedia === 'function' ? globalThis.matchMedia(query).matches : false,
  );

  useEffect(() => {
    if (typeof globalThis.matchMedia !== 'function') return undefined;
    const mediaQuery = globalThis.matchMedia(query);
    const update = () => setCompact(mediaQuery.matches);
    update();
    mediaQuery.addEventListener('change', update);
    return () => mediaQuery.removeEventListener('change', update);
  }, []);

  return compact;
}

function EditorApplicationShell() {
  const route = useWorkspaceRoute();
  const { preferences, setLastWorkspace } = useWorkspacePreferences();
  const resolvedTheme = useResolvedEditorTheme(preferences.editorThemeMode);
  const activeWorkspace: WorkspaceId = route.workspaceId ?? preferences.lastWorkspace;
  const compactLayout = useCompactStudioLayout();
  const [navigationOpen, setNavigationOpen] = useState(false);

  const navigate = useCallback(
    (workspaceId: WorkspaceId) => {
      setLastWorkspace(workspaceId);
      route.navigate(workspaceId);
      setNavigationOpen(false);
    },
    [route, setLastWorkspace],
  );

  useEffect(() => {
    if (route.workspaceId === null) {
      route.navigate(preferences.lastWorkspace, { replace: true });
      return;
    }
    if (route.workspaceId !== preferences.lastWorkspace) {
      setLastWorkspace(route.workspaceId);
    }
  }, [preferences.lastWorkspace, route, setLastWorkspace]);

  return (
    <div
      className="electrocms-app"
      data-theme={resolvedTheme}
      data-theme-mode={preferences.editorThemeMode}
      data-editor-preset={preferences.editorThemePresetId}
      data-density={preferences.density}
      data-navigation-position={preferences.navigationPosition}
    >
      <a className="skip-link" href="#workspace-main">Skip to workspace</a>
      <AppHeader
        compactLayout={compactLayout}
        activeWorkspace={activeWorkspace}
        onOpenNavigation={() => setNavigationOpen(true)}
        onNavigate={navigate}
      />
      <ProductionStudio
        workspaceId={activeWorkspace}
        compactLayout={compactLayout}
        navigationOpen={compactLayout && navigationOpen}
        onCloseNavigation={() => setNavigationOpen(false)}
        onNavigate={navigate}
      />
    </div>
  );
}

export function App({
  initialProject,
  projectPersistence,
  preferencesRepository,
  widgetRegistry,
  projectThemeRegistry,
}: AppProps) {
  const preferencesProviderProps = preferencesRepository ? { repository: preferencesRepository } : {};
  const projectProviderProps = {
    ...(initialProject ? { initialProject } : {}),
    ...(projectPersistence === undefined ? {} : { persistence: projectPersistence }),
  };
  const widgetProviderProps = widgetRegistry ? { registry: widgetRegistry } : {};
  const themeProviderProps = projectThemeRegistry ? { registry: projectThemeRegistry } : {};

  return (
    <WorkspacePreferencesProvider {...preferencesProviderProps}>
      <EditorWidgetRegistryProvider {...widgetProviderProps}>
        <ProjectThemeRegistryProvider {...themeProviderProps}>
          <ProjectSessionProvider {...projectProviderProps}>
            <EditorApplicationShell />
          </ProjectSessionProvider>
        </ProjectThemeRegistryProvider>
      </EditorWidgetRegistryProvider>
    </WorkspacePreferencesProvider>
  );
}
