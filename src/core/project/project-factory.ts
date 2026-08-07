import { createEntityId } from '../domain';
import {
  CURRENT_NODE_SCHEMA_VERSION,
  CURRENT_PROJECT_SCHEMA_VERSION,
  type BreakpointDefinition,
  type CanonicalDocument,
  type CanonicalProject,
  type DocumentNode,
} from './project-model';

export interface CreateProjectInput {
  name: string;
  id?: string;
  version?: string;
  now?: string;
  randomUuid?: () => string;
}

export function createDefaultBreakpoints(): BreakpointDefinition[] {
  return [
    { id: 'desktop', label: 'Desktop', width: 1440, order: 0, orientation: 'any' },
    { id: 'laptop', label: 'Laptop', width: 1200, order: 1, orientation: 'any' },
    {
      id: 'tablet-landscape',
      label: 'Tablet horizontal',
      width: 1024,
      order: 2,
      orientation: 'landscape',
    },
    {
      id: 'tablet-portrait',
      label: 'Tablet vertical',
      width: 768,
      order: 3,
      orientation: 'portrait',
    },
    { id: 'mobile-large', label: 'Móvil grande', width: 480, order: 4, orientation: 'portrait' },
    { id: 'mobile-small', label: 'Móvil pequeño', width: 360, order: 5, orientation: 'portrait' },
  ];
}

export function createCanonicalProject(input: CreateProjectInput): CanonicalProject {
  const now = input.now ?? new Date().toISOString();
  const randomUuid = input.randomUuid ?? (() => globalThis.crypto.randomUUID());
  const projectId = input.id ?? createEntityId('project', randomUuid);
  const documentId = createEntityId('document', randomUuid);
  const rootNodeId = createEntityId('node', randomUuid);

  const rootNode: DocumentNode = {
    id: rootNodeId,
    type: 'core/root',
    version: CURRENT_NODE_SCHEMA_VERSION,
    props: {},
    styles: {},
    children: [],
  };

  const homeDocument: CanonicalDocument = {
    id: documentId,
    kind: 'page',
    name: 'Home',
    slug: '/',
    rootNodeId,
    nodes: {
      [rootNodeId]: rootNode,
    },
    metadata: {},
  };

  return {
    schemaVersion: CURRENT_PROJECT_SCHEMA_VERSION,
    id: projectId,
    name: input.name.trim(),
    version: input.version ?? '0.1.0',
    metadata: {
      createdAt: now,
      updatedAt: now,
    },
    settings: {
      locale: 'es-419',
      timezone: 'UTC',
      siteTitle: input.name.trim(),
      localOnly: true,
    },
    editorThemeId: 'editor.high-density',
    frontendThemeId: 'frontend.minimal-clean',
    backendThemeId: 'backend.high-density',
    documents: {
      [documentId]: homeDocument,
    },
    documentOrder: [documentId],
    contentTypes: {},
    taxonomies: {},
    fieldGroups: {},
    records: {},
    relations: {},
    queries: {},
    forms: {},
    filters: {},
    roles: {},
    users: {},
    backend: {},
    dashboards: {},
    media: {},
    tokens: {},
    breakpoints: createDefaultBreakpoints(),
    exportMetadata: {
      targets: {},
    },
    historyMetadata: {
      revision: 0,
    },
  };
}
