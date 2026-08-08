import { editorModuleFromPathname } from './editor-modules';

export const WORKSPACE_IDS = ['editor', 'preview', 'backend', 'export'] as const;

export type WorkspaceId = (typeof WORKSPACE_IDS)[number];

export interface WorkspaceDefinition {
  id: WorkspaceId;
  label: string;
  shortLabel: string;
  path: `/${WorkspaceId}`;
  description: string;
}

export const WORKSPACES: readonly WorkspaceDefinition[] = [
  {
    id: 'editor',
    label: 'Editor',
    shortLabel: 'Edit',
    path: '/editor',
    description: 'Document workspace',
  },
  {
    id: 'preview',
    label: 'Preview',
    shortLabel: 'View',
    path: '/preview',
    description: 'Project preview workspace',
  },
  {
    id: 'backend',
    label: 'Backend',
    shortLabel: 'Admin',
    path: '/backend',
    description: 'Administrative workspace',
  },
  {
    id: 'export',
    label: 'Export',
    shortLabel: 'Ship',
    path: '/export',
    description: 'Publishing and export workspace',
  },
] as const;

const definitionById = new Map(WORKSPACES.map((workspace) => [workspace.id, workspace]));
const workspaceByPath = new Map(WORKSPACES.map((workspace) => [workspace.path, workspace.id]));

export function isWorkspaceId(value: unknown): value is WorkspaceId {
  return typeof value === 'string' && definitionById.has(value as WorkspaceId);
}

export function getWorkspaceDefinition(workspaceId: WorkspaceId): WorkspaceDefinition {
  const definition = definitionById.get(workspaceId);
  if (!definition) throw new Error(`Unknown workspace: ${workspaceId}`);
  return definition;
}

export function workspaceFromPathname(pathname: string): WorkspaceId | null {
  const normalized = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  const exactWorkspace = workspaceByPath.get(normalized as `/${WorkspaceId}`);
  if (exactWorkspace) return exactWorkspace;
  return editorModuleFromPathname(normalized) ? 'editor' : null;
}

export function pathForWorkspace(workspaceId: WorkspaceId): `/${WorkspaceId}` {
  return getWorkspaceDefinition(workspaceId).path;
}
