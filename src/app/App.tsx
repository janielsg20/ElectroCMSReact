import { useCallback, useEffect, useState } from 'react';
import type { CanonicalProject } from '../core/project';
import { AppHeader } from './components/AppHeader';
import { WorkspaceNavigation } from './components/WorkspaceNavigation';
import { WorkspaceSurface } from './components/WorkspaceSurface';
import { ProjectSessionProvider } from './project/project-session';
import { useWorkspaceRoute } from './routing/use-workspace-route';
import type { WorkspaceId } from './routing/workspaces';
import { useResolvedEditorTheme } from './workspace/editor-theme';
import { useMediaQuery } from './workspace/use-media-query';
import { WorkspacePreferencesProvider, useWorkspacePreferences } from './workspace/workspace-preferences-context';
import type { WorkspacePreferencesRepository } from './workspace/workspace-preferences-repository';

export interface AppProps {
  initialProject?: CanonicalProject;
  preferencesRepository?: WorkspacePreferencesRepository;
}

function EditorApplicationShell() {
  const route = useWorkspaceRoute();
  const { preferences, setLastWorkspace } = useWorkspacePreferences();
  const compactLayout = useMediaQuery('(max-width: 960px)');
  const resolvedTheme = useResolvedEditorTheme(preferences.editorThemeMode);
  const [navigationOpen, setNavigationOpen] = useState(false);
  const activeWorkspace: WorkspaceId = route.workspaceId ?? preferences.lastWorkspace;

  const navigate = useCallback(
    (workspaceId: WorkspaceId) => {
      setLastWorkspace(workspaceId);
      setNavigationOpen(false);
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
      data-density={preferences.density}
      data-navigation-position={preferences.navigationPosition}
    >
      <a className="skip-link" href="#workspace-main">
        Skip to workspace
      </a>

      <AppHeader
        compactLayout={compactLayout}
        activeWorkspace={activeWorkspace}
        onOpenNavigation={() => setNavigationOpen(true)}
        onNavigate={navigate}
      />

      <div
        className="workspace-body"
        data-navigation-position={preferences.navigationPosition}
        data-navigation-collapsed={preferences.navigationCollapsed ? 'true' : 'false'}
      >
        <WorkspaceNavigation
          compactLayout={compactLayout}
          open={compactLayout && navigationOpen}
          activeWorkspace={activeWorkspace}
          onNavigate={navigate}
          onClose={() => setNavigationOpen(false)}
        />
        <WorkspaceSurface workspaceId={activeWorkspace} />
      </div>
    </div>
  );
}

export function App({ initialProject, preferencesRepository }: AppProps) {
  return (
    <WorkspacePreferencesProvider repository={preferencesRepository}>
      <ProjectSessionProvider initialProject={initialProject}>
        <EditorApplicationShell />
      </ProjectSessionProvider>
    </WorkspacePreferencesProvider>
  );
}
