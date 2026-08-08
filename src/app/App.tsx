import { useCallback, useEffect } from 'react';
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

function EditorApplicationShell() {
  const route = useWorkspaceRoute();
  const { preferences, setLastWorkspace } = useWorkspacePreferences();
  const resolvedTheme = useResolvedEditorTheme(preferences.editorThemeMode);
  const activeWorkspace: WorkspaceId = route.workspaceId ?? preferences.lastWorkspace;

  const navigate = useCallback(
    (workspaceId: WorkspaceId) => {
      setLastWorkspace(workspaceId);
      route.navigate(workspaceId);
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
      data-navigation-position="left"
    >
      <a className="skip-link" href="#workspace-main">Skip to workspace</a>
      <AppHeader activeWorkspace={activeWorkspace} onNavigate={navigate} />
      <ProductionStudio workspaceId={activeWorkspace} onNavigate={navigate} />
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
