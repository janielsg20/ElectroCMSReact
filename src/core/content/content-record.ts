import { isJsonObject, isJsonValue, type JsonObject, type JsonValue } from '../domain';
import { validateCanonicalProject, type CanonicalProject } from '../project';
import { createDefaultFieldTypeRegistry } from './builtin-field-types';
import { listContentTypeDefinitions } from './content-type';
import { validateFieldGroupDefinition, type FieldGroupDefinition } from './field-group';
import { FieldTypeRegistry } from './field-type-registry';

export const CONTENT_RECORD_VERSION = 1 as const;
export const CONTENT_RECORD_STATUSES = ['draft', 'published', 'archived'] as const;

export type ContentRecordStatus = (typeof CONTENT_RECORD_STATUSES)[number];

export interface ContentRecordDefinition {
  version: typeof CONTENT_RECORD_VERSION;
  id: string;
  contentTypeId: string;
  status: ContentRecordStatus;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  fieldGroupIds: string[];
  fieldValues: Record<string, JsonObject>;
  createdAt: string;
  updatedAt: string;
}

export type ContentRecordValidationCode =
  | 'INVALID_OBJECT'
  | 'INVALID_VERSION'
  | 'INVALID_ID'
  | 'INVALID_CONTENT_TYPE'
  | 'INVALID_STATUS'
  | 'INVALID_TITLE'
  | 'INVALID_SLUG'
  | 'INVALID_EXCERPT'
  | 'INVALID_CONTENT'
  | 'INVALID_FIELD_GROUPS'
  | 'UNKNOWN_FIELD_GROUP'
  | 'INVALID_FIELD_VALUES'
  | 'UNKNOWN_FIELD_VALUE'
  | 'REQUIRED_FIELD_MISSING'
  | 'INVALID_FIELD_VALUE'
  | 'INVALID_CREATED_AT'
  | 'INVALID_UPDATED_AT';

export interface ContentRecordValidationIssue {
  code: ContentRecordValidationCode;
  path: string;
  message: string;
}

export type ContentRecordValidationResult =
  | { ok: true; value: ContentRecordDefinition }
  | { ok: false; issues: readonly ContentRecordValidationIssue[] };

export type ContentRecordMutationErrorCode =
  | 'INVALID_DEFINITION'
  | 'DUPLICATE_ID'
  | 'DUPLICATE_SLUG'
  | 'NOT_FOUND'
  | 'ID_MISMATCH'
  | 'CREATED_AT_MISMATCH'
  | 'PROJECT_INVALID';

export interface ContentRecordMutationError {
  code: ContentRecordMutationErrorCode;
  message: string;
  issues?: readonly ContentRecordValidationIssue[];
}

export type ContentRecordMutationResult =
  | { ok: true; project: CanonicalProject; value: ContentRecordDefinition }
  | { ok: false; error: ContentRecordMutationError };

export interface ContentRecordListOptions {
  contentTypeId?: string;
  status?: ContentRecordStatus;
  search?: string;
}

const RECORD_ID_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_TITLE_LENGTH = 200;
const MAX_SLUG_LENGTH = 120;
const MAX_EXCERPT_LENGTH = 2_000;
const MAX_CONTENT_LENGTH = 500_000;
const MAX_FIELD_GROUPS = 64;

function defaultRegistry(): FieldTypeRegistry {
  return createDefaultFieldTypeRegistry();
}

function trimmedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function addIssue(
  issues: ContentRecordValidationIssue[],
  code: ContentRecordValidationCode,
  path: string,
  message: string,
): void {
  issues.push({ code, path, message });
}

function isIsoTimestamp(value: unknown): value is string {
  if (typeof value !== 'string' || !value.trim()) return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && new Date(parsed).toISOString() === value;
}

function normalizeStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length > MAX_FIELD_GROUPS) return null;
  const normalized: string[] = [];
  for (const item of value) {
    if (typeof item !== 'string' || !item.trim()) return null;
    normalized.push(item.trim());
  }
  return new Set(normalized).size === normalized.length ? normalized : null;
}

function isRequiredValueMissing(value: JsonValue): boolean {
  if (value === null) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function resolveFieldGroup(
  project: CanonicalProject,
  id: string,
  registry: FieldTypeRegistry,
): FieldGroupDefinition | null {
  const raw = project.fieldGroups[id];
  if (!raw) return null;
  const validation = validateFieldGroupDefinition(raw, registry);
  return validation.ok ? validation.value : null;
}

function normalizeFieldValues(
  input: unknown,
  fieldGroupIds: readonly string[],
  project: CanonicalProject,
  registry: FieldTypeRegistry,
  issues: ContentRecordValidationIssue[],
): Record<string, JsonObject> | null {
  if (!isJsonObject(input)) {
    addIssue(issues, 'INVALID_FIELD_VALUES', 'fieldValues', 'Field values must be a portable JSON object.');
    return null;
  }

  const allowedGroupIds = new Set(fieldGroupIds);
  for (const groupId of Object.keys(input)) {
    if (!allowedGroupIds.has(groupId)) {
      addIssue(
        issues,
        'UNKNOWN_FIELD_VALUE',
        `fieldValues.${groupId}`,
        `Values were provided for unselected field group ${groupId}.`,
      );
    }
  }

  const normalized: Record<string, JsonObject> = {};
  for (const groupId of fieldGroupIds) {
    const group = resolveFieldGroup(project, groupId, registry);
    if (!group) {
      addIssue(
        issues,
        'UNKNOWN_FIELD_GROUP',
        'fieldGroupIds',
        `Field group ${groupId} does not exist or is invalid.`,
      );
      continue;
    }

    const rawGroupValues = input[groupId];
    if (rawGroupValues !== undefined && !isJsonObject(rawGroupValues)) {
      addIssue(
        issues,
        'INVALID_FIELD_VALUES',
        `fieldValues.${groupId}`,
        `Values for ${group.label} must be a portable JSON object.`,
      );
      continue;
    }
    const source = isJsonObject(rawGroupValues) ? rawGroupValues : {};
    const allowedNames = new Set(group.fields.map((field) => field.name));
    for (const key of Object.keys(source)) {
      if (!allowedNames.has(key)) {
        addIssue(
          issues,
          'UNKNOWN_FIELD_VALUE',
          `fieldValues.${groupId}.${key}`,
          `Field ${key} is not defined by ${group.label}.`,
        );
      }
    }

    const groupValues: JsonObject = {};
    for (const field of group.fields) {
      const candidate = source[field.name] === undefined
        ? structuredClone(field.defaultValue)
        : source[field.name];
      if (!isJsonValue(candidate)) {
        addIssue(
          issues,
          'INVALID_FIELD_VALUE',
          `fieldValues.${groupId}.${field.name}`,
          `${field.label} must be portable JSON.`,
        );
        continue;
      }
      if (field.required && isRequiredValueMissing(candidate)) {
        addIssue(
          issues,
          'REQUIRED_FIELD_MISSING',
          `fieldValues.${groupId}.${field.name}`,
          `${field.label} is required.`,
        );
      }
      try {
        const validation = registry.validateValue(
          field.type,
          candidate,
          field.config,
          field.typeVersion,
        );
        for (const issue of validation.issues) {
          addIssue(
            issues,
            'INVALID_FIELD_VALUE',
            `fieldValues.${groupId}.${field.name}${issue.path === '$' ? '' : `.${issue.path}`}`,
            issue.message,
          );
        }
      } catch (error) {
        addIssue(
          issues,
          'INVALID_FIELD_VALUE',
          `fieldValues.${groupId}.${field.name}`,
          error instanceof Error ? error.message : `Cannot validate ${field.label}.`,
        );
      }
      groupValues[field.name] = structuredClone(candidate);
    }
    normalized[groupId] = groupValues;
  }

  return normalized;
}

export function createDefaultContentRecordDefinition(
  project: CanonicalProject,
  contentTypeId: string,
  id = 'record',
  now = new Date().toISOString(),
): ContentRecordDefinition {
  const contentType = listContentTypeDefinitions(project).find((definition) => definition.id === contentTypeId);
  if (!contentType) throw new Error(`Content type ${contentTypeId} does not exist.`);
  const safeId = RECORD_ID_PATTERN.test(id) ? id : 'record';
  return {
    version: CONTENT_RECORD_VERSION,
    id: safeId,
    contentTypeId,
    status: 'draft',
    title: contentType.supports.title ? 'Untitled record' : '',
    slug: safeId,
    excerpt: '',
    content: '',
    fieldGroupIds: [],
    fieldValues: {},
    createdAt: now,
    updatedAt: now,
  };
}

export function validateContentRecordDefinition(
  input: unknown,
  project: CanonicalProject,
  registry: FieldTypeRegistry = defaultRegistry(),
): ContentRecordValidationResult {
  if (!isJsonObject(input)) {
    return {
      ok: false,
      issues: [{ code: 'INVALID_OBJECT', path: '$', message: 'Record must be a portable JSON object.' }],
    };
  }

  const issues: ContentRecordValidationIssue[] = [];
  const id = trimmedString(input.id);
  const contentTypeId = trimmedString(input.contentTypeId);
  const title = typeof input.title === 'string' ? input.title.trim() : '';
  const slug = trimmedString(input.slug);
  const excerpt = typeof input.excerpt === 'string' ? input.excerpt.trim() : '';
  const content = typeof input.content === 'string' ? input.content : '';
  const fieldGroupIds = normalizeStringArray(input.fieldGroupIds);
  const contentType = listContentTypeDefinitions(project).find((definition) => definition.id === contentTypeId);

  if (input.version !== CONTENT_RECORD_VERSION) {
    addIssue(issues, 'INVALID_VERSION', 'version', `Record version must be ${CONTENT_RECORD_VERSION}.`);
  }
  if (!RECORD_ID_PATTERN.test(id) || id.length > 80) {
    addIssue(issues, 'INVALID_ID', 'id', 'Record id must be kebab-case and at most 80 characters.');
  }
  if (!contentType) {
    addIssue(issues, 'INVALID_CONTENT_TYPE', 'contentTypeId', `Content type ${contentTypeId || '(empty)'} does not exist.`);
  }
  if (!CONTENT_RECORD_STATUSES.includes(input.status as ContentRecordStatus)) {
    addIssue(issues, 'INVALID_STATUS', 'status', 'Record status must be draft, published or archived.');
  }
  if (typeof input.title !== 'string' || title.length > MAX_TITLE_LENGTH || (contentType?.supports.title && !title)) {
    addIssue(
      issues,
      'INVALID_TITLE',
      'title',
      `Title must be a string of at most ${MAX_TITLE_LENGTH} characters${contentType?.supports.title ? ' and cannot be empty' : ''}.`,
    );
  }
  if (!SLUG_PATTERN.test(slug) || slug.length > MAX_SLUG_LENGTH) {
    addIssue(issues, 'INVALID_SLUG', 'slug', `Slug must be lowercase kebab-case and at most ${MAX_SLUG_LENGTH} characters.`);
  }
  if (typeof input.excerpt !== 'string' || excerpt.length > MAX_EXCERPT_LENGTH) {
    addIssue(issues, 'INVALID_EXCERPT', 'excerpt', `Excerpt must be at most ${MAX_EXCERPT_LENGTH} characters.`);
  }
  if (typeof input.content !== 'string' || content.length > MAX_CONTENT_LENGTH) {
    addIssue(issues, 'INVALID_CONTENT', 'content', `Content must be at most ${MAX_CONTENT_LENGTH} characters.`);
  }
  if (!fieldGroupIds) {
    addIssue(
      issues,
      'INVALID_FIELD_GROUPS',
      'fieldGroupIds',
      `Field group ids must be a unique string array with at most ${MAX_FIELD_GROUPS} entries.`,
    );
  }
  if (!isIsoTimestamp(input.createdAt)) {
    addIssue(issues, 'INVALID_CREATED_AT', 'createdAt', 'createdAt must be a canonical ISO timestamp.');
  }
  if (!isIsoTimestamp(input.updatedAt)) {
    addIssue(issues, 'INVALID_UPDATED_AT', 'updatedAt', 'updatedAt must be a canonical ISO timestamp.');
  }

  const normalizedFieldValues = fieldGroupIds
    ? normalizeFieldValues(input.fieldValues, fieldGroupIds, project, registry, issues)
    : null;

  if (
    issues.length > 0 ||
    !contentType ||
    !fieldGroupIds ||
    !normalizedFieldValues ||
    !isIsoTimestamp(input.createdAt) ||
    !isIsoTimestamp(input.updatedAt) ||
    !CONTENT_RECORD_STATUSES.includes(input.status as ContentRecordStatus)
  ) {
    return { ok: false, issues };
  }

  return {
    ok: true,
    value: {
      version: CONTENT_RECORD_VERSION,
      id,
      contentTypeId,
      status: input.status as ContentRecordStatus,
      title,
      slug,
      excerpt,
      content,
      fieldGroupIds,
      fieldValues: normalizedFieldValues,
      createdAt: input.createdAt,
      updatedAt: input.updatedAt,
    },
  };
}

export function serializeContentRecordDefinition(record: ContentRecordDefinition): JsonObject {
  const fieldValues: JsonObject = {};
  for (const [groupId, values] of Object.entries(record.fieldValues)) {
    fieldValues[groupId] = structuredClone(values);
  }
  return {
    version: record.version,
    id: record.id,
    contentTypeId: record.contentTypeId,
    status: record.status,
    title: record.title,
    slug: record.slug,
    excerpt: record.excerpt,
    content: record.content,
    fieldGroupIds: [...record.fieldGroupIds],
    fieldValues,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export function listContentRecords(
  project: CanonicalProject,
  options: ContentRecordListOptions = {},
  registry: FieldTypeRegistry = defaultRegistry(),
): ContentRecordDefinition[] {
  const search = options.search?.trim().toLowerCase() ?? '';
  return Object.values(project.records)
    .map((raw) => validateContentRecordDefinition(raw, project, registry))
    .filter((result): result is { ok: true; value: ContentRecordDefinition } => result.ok)
    .map((result) => result.value)
    .filter((record) => !options.contentTypeId || record.contentTypeId === options.contentTypeId)
    .filter((record) => !options.status || record.status === options.status)
    .filter((record) => !search || `${record.title} ${record.slug}`.toLowerCase().includes(search))
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

function slugBelongsToAnotherRecord(
  project: CanonicalProject,
  contentTypeId: string,
  slug: string,
  excludedId?: string,
): boolean {
  return listContentRecords(project).some(
    (record) => record.id !== excludedId && record.contentTypeId === contentTypeId && record.slug === slug,
  );
}

function withValidatedProject(
  project: CanonicalProject,
  records: CanonicalProject['records'],
  value: ContentRecordDefinition,
): ContentRecordMutationResult {
  const nextProject: CanonicalProject = {
    ...project,
    metadata: { ...project.metadata, updatedAt: new Date().toISOString() },
    records,
  };
  const validation = validateCanonicalProject(nextProject);
  return validation.ok
    ? { ok: true, project: validation.value, value }
    : { ok: false, error: { code: 'PROJECT_INVALID', message: validation.error.message } };
}

export function createContentRecord(
  project: CanonicalProject,
  input: unknown,
  registry: FieldTypeRegistry = defaultRegistry(),
): ContentRecordMutationResult {
  const validation = validateContentRecordDefinition(input, project, registry);
  if (!validation.ok) {
    return {
      ok: false,
      error: {
        code: 'INVALID_DEFINITION',
        message: validation.issues.map((issue) => issue.message).join(' '),
        issues: validation.issues,
      },
    };
  }
  const record = validation.value;
  if (record.id in project.records) {
    return { ok: false, error: { code: 'DUPLICATE_ID', message: `Record ${record.id} already exists.` } };
  }
  if (slugBelongsToAnotherRecord(project, record.contentTypeId, record.slug)) {
    return {
      ok: false,
      error: { code: 'DUPLICATE_SLUG', message: `Slug ${record.slug} is already used by this content type.` },
    };
  }
  return withValidatedProject(
    project,
    { ...project.records, [record.id]: serializeContentRecordDefinition(record) },
    record,
  );
}

export function updateContentRecord(
  project: CanonicalProject,
  id: string,
  input: unknown,
  registry: FieldTypeRegistry = defaultRegistry(),
): ContentRecordMutationResult {
  const existingRaw = project.records[id];
  if (!existingRaw) {
    return { ok: false, error: { code: 'NOT_FOUND', message: `Record ${id} was not found.` } };
  }
  const existingValidation = validateContentRecordDefinition(existingRaw, project, registry);
  if (!existingValidation.ok) {
    return {
      ok: false,
      error: { code: 'INVALID_DEFINITION', message: 'Existing record is invalid.', issues: existingValidation.issues },
    };
  }
  const validation = validateContentRecordDefinition(input, project, registry);
  if (!validation.ok) {
    return {
      ok: false,
      error: {
        code: 'INVALID_DEFINITION',
        message: validation.issues.map((issue) => issue.message).join(' '),
        issues: validation.issues,
      },
    };
  }
  const candidate = validation.value;
  if (candidate.id !== id) {
    return { ok: false, error: { code: 'ID_MISMATCH', message: 'Record id is immutable after creation.' } };
  }
  if (candidate.createdAt !== existingValidation.value.createdAt) {
    return { ok: false, error: { code: 'CREATED_AT_MISMATCH', message: 'Record createdAt is immutable.' } };
  }
  if (slugBelongsToAnotherRecord(project, candidate.contentTypeId, candidate.slug, id)) {
    return {
      ok: false,
      error: { code: 'DUPLICATE_SLUG', message: `Slug ${candidate.slug} is already used by this content type.` },
    };
  }
  const updated: ContentRecordDefinition = {
    ...candidate,
    updatedAt: new Date().toISOString(),
  };
  return withValidatedProject(
    project,
    { ...project.records, [id]: serializeContentRecordDefinition(updated) },
    updated,
  );
}

export function removeContentRecord(
  project: CanonicalProject,
  id: string,
  registry: FieldTypeRegistry = defaultRegistry(),
): ContentRecordMutationResult {
  const existingRaw = project.records[id];
  if (!existingRaw) {
    return { ok: false, error: { code: 'NOT_FOUND', message: `Record ${id} was not found.` } };
  }
  const validation = validateContentRecordDefinition(existingRaw, project, registry);
  if (!validation.ok) {
    return {
      ok: false,
      error: { code: 'INVALID_DEFINITION', message: 'Existing record is invalid.', issues: validation.issues },
    };
  }
  const records = { ...project.records };
  delete records[id];
  return withValidatedProject(project, records, validation.value);
}
