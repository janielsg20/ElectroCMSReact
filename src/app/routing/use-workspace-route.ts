import { useCallback, useSyncExternalStore } from 'react';
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

export function navigateToWorkspace(workspaceId: WorkspaceId, options: { replace?: boolean } = {}): void {
  const path = pathForWorkspace(workspaceId);
  if (globalThis.location?.pathname === path) return;

  if (options.replace) {
    globalThis.history.replaceState({ workspaceId }, '', path);
  } else {
    globalThis.history.pushState({ workspaceId }, '', path);
  }
  globalThis.dispatchEvent(new Event(NAVIGATION_EVENT));
}

export interface WorkspaceRouteState {
  pathname: string;
  workspaceId: WorkspaceId | null;
  navigate: (workspaceId: WorkspaceId, options?: { replace?: boolean }) => void;
}

export function useWorkspaceRoute(): WorkspaceRouteState {
  const pathname = useSyncExternalStore(subscribe, getPathname, () => '/');
  const workspaceId = workspaceFromPathname(pathname);
  const navigate = useCallback((nextWorkspace: WorkspaceId, options?: { replace?: boolean }) => {
    navigateToWorkspace(nextWorkspace, options);
  }, []);

  return { pathname, workspaceId, navigate };
}
