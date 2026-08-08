import { useCallback, useSyncExternalStore } from 'react';
import { editorModuleFromPathname, pathForEditorModule, type EditorModuleId } from './editor-modules';
import { pathForWorkspace, workspaceFromPathname, type WorkspaceId } from './workspaces';

const NAVIGATION_EVENT = 'electrocms:navigation';

function getPathname(): string {
  return globalThis.location?.pathname ?? '/';
}

function subscribe(callback: () => void): () => void {
  globalThis.addEventListener('popstate', callback);
  globalThis.addEventListener(NAVIGATION_EVENT, callback);
  return () => {
    globalThis.removeEventListener('popstate', callback);
    globalThis.removeEventListener(NAVIGATION_EVENT, callback);
  };
}

function navigateToPath(path: string, state: object, options: { replace?: boolean } = {}): void {
  if (globalThis.location?.pathname === path) return;

  if (options.replace) {
    globalThis.history.replaceState(state, '', path);
  } else {
    globalThis.history.pushState(state, '', path);
  }
  globalThis.dispatchEvent(new Event(NAVIGATION_EVENT));
}

export function navigateToWorkspace(workspaceId: WorkspaceId, options: { replace?: boolean } = {}): void {
  navigateToPath(pathForWorkspace(workspaceId), { workspaceId }, options);
}

export function navigateToEditorModule(moduleId: EditorModuleId, options: { replace?: boolean } = {}): void {
  navigateToPath(pathForEditorModule(moduleId), { workspaceId: 'editor', editorModuleId: moduleId }, options);
}

export interface WorkspaceRouteState {
  pathname: string;
  workspaceId: WorkspaceId | null;
  editorModuleId: EditorModuleId | null;
  navigate: (workspaceId: WorkspaceId, options?: { replace?: boolean }) => void;
  navigateEditorModule: (moduleId: EditorModuleId, options?: { replace?: boolean }) => void;
}

export function useWorkspaceRoute(): WorkspaceRouteState {
  const pathname = useSyncExternalStore(subscribe, getPathname, () => '/');
  const workspaceId = workspaceFromPathname(pathname);
  const editorModuleId = editorModuleFromPathname(pathname);
  const navigate = useCallback((nextWorkspace: WorkspaceId, options?: { replace?: boolean }) => {
    navigateToWorkspace(nextWorkspace, options);
  }, []);
  const navigateEditorModule = useCallback((nextModule: EditorModuleId, options?: { replace?: boolean }) => {
    navigateToEditorModule(nextModule, options);
  }, []);

  return { pathname, workspaceId, editorModuleId, navigate, navigateEditorModule };
}
