import type { JsonObject } from '../domain';
import type {
  CanonicalDocument,
  CanonicalProject,
  PortableModelRecord,
} from '../project/project-model';
import type { ProjectThemeDefinition } from './theme-system';
import { validateProjectThemeDefinition } from './theme-system';

export const THEME_PACKAGE_SCHEMA_VERSION = 1 as const;
export const THEME_PACKAGE_KIND = 'electrocms-theme-package' as const;
export const MAX_THEME_PACKAGE_BYTES = 256 * 1024;

export interface ProjectThemePackageResources {
  documents?: Record<string, CanonicalDocument>;
  documentOrder?: string[];
  contentTypes?: PortableModelRecord;
  taxonomies?: PortableModelRecord;
  fieldGroups?: PortableModelRecord;
  relations?: PortableModelRecord;
  queries?: PortableModelRecord;
  forms?: PortableModelRecord;
  filters?: PortableModelRecord;
  roles?: PortableModelRecord;
  dashboards?: PortableModelRecord;
  backend?: JsonObject;
  records?: PortableModelRecord;
}

export interface ThemePackageResourceSelection {
  documents: boolean;
  contentModels: boolean;
  queryTools: boolean;
  rolesAndBackend: boolean;
  demoData: boolean;
}

export const DEFAULT_THEME_PACKAGE_RESOURCE_SELECTION: ThemePackageResourceSelection = {
  documents: true,
  contentModels: true,
  queryTools: true,
  rolesAndBackend: true,
  demoData: false,
};

export interface ProjectThemePackage {
  schemaVersion: typeof THEME_PACKAGE_SCHEMA_VERSION;
  kind: typeof THEME_PACKAGE_KIND;
  theme: ProjectThemeDefinition;
  resources?: ProjectThemePackageResources;
}

export type ThemePackageErrorCode =
  | 'PACKAGE_TOO_LARGE'
  | 'INVALID_JSON'
  | 'INVALID_PACKAGE'
  | 'UNSUPPORTED_SCHEMA'
  | 'INVALID_THEME'
  | 'INVALID_RESOURCES';

export interface ThemePackageError {
  code: ThemePackageErrorCode;
  message: string;
}

export type ThemePackageParseResult =
  | { ok: true; value: ProjectThemePackage }
  | { ok: false; error: ThemePackageError };

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isJsonValue(value: unknown): boolean {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'boolean' ||
    (typeof value === 'number' && Number.isFinite(value))
  ) {
    return true;
  }
  if (Array.isArray(value)) return value.every(isJsonValue);
  return isPlainObject(value) && Object.values(value).every(isJsonValue);
}

function isJsonObjectRecord(value: unknown): value is PortableModelRecord {
  return (
    isPlainObject(value) &&
    Object.values(value).every((entry) => isPlainObject(entry) && isJsonValue(entry))
  );
}

function isDocumentRecord(value: unknown): value is Record<string, CanonicalDocument> {
  if (!isPlainObject(value)) return false;
  return Object.entries(value).every(([id, document]) => {
    if (!isPlainObject(document)) return false;
    return (
      document.id === id &&
      typeof document.kind === 'string' &&
      typeof document.name === 'string' &&
      typeof document.rootNodeId === 'string' &&
      isPlainObject(document.nodes) &&
      isPlainObject(document.metadata)
    );
  });
}

function normalizeResources(value: unknown): ProjectThemePackageResources | null {
  if (value === undefined) return {};
  if (!isPlainObject(value)) return null;

  const resources: ProjectThemePackageResources = {};
  if (value.documents !== undefined) {
    if (!isDocumentRecord(value.documents)) return null;
    resources.documents = structuredClone(value.documents);
  }
  if (value.documentOrder !== undefined) {
    if (!Array.isArray(value.documentOrder) || !value.documentOrder.every((id) => typeof id === 'string')) {
      return null;
    }
    resources.documentOrder = [...value.documentOrder];
  }

  const recordKeys = [
    'contentTypes',
    'taxonomies',
    'fieldGroups',
    'relations',
    'queries',
    'forms',
    'filters',
    'roles',
    'dashboards',
    'records',
  ] as const;
  for (const key of recordKeys) {
    const candidate = value[key];
    if (candidate === undefined) continue;
    if (!isJsonObjectRecord(candidate)) return null;
    resources[key] = structuredClone(candidate);
  }

  if (value.backend !== undefined) {
    if (!isPlainObject(value.backend) || !isJsonValue(value.backend)) return null;
    resources.backend = structuredClone(value.backend) as JsonObject;
  }
  return resources;
}

function selectedRecord<T>(value: T, include: boolean): T | undefined {
  return include ? structuredClone(value) : undefined;
}

export function createThemePackageResourcesFromProject(
  project: CanonicalProject,
  selection: ThemePackageResourceSelection,
): ProjectThemePackageResources {
  return {
    ...(selection.documents
      ? { documents: structuredClone(project.documents), documentOrder: [...project.documentOrder] }
      : {}),
    ...(selection.contentModels
      ? {
          contentTypes: structuredClone(project.contentTypes),
          taxonomies: structuredClone(project.taxonomies),
          fieldGroups: structuredClone(project.fieldGroups),
          relations: structuredClone(project.relations),
        }
      : {}),
    ...(selection.queryTools
      ? {
          queries: structuredClone(project.queries),
          forms: structuredClone(project.forms),
          filters: structuredClone(project.filters),
        }
      : {}),
    ...(selection.rolesAndBackend
      ? {
          roles: structuredClone(project.roles),
          dashboards: structuredClone(project.dashboards),
          backend: structuredClone(project.backend),
        }
      : {}),
    ...(selectedRecord(project.records, selection.demoData) === undefined
      ? {}
      : { records: structuredClone(project.records) }),
  };
}

export function createProjectThemePackage(
  theme: ProjectThemeDefinition,
  resources?: ProjectThemePackageResources,
): ProjectThemePackage {
  const validation = validateProjectThemeDefinition(theme);
  if (!validation.valid) {
    throw new Error(validation.issues.map((issue) => issue.message).join(' '));
  }
  const normalizedResources = normalizeResources(resources);
  if (resources !== undefined && normalizedResources === null) {
    throw new Error('Theme package resources are invalid or non-portable.');
  }
  return {
    schemaVersion: THEME_PACKAGE_SCHEMA_VERSION,
    kind: THEME_PACKAGE_KIND,
    theme: structuredClone(validation.value),
    ...(resources === undefined || !normalizedResources || Object.keys(normalizedResources).length === 0
      ? {}
      : { resources: normalizedResources }),
  };
}

export function serializeProjectThemePackage(
  theme: ProjectThemeDefinition,
  resources?: ProjectThemePackageResources,
): string {
  const text = JSON.stringify(createProjectThemePackage(theme, resources), null, 2);
  if (new TextEncoder().encode(text).byteLength > MAX_THEME_PACKAGE_BYTES) {
    throw new Error(`Theme package exceeds the ${MAX_THEME_PACKAGE_BYTES} byte limit.`);
  }
  return text;
}

export function parseProjectThemePackage(text: string): ThemePackageParseResult {
  const size = new TextEncoder().encode(text).byteLength;
  if (size > MAX_THEME_PACKAGE_BYTES) {
    return {
      ok: false,
      error: {
        code: 'PACKAGE_TOO_LARGE',
        message: `Theme package exceeds the ${MAX_THEME_PACKAGE_BYTES} byte limit.`,
      },
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    return { ok: false, error: { code: 'INVALID_JSON', message: 'Theme package is not valid JSON.' } };
  }

  if (!isPlainObject(parsed)) {
    return {
      ok: false,
      error: { code: 'INVALID_PACKAGE', message: 'Theme package must be a JSON object.' },
    };
  }
  if (parsed.schemaVersion !== THEME_PACKAGE_SCHEMA_VERSION) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_SCHEMA',
        message: `Expected theme package schemaVersion ${THEME_PACKAGE_SCHEMA_VERSION}.`,
      },
    };
  }
  if (parsed.kind !== THEME_PACKAGE_KIND) {
    return {
      ok: false,
      error: { code: 'INVALID_PACKAGE', message: `Expected package kind ${THEME_PACKAGE_KIND}.` },
    };
  }

  const themeValidation = validateProjectThemeDefinition(parsed.theme);
  if (!themeValidation.valid) {
    return {
      ok: false,
      error: {
        code: 'INVALID_THEME',
        message: themeValidation.issues.map((issue) => issue.message).join(' '),
      },
    };
  }

  const resources = normalizeResources(parsed.resources);
  if (parsed.resources !== undefined && resources === null) {
    return {
      ok: false,
      error: {
        code: 'INVALID_RESOURCES',
        message: 'Theme package resources are invalid or non-portable.',
      },
    };
  }

  return {
    ok: true,
    value: {
      schemaVersion: THEME_PACKAGE_SCHEMA_VERSION,
      kind: THEME_PACKAGE_KIND,
      theme: structuredClone(themeValidation.value),
      ...(!resources || Object.keys(resources).length === 0 ? {} : { resources }),
    },
  };
}
