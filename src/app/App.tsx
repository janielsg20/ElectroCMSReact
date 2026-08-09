import { useCallback, useEffect, useState } from 'react';
import type { CanonicalProject } from '../core/project';
import type { ProjectThemeRegistry } from '../core/themes';
import { AppHeader } from './components/AppHeader';
import type { EditorProjectPersistence } from './project/editor-project-persistence';
import { ProjectSessionProvider } from './project/project-session';
import { useWorkspaceRoute } from './routing/use-workspace-route';
import type { WorkspaceId } from './routing/workspaces';
import { ProductionStudio } from './studio/ProductionStudio';
import { ProjectThemeRegistryProvider } from './themes/ProjectThemeRegistryProvider';
import { EditorWidgetRegistryProvider } from './widgets/EditorWidgetRegistryProvider';
import type { EditorWidgetRegistry } from './widgets/editor-widget-registry';
import { useResolvedEditorTheme } from './workspace/editor-theme';
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

const MODAL_FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'summary',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function useModalFocusContainment() {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const dialogs = [...document.querySelectorAll<HTMLElement>('[role="dialog"][aria-modal="true"]')]
        .filter((dialog) => dialog.getClientRects().length > 0);
      const dialog = dialogs.at(-1);
      if (!dialog) return;

      const focusable = [...dialog.querySelectorAll<HTMLElement>(MODAL_FOCUSABLE_SELECTOR)]
        .filter((element) => element.getClientRects().length > 0 && element.getAttribute('aria-hidden') !== 'true');
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable.at(-1);
      const active = document.activeElement;
      if (!first || !last) return;

      if (event.shiftKey && (active === first || !dialog.contains(active))) {
        event.preventDefault();
        last.focus();
        return;
      }

      if (!event.shiftKey && (active === last || !dialog.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
}

function useCompactStudioLayout(): boolean {
  const query = '(max-width: 1024px)';
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
  const activeEditorModule = route.editorModuleId ?? 'builder';
  const compactLayout = useCompactStudioLayout();
  const [navigationOpen, setNavigationOpen] = useState(false);
  useModalFocusContainment();

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

  useEffect(() => {
    if (!navigationOpen) return undefined;

    const focusFrame = requestAnimationFrame(() => {
      document.querySelector<HTMLButtonElement>('[role="dialog"][aria-label="Workspace navigation"] button[aria-label="Close navigation"]')?.focus();
    });
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      setNavigationOpen(false);
      requestAnimationFrame(() => document.querySelector<HTMLButtonElement>('button[aria-label="Open navigation"]')?.focus());
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigationOpen]);

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
        resolvedTheme={resolvedTheme}
        activeWorkspace={activeWorkspace}
        onOpenNavigation={() => setNavigationOpen(true)}
        onNavigate={navigate}
      />
      <ProductionStudio
        workspaceId={activeWorkspace}
        editorModuleId={activeEditorModule}
        compactLayout={compactLayout}
        navigationOpen={compactLayout && navigationOpen}
        onCloseNavigation={() => setNavigationOpen(false)}
        onNavigate={navigate}
        onNavigateEditorModule={route.navigateEditorModule}
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
