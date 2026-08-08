import { ValidationError, err, isJsonObject, isJsonValue, ok, type Result } from '../domain';
import {
  CURRENT_PROJECT_SCHEMA_VERSION,
  type BreakpointDefinition,
  type CanonicalDocument,
  type CanonicalProject,
  type DocumentNode,
  type MediaAssetRef,
} from './project-model';

export interface ValidationIssue {
  path: string;
  code: string;
  message: string;
}

export class ProjectValidationError extends ValidationError {
  readonly issues: readonly ValidationIssue[];

  constructor(issues: readonly ValidationIssue[]) {
    super(`Project validation failed with ${issues.length} issue(s).`);
    this.issues = issues;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

function pushIssue(issues: ValidationIssue[], path: string, code: string, message: string): void {
  issues.push({ path, code, message });
}

function validatePortableRecord(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
): value is Record<string, Record<string, unknown>> {
  if (!isRecord(value)) {
    pushIssue(issues, path, 'INVALID_RECORD', 'Expected an object record.');
    return false;
  }

  for (const [key, entry] of Object.entries(value)) {
    if (!isJsonObject(entry)) {
      pushIssue(issues, `${path}.${key}`, 'INVALID_PORTABLE_MODEL', 'Expected a JSON object.');
    }
  }

  return true;
}

function validateNode(value: unknown, path: string, issues: ValidationIssue[]): value is DocumentNode {
  if (!isRecord(value)) {
    pushIssue(issues, path, 'INVALID_NODE', 'Expected a node object.');
    return false;
  }

  if (!isNonEmptyString(value.id)) pushIssue(issues, `${path}.id`, 'REQUIRED', 'Node id is required.');
  if (!isNonEmptyString(value.type)) pushIssue(issues, `${path}.type`, 'REQUIRED', 'Node type is required.');
  if (!Number.isInteger(value.version) || Number(value.version) < 1) {
    pushIssue(issues, `${path}.version`, 'INVALID_VERSION', 'Node version must be a positive integer.');
  }
  if (!isJsonObject(value.props)) pushIssue(issues, `${path}.props`, 'INVALID_JSON', 'Node props must be a JSON object.');
  if (!isRecord(value.styles) || !isJsonValue(value.styles)) {
    pushIssue(issues, `${path}.styles`, 'INVALID_STYLES', 'Node styles must be JSON-serializable.');
  }
  if (!Array.isArray(value.children) || !value.children.every(isNonEmptyString)) {
    pushIssue(issues, `${path}.children`, 'INVALID_CHILDREN', 'Node children must be string ids.');
  }

  return true;
}

function validateDocument(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
): value is CanonicalDocument {
  if (!isRecord(value)) {
    pushIssue(issues, path, 'INVALID_DOCUMENT', 'Expected a document object.');
    return false;
  }

  if (!isNonEmptyString(value.id)) pushIssue(issues, `${path}.id`, 'REQUIRED', 'Document id is required.');
  if (!isNonEmptyString(value.name)) pushIssue(issues, `${path}.name`, 'REQUIRED', 'Document name is required.');
  if (!isNonEmptyString(value.rootNodeId)) {
    pushIssue(issues, `${path}.rootNodeId`, 'REQUIRED', 'Document rootNodeId is required.');
  }

  const allowedKinds = new Set(['page', 'template', 'header', 'footer', 'single', 'archive', '404', 'backend']);
  if (typeof value.kind !== 'string' || !allowedKinds.has(value.kind)) {
    pushIssue(issues, `${path}.kind`, 'INVALID_KIND', 'Unsupported document kind.');
  }

  if (!isRecord(value.nodes)) {
    pushIssue(issues, `${path}.nodes`, 'INVALID_NODES', 'Document nodes must be an object record.');
    return false;
  }
  const nodes = value.nodes;

  for (const [nodeId, node] of Object.entries(nodes)) {
    validateNode(node, `${path}.nodes.${nodeId}`, issues);
    if (isRecord(node) && node.id !== nodeId) {
      pushIssue(issues, `${path}.nodes.${nodeId}.id`, 'KEY_ID_MISMATCH', 'Node key must equal node.id.');
    }
  }

  if (isNonEmptyString(value.rootNodeId) && !(value.rootNodeId in nodes)) {
    pushIssue(issues, `${path}.rootNodeId`, 'MISSING_ROOT', 'Root node does not exist.');
  }

  const parentByChildId = new Map<string, string>();
  for (const [parentId, node] of Object.entries(nodes)) {
    if (!isRecord(node) || !Array.isArray(node.children)) continue;

    for (const childId of node.children) {
      if (typeof childId !== 'string' || !(childId in nodes)) continue;
      const existingParentId = parentByChildId.get(childId);
      if (existingParentId && existingParentId !== parentId) {
        pushIssue(
          issues,
          `${path}.nodes.${parentId}.children`,
          'MULTIPLE_PARENTS',
          `Child ${childId} is referenced by both ${existingParentId} and ${parentId}.`,
        );
        continue;
      }
      parentByChildId.set(childId, parentId);
    }
  }

  if (isNonEmptyString(value.rootNodeId)) {
    const rootParentId = parentByChildId.get(value.rootNodeId);
    if (rootParentId) {
      pushIssue(
        issues,
        `${path}.nodes.${rootParentId}.children`,
        'ROOT_HAS_PARENT',
        `Root node ${value.rootNodeId} cannot be referenced as a child.`,
      );
    }
  }

  const visited = new Set<string>();
  const visiting = new Set<string>();
  const visit = (nodeId: string): void => {
    if (visiting.has(nodeId)) {
      pushIssue(issues, `${path}.nodes.${nodeId}`, 'NODE_CYCLE', 'Document node tree contains a cycle.');
      return;
    }
    if (visited.has(nodeId)) return;

    const node = nodes[nodeId];
    if (!isRecord(node)) return;

    visiting.add(nodeId);
    const children = Array.isArray(node.children) ? node.children : [];
    const uniqueChildren = new Set<string>();
    for (const childId of children) {
      if (typeof childId !== 'string') continue;
      if (uniqueChildren.has(childId)) {
        pushIssue(issues, `${path}.nodes.${nodeId}.children`, 'DUPLICATE_CHILD', `Duplicate child ${childId}.`);
        continue;
      }
      uniqueChildren.add(childId);
      if (!(childId in nodes)) {
        pushIssue(issues, `${path}.nodes.${nodeId}.children`, 'MISSING_CHILD', `Child ${childId} does not exist.`);
        continue;
      }
      visit(childId);
    }
    visiting.delete(nodeId);
    visited.add(nodeId);
  };

  if (isNonEmptyString(value.rootNodeId) && value.rootNodeId in nodes) {
    visit(value.rootNodeId);
  }

  for (const nodeId of Object.keys(nodes)) {
    if (!visited.has(nodeId)) {
      pushIssue(issues, `${path}.nodes.${nodeId}`, 'ORPHAN_NODE', 'Node is not reachable from the root.');
    }
  }

  if (!isJsonObject(value.metadata)) {
    pushIssue(issues, `${path}.metadata`, 'INVALID_JSON', 'Document metadata must be a JSON object.');
  }

  return true;
}

function validateBreakpoint(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
): value is BreakpointDefinition {
  if (!isRecord(value)) {
    pushIssue(issues, path, 'INVALID_BREAKPOINT', 'Expected a breakpoint object.');
    return false;
  }

  if (!isNonEmptyString(value.id)) pushIssue(issues, `${path}.id`, 'REQUIRED', 'Breakpoint id is required.');
  if (!isNonEmptyString(value.label)) pushIssue(issues, `${path}.label`, 'REQUIRED', 'Breakpoint label is required.');
  if (typeof value.width !== 'number' || !Number.isFinite(value.width) || value.width <= 0) {
    pushIssue(issues, `${path}.width`, 'INVALID_WIDTH', 'Breakpoint width must be positive.');
  }
  if (!Number.isInteger(value.order) || Number(value.order) < 0) {
    pushIssue(issues, `${path}.order`, 'INVALID_ORDER', 'Breakpoint order must be a non-negative integer.');
  }
  if (!['landscape', 'portrait', 'any'].includes(String(value.orientation))) {
    pushIssue(issues, `${path}.orientation`, 'INVALID_ORIENTATION', 'Unsupported breakpoint orientation.');
  }

  return true;
}

function validateMedia(value: unknown, path: string, issues: ValidationIssue[]): value is MediaAssetRef {
  if (!isRecord(value)) {
    pushIssue(issues, path, 'INVALID_MEDIA', 'Expected a media reference object.');
    return false;
  }

  for (const key of ['id', 'hash', 'fileName', 'mediaType'] as const) {
    if (!isNonEmptyString(value[key])) pushIssue(issues, `${path}.${key}`, 'REQUIRED', `${key} is required.`);
  }
  if (typeof value.byteSize !== 'number' || !Number.isFinite(value.byteSize) || value.byteSize < 0) {
    pushIssue(issues, `${path}.byteSize`, 'INVALID_BYTE_SIZE', 'byteSize must be non-negative.');
  }
  if (!Array.isArray(value.tags) || !value.tags.every((tag) => typeof tag === 'string')) {
    pushIssue(issues, `${path}.tags`, 'INVALID_TAGS', 'tags must be strings.');
  }

  return true;
}

export function validateCanonicalProject(input: unknown): Result<CanonicalProject, ProjectValidationError> {
  const issues: ValidationIssue[] = [];

  if (!isRecord(input)) {
    return err(new ProjectValidationError([{ path: '$', code: 'INVALID_PROJECT', message: 'Expected an object.' }]));
  }

  if (input.schemaVersion !== CURRENT_PROJECT_SCHEMA_VERSION) {
    pushIssue(
      issues,
      '$.schemaVersion',
      typeof input.schemaVersion === 'number' && input.schemaVersion > CURRENT_PROJECT_SCHEMA_VERSION
        ? 'FUTURE_SCHEMA'
        : 'MIGRATION_REQUIRED',
      `Expected schemaVersion ${CURRENT_PROJECT_SCHEMA_VERSION}.`,
    );
  }

  for (const key of ['id', 'name', 'version', 'editorThemeId', 'frontendThemeId', 'backendThemeId'] as const) {
    if (!isNonEmptyString(input[key])) pushIssue(issues, `$.${key}`, 'REQUIRED', `${key} is required.`);
  }

  if (!isRecord(input.metadata)) {
    pushIssue(issues, '$.metadata', 'INVALID_METADATA', 'metadata must be an object.');
  } else {
    if (!isIsoDate(input.metadata.createdAt)) pushIssue(issues, '$.metadata.createdAt', 'INVALID_DATE', 'createdAt must be ISO-like.');
    if (!isIsoDate(input.metadata.updatedAt)) pushIssue(issues, '$.metadata.updatedAt', 'INVALID_DATE', 'updatedAt must be ISO-like.');
  }

  if (!isRecord(input.settings)) {
    pushIssue(issues, '$.settings', 'INVALID_SETTINGS', 'settings must be an object.');
  } else {
    for (const key of ['locale', 'timezone', 'siteTitle'] as const) {
      if (!isNonEmptyString(input.settings[key])) pushIssue(issues, `$.settings.${key}`, 'REQUIRED', `${key} is required.`);
    }
    if (input.settings.localOnly !== true) pushIssue(issues, '$.settings.localOnly', 'LOCAL_ONLY_REQUIRED', 'F01 projects are local-only.');
  }

  if (!isRecord(input.documents)) {
    pushIssue(issues, '$.documents', 'INVALID_DOCUMENTS', 'documents must be an object record.');
  } else {
    for (const [documentId, document] of Object.entries(input.documents)) {
      validateDocument(document, `$.documents.${documentId}`, issues);
      if (isRecord(document) && document.id !== documentId) {
        pushIssue(issues, `$.documents.${documentId}.id`, 'KEY_ID_MISMATCH', 'Document key must equal document.id.');
      }
    }
  }

  if (!Array.isArray(input.documentOrder) || !input.documentOrder.every(isNonEmptyString)) {
    pushIssue(issues, '$.documentOrder', 'INVALID_DOCUMENT_ORDER', 'documentOrder must contain document ids.');
  } else if (isRecord(input.documents)) {
    const seen = new Set<string>();
    for (const documentId of input.documentOrder) {
      if (seen.has(documentId)) pushIssue(issues, '$.documentOrder', 'DUPLICATE_DOCUMENT', `Duplicate document ${documentId}.`);
      seen.add(documentId);
      if (!(documentId in input.documents)) {
        pushIssue(issues, '$.documentOrder', 'MISSING_DOCUMENT', `Document ${documentId} does not exist.`);
      }
    }
    for (const documentId of Object.keys(input.documents)) {
      if (!seen.has(documentId)) pushIssue(issues, '$.documentOrder', 'UNORDERED_DOCUMENT', `Document ${documentId} is missing from documentOrder.`);
    }
  }

  for (const key of [
    'contentTypes',
    'taxonomies',
    'fieldGroups',
    'records',
    'relations',
    'queries',
    'forms',
    'filters',
    'roles',
    'users',
    'dashboards',
  ] as const) {
    validatePortableRecord(input[key], `$.${key}`, issues);
  }

  for (const key of ['backend', 'tokens'] as const) {
    if (!isJsonObject(input[key])) pushIssue(issues, `$.${key}`, 'INVALID_JSON', `${key} must be a JSON object.`);
  }

  if (!isRecord(input.media)) {
    pushIssue(issues, '$.media', 'INVALID_MEDIA_RECORD', 'media must be an object record.');
  } else {
    for (const [mediaId, media] of Object.entries(input.media)) {
      validateMedia(media, `$.media.${mediaId}`, issues);
      if (isRecord(media) && media.id !== mediaId) {
        pushIssue(issues, `$.media.${mediaId}.id`, 'KEY_ID_MISMATCH', 'Media key must equal media.id.');
      }
    }
  }

  if (!Array.isArray(input.breakpoints)) {
    pushIssue(issues, '$.breakpoints', 'INVALID_BREAKPOINTS', 'breakpoints must be an array.');
  } else {
    const ids = new Set<string>();
    for (const [index, breakpoint] of input.breakpoints.entries()) {
      validateBreakpoint(breakpoint, `$.breakpoints.${index}`, issues);
      if (isRecord(breakpoint) && typeof breakpoint.id === 'string') {
        if (ids.has(breakpoint.id)) pushIssue(issues, '$.breakpoints', 'DUPLICATE_BREAKPOINT', `Duplicate breakpoint ${breakpoint.id}.`);
        ids.add(breakpoint.id);
      }
    }
  }

  if (!isRecord(input.exportMetadata) || !isJsonObject(input.exportMetadata.targets)) {
    pushIssue(issues, '$.exportMetadata', 'INVALID_EXPORT_METADATA', 'exportMetadata.targets must be a JSON object.');
  }

  if (!isRecord(input.historyMetadata) || !Number.isInteger(input.historyMetadata.revision) || Number(input.historyMetadata.revision) < 0) {
    pushIssue(issues, '$.historyMetadata.revision', 'INVALID_REVISION', 'historyMetadata.revision must be non-negative.');
  }

  return issues.length > 0 ? err(new ProjectValidationError(issues)) : ok(input as unknown as CanonicalProject);
}

export function assertCanonicalProject(input: unknown): CanonicalProject {
  const result = validateCanonicalProject(input);
  if (!result.ok) throw result.error;
  return result.value;
}
