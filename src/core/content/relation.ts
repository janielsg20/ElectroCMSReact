import { isJsonObject, type JsonObject } from '../domain';
import { validateCanonicalProject, type CanonicalProject } from '../project';
import { listContentTypeDefinitions } from './content-type';

export const RELATION_DEFINITION_VERSION = 1 as const;
export const RELATION_CARDINALITIES = ['one', 'many'] as const;

export type RelationCardinality = (typeof RELATION_CARDINALITIES)[number];

export interface RelationDefinition {
  version: typeof RELATION_DEFINITION_VERSION;
  id: string;
  label: string;
  description: string;
  sourceContentTypeId: string;
  targetContentTypeId: string;
  sourceCardinality: RelationCardinality;
  targetCardinality: RelationCardinality;
  bidirectional: boolean;
}

export type RelationValidationCode =
  | 'INVALID_OBJECT'
  | 'INVALID_VERSION'
  | 'INVALID_ID'
  | 'INVALID_LABEL'
  | 'INVALID_DESCRIPTION'
  | 'INVALID_SOURCE_CONTENT_TYPE'
  | 'INVALID_TARGET_CONTENT_TYPE'
  | 'INVALID_SOURCE_CARDINALITY'
  | 'INVALID_TARGET_CARDINALITY'
  | 'INVALID_BIDIRECTIONAL';

export interface RelationValidationIssue {
  code: RelationValidationCode;
  path: string;
  message: string;
}

export type RelationValidationResult =
  | { ok: true; value: RelationDefinition }
  | { ok: false; issues: readonly RelationValidationIssue[] };

export type RelationMutationErrorCode =
  | 'INVALID_DEFINITION'
  | 'DUPLICATE_ID'
  | 'NOT_FOUND'
  | 'ID_MISMATCH'
  | 'UNKNOWN_SOURCE_CONTENT_TYPE'
  | 'UNKNOWN_TARGET_CONTENT_TYPE'
  | 'RELATION_IN_USE'
  | 'PROJECT_INVALID';

export interface RelationMutationError {
  code: RelationMutationErrorCode;
  message: string;
  issues?: readonly RelationValidationIssue[];
}

export type RelationMutationResult =
  | { ok: true; project: CanonicalProject; value: RelationDefinition }
  | { ok: false; error: RelationMutationError };

const RELATION_ID_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const MAX_LABEL_LENGTH = 80;
const MAX_DESCRIPTION_LENGTH = 280;

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function cardinality(value: unknown): RelationCardinality | null {
  return RELATION_CARDINALITIES.includes(value as RelationCardinality)
    ? value as RelationCardinality
    : null;
}

export function createDefaultRelationDefinition(
  sourceContentTypeId: string,
  targetContentTypeId: string,
  id = `${sourceContentTypeId}-to-${targetContentTypeId}`,
): RelationDefinition {
  const safeId = RELATION_ID_PATTERN.test(id) ? id : 'content-relation';
  return {
    version: RELATION_DEFINITION_VERSION,
    id: safeId,
    label: 'Content relation',
    description: '',
    sourceContentTypeId,
    targetContentTypeId,
    sourceCardinality: 'many',
    targetCardinality: 'many',
    bidirectional: true,
  };
}

export function validateRelationDefinition(input: unknown): RelationValidationResult {
  if (!isJsonObject(input)) {
    return { ok: false, issues: [{ code: 'INVALID_OBJECT', path: '$', message: 'Relation must be a JSON object.' }] };
  }

  const issues: RelationValidationIssue[] = [];
  const id = text(input.id);
  const label = text(input.label);
  const description = typeof input.description === 'string' ? input.description.trim() : '';
  const sourceContentTypeId = text(input.sourceContentTypeId);
  const targetContentTypeId = text(input.targetContentTypeId);
  const sourceCardinality = cardinality(input.sourceCardinality);
  const targetCardinality = cardinality(input.targetCardinality);

  if (input.version !== RELATION_DEFINITION_VERSION) {
    issues.push({ code: 'INVALID_VERSION', path: 'version', message: `Relation version must be ${RELATION_DEFINITION_VERSION}.` });
  }
  if (!RELATION_ID_PATTERN.test(id) || id.length > 64) {
    issues.push({ code: 'INVALID_ID', path: 'id', message: 'Relation id must be kebab-case, begin with a letter and be at most 64 characters.' });
  }
  if (!label || label.length > MAX_LABEL_LENGTH) {
    issues.push({ code: 'INVALID_LABEL', path: 'label', message: `Relation label is required and must be at most ${MAX_LABEL_LENGTH} characters.` });
  }
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    issues.push({ code: 'INVALID_DESCRIPTION', path: 'description', message: `Relation description must be at most ${MAX_DESCRIPTION_LENGTH} characters.` });
  }
  if (!sourceContentTypeId) {
    issues.push({ code: 'INVALID_SOURCE_CONTENT_TYPE', path: 'sourceContentTypeId', message: 'Source Content Type id is required.' });
  }
  if (!targetContentTypeId) {
    issues.push({ code: 'INVALID_TARGET_CONTENT_TYPE', path: 'targetContentTypeId', message: 'Target Content Type id is required.' });
  }
  if (!sourceCardinality) {
    issues.push({ code: 'INVALID_SOURCE_CARDINALITY', path: 'sourceCardinality', message: 'Source cardinality must be one or many.' });
  }
  if (!targetCardinality) {
    issues.push({ code: 'INVALID_TARGET_CARDINALITY', path: 'targetCardinality', message: 'Target cardinality must be one or many.' });
  }
  if (typeof input.bidirectional !== 'boolean') {
    issues.push({ code: 'INVALID_BIDIRECTIONAL', path: 'bidirectional', message: 'Bidirectional must be boolean.' });
  }

  if (issues.length > 0 || !sourceCardinality || !targetCardinality) return { ok: false, issues };
  return {
    ok: true,
    value: {
      version: RELATION_DEFINITION_VERSION,
      id,
      label,
      description,
      sourceContentTypeId,
      targetContentTypeId,
      sourceCardinality,
      targetCardinality,
      bidirectional: input.bidirectional as boolean,
    },
  };
}

export function serializeRelationDefinition(definition: RelationDefinition): JsonObject {
  return {
    version: definition.version,
    id: definition.id,
    label: definition.label,
    description: definition.description,
    sourceContentTypeId: definition.sourceContentTypeId,
    targetContentTypeId: definition.targetContentTypeId,
    sourceCardinality: definition.sourceCardinality,
    targetCardinality: definition.targetCardinality,
    bidirectional: definition.bidirectional,
  };
}

export function listRelationDefinitions(project: CanonicalProject): RelationDefinition[] {
  return Object.values(project.relations)
    .map(validateRelationDefinition)
    .filter((result): result is { ok: true; value: RelationDefinition } => result.ok)
    .map((result) => result.value)
    .sort((a, b) => a.label.localeCompare(b.label));
}

function contentTypeExists(project: CanonicalProject, id: string): boolean {
  return listContentTypeDefinitions(project).some((definition) => definition.id === id);
}

function withRelations(
  project: CanonicalProject,
  relations: CanonicalProject['relations'],
  value: RelationDefinition,
): RelationMutationResult {
  const next: CanonicalProject = {
    ...project,
    metadata: { ...project.metadata, updatedAt: new Date().toISOString() },
    relations,
  };
  const validation = validateCanonicalProject(next);
  return validation.ok
    ? { ok: true, project: validation.value, value }
    : { ok: false, error: { code: 'PROJECT_INVALID', message: validation.error.message } };
}

function validateEndpoints(project: CanonicalProject, definition: RelationDefinition): RelationMutationError | null {
  if (!contentTypeExists(project, definition.sourceContentTypeId)) {
    return { code: 'UNKNOWN_SOURCE_CONTENT_TYPE', message: `Source Content Type ${definition.sourceContentTypeId} does not exist.` };
  }
  if (!contentTypeExists(project, definition.targetContentTypeId)) {
    return { code: 'UNKNOWN_TARGET_CONTENT_TYPE', message: `Target Content Type ${definition.targetContentTypeId} does not exist.` };
  }
  return null;
}

export function createRelation(project: CanonicalProject, input: unknown): RelationMutationResult {
  const validation = validateRelationDefinition(input);
  if (!validation.ok) {
    return { ok: false, error: { code: 'INVALID_DEFINITION', message: validation.issues.map((issue) => issue.message).join(' '), issues: validation.issues } };
  }
  const definition = validation.value;
  if (definition.id in project.relations) {
    return { ok: false, error: { code: 'DUPLICATE_ID', message: `Relation ${definition.id} already exists.` } };
  }
  const endpointError = validateEndpoints(project, definition);
  if (endpointError) return { ok: false, error: endpointError };
  return withRelations(project, { ...project.relations, [definition.id]: serializeRelationDefinition(definition) }, definition);
}

export function updateRelation(project: CanonicalProject, id: string, input: unknown): RelationMutationResult {
  if (!(id in project.relations)) {
    return { ok: false, error: { code: 'NOT_FOUND', message: `Relation ${id} was not found.` } };
  }
  const validation = validateRelationDefinition(input);
  if (!validation.ok) {
    return { ok: false, error: { code: 'INVALID_DEFINITION', message: validation.issues.map((issue) => issue.message).join(' '), issues: validation.issues } };
  }
  const definition = validation.value;
  if (definition.id !== id) {
    return { ok: false, error: { code: 'ID_MISMATCH', message: 'Relation id is immutable after creation.' } };
  }
  const endpointError = validateEndpoints(project, definition);
  if (endpointError) return { ok: false, error: endpointError };
  return withRelations(project, { ...project.relations, [id]: serializeRelationDefinition(definition) }, definition);
}

export function removeRelation(project: CanonicalProject, id: string): RelationMutationResult {
  const raw = project.relations[id];
  if (!raw) return { ok: false, error: { code: 'NOT_FOUND', message: `Relation ${id} was not found.` } };
  const validation = validateRelationDefinition(raw);
  if (!validation.ok) {
    return { ok: false, error: { code: 'INVALID_DEFINITION', message: 'Existing relation definition is invalid.', issues: validation.issues } };
  }

  const referencedByField = Object.values(project.fieldGroups).some((group) => {
    if (!isJsonObject(group) || !Array.isArray(group.fields)) return false;
    return group.fields.some((field) => isJsonObject(field) && isJsonObject(field.config) && field.config.relationId === id);
  });
  if (referencedByField) {
    return { ok: false, error: { code: 'RELATION_IN_USE', message: `Relation ${id} is referenced by a Field Group and cannot be deleted.` } };
  }

  const relations = { ...project.relations };
  delete relations[id];
  return withRelations(project, relations, validation.value);
}
