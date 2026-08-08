import { isJsonObject, type JsonObject } from '../domain';
import { validateCanonicalProject, type CanonicalProject } from '../project';
import { listContentTypeDefinitions } from './content-type';

export const TAXONOMY_DEFINITION_VERSION = 1 as const;

export interface TaxonomyDefinition {
  version: typeof TAXONOMY_DEFINITION_VERSION;
  id: string;
  label: string;
  singularLabel: string;
  slug: string;
  description: string;
  hierarchical: boolean;
  contentTypeIds: string[];
  fieldGroupIds: string[];
  archiveTemplateId: string | null;
}

export type TaxonomyValidationCode =
  | 'INVALID_OBJECT'
  | 'INVALID_VERSION'
  | 'INVALID_ID'
  | 'INVALID_LABEL'
  | 'INVALID_SINGULAR_LABEL'
  | 'INVALID_SLUG'
  | 'INVALID_DESCRIPTION'
  | 'INVALID_HIERARCHICAL'
  | 'INVALID_CONTENT_TYPES'
  | 'INVALID_FIELD_GROUPS'
  | 'INVALID_ARCHIVE_TEMPLATE';

export interface TaxonomyValidationIssue {
  code: TaxonomyValidationCode;
  path: string;
  message: string;
}

export type TaxonomyValidationResult =
  | { ok: true; value: TaxonomyDefinition }
  | { ok: false; issues: readonly TaxonomyValidationIssue[] };

export type TaxonomyMutationErrorCode =
  | 'INVALID_DEFINITION'
  | 'DUPLICATE_ID'
  | 'DUPLICATE_SLUG'
  | 'NOT_FOUND'
  | 'ID_MISMATCH'
  | 'UNKNOWN_CONTENT_TYPE'
  | 'UNKNOWN_FIELD_GROUP'
  | 'UNKNOWN_ARCHIVE_TEMPLATE'
  | 'PROJECT_INVALID';

export interface TaxonomyMutationError {
  code: TaxonomyMutationErrorCode;
  message: string;
  issues?: readonly TaxonomyValidationIssue[];
}

export type TaxonomyMutationResult =
  | { ok: true; project: CanonicalProject; value: TaxonomyDefinition }
  | { ok: false; error: TaxonomyMutationError };

const TAXONOMY_ID_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const TAXONOMY_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_LABEL_LENGTH = 80;
const MAX_DESCRIPTION_LENGTH = 280;

function trimmedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function stringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const normalized: string[] = [];
  for (const item of value) {
    if (typeof item !== 'string' || !item.trim()) return null;
    normalized.push(item.trim());
  }
  return normalized;
}

function hasDuplicates(values: readonly string[]): boolean {
  return new Set(values).size !== values.length;
}

export function createDefaultTaxonomyDefinition(
  id = 'taxonomy',
  label = 'Taxonomy',
  contentTypeIds: readonly string[] = [],
): TaxonomyDefinition {
  const safeId = TAXONOMY_ID_PATTERN.test(id) ? id : 'taxonomy';
  return {
    version: TAXONOMY_DEFINITION_VERSION,
    id: safeId,
    label,
    singularLabel: label,
    slug: safeId,
    description: '',
    hierarchical: true,
    contentTypeIds: [...contentTypeIds],
    fieldGroupIds: [],
    archiveTemplateId: null,
  };
}

export function validateTaxonomyDefinition(input: unknown): TaxonomyValidationResult {
  if (!isJsonObject(input)) {
    return {
      ok: false,
      issues: [{ code: 'INVALID_OBJECT', path: '$', message: 'Taxonomy must be a JSON object.' }],
    };
  }

  const issues: TaxonomyValidationIssue[] = [];
  const id = trimmedString(input.id);
  const label = trimmedString(input.label);
  const singularLabel = trimmedString(input.singularLabel);
  const slug = trimmedString(input.slug);
  const description = typeof input.description === 'string' ? input.description.trim() : '';
  const contentTypeIds = stringArray(input.contentTypeIds);
  const fieldGroupIds = stringArray(input.fieldGroupIds);
  const archiveTemplateId = input.archiveTemplateId === null ? null : trimmedString(input.archiveTemplateId);

  if (input.version !== TAXONOMY_DEFINITION_VERSION) {
    issues.push({
      code: 'INVALID_VERSION',
      path: 'version',
      message: `Taxonomy version must be ${TAXONOMY_DEFINITION_VERSION}.`,
    });
  }
  if (!TAXONOMY_ID_PATTERN.test(id) || id.length > 64) {
    issues.push({
      code: 'INVALID_ID',
      path: 'id',
      message: 'Taxonomy id must be kebab-case, begin with a letter and be at most 64 characters.',
    });
  }
  if (!label || label.length > MAX_LABEL_LENGTH) {
    issues.push({
      code: 'INVALID_LABEL',
      path: 'label',
      message: `Label is required and must be at most ${MAX_LABEL_LENGTH} characters.`,
    });
  }
  if (!singularLabel || singularLabel.length > MAX_LABEL_LENGTH) {
    issues.push({
      code: 'INVALID_SINGULAR_LABEL',
      path: 'singularLabel',
      message: `Singular label is required and must be at most ${MAX_LABEL_LENGTH} characters.`,
    });
  }
  if (!TAXONOMY_SLUG_PATTERN.test(slug) || slug.length > 80) {
    issues.push({
      code: 'INVALID_SLUG',
      path: 'slug',
      message: 'Slug must be lowercase kebab-case and at most 80 characters.',
    });
  }
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    issues.push({
      code: 'INVALID_DESCRIPTION',
      path: 'description',
      message: `Description must be at most ${MAX_DESCRIPTION_LENGTH} characters.`,
    });
  }
  if (typeof input.hierarchical !== 'boolean') {
    issues.push({
      code: 'INVALID_HIERARCHICAL',
      path: 'hierarchical',
      message: 'Hierarchical must be boolean.',
    });
  }
  if (!contentTypeIds || contentTypeIds.length === 0 || hasDuplicates(contentTypeIds)) {
    issues.push({
      code: 'INVALID_CONTENT_TYPES',
      path: 'contentTypeIds',
      message: 'Taxonomy must target one or more unique content type ids.',
    });
  }
  if (!fieldGroupIds || hasDuplicates(fieldGroupIds)) {
    issues.push({
      code: 'INVALID_FIELD_GROUPS',
      path: 'fieldGroupIds',
      message: 'Field group ids must be a unique string list.',
    });
  }
  if (input.archiveTemplateId !== null && !archiveTemplateId) {
    issues.push({
      code: 'INVALID_ARCHIVE_TEMPLATE',
      path: 'archiveTemplateId',
      message: 'Archive template id must be null or a non-empty string.',
    });
  }

  if (issues.length > 0 || !contentTypeIds || !fieldGroupIds) return { ok: false, issues };
  return {
    ok: true,
    value: {
      version: TAXONOMY_DEFINITION_VERSION,
      id,
      label,
      singularLabel,
      slug,
      description,
      hierarchical: input.hierarchical as boolean,
      contentTypeIds,
      fieldGroupIds,
      archiveTemplateId,
    },
  };
}

export function serializeTaxonomyDefinition(definition: TaxonomyDefinition): JsonObject {
  return {
    version: definition.version,
    id: definition.id,
    label: definition.label,
    singularLabel: definition.singularLabel,
    slug: definition.slug,
    description: definition.description,
    hierarchical: definition.hierarchical,
    contentTypeIds: [...definition.contentTypeIds],
    fieldGroupIds: [...definition.fieldGroupIds],
    archiveTemplateId: definition.archiveTemplateId,
  };
}

export function listTaxonomyDefinitions(project: CanonicalProject): TaxonomyDefinition[] {
  return Object.values(project.taxonomies)
    .map((value) => validateTaxonomyDefinition(value))
    .filter((result): result is { ok: true; value: TaxonomyDefinition } => result.ok)
    .map((result) => result.value)
    .sort((a, b) => a.label.localeCompare(b.label));
}

function slugBelongsToAnotherTaxonomy(
  project: CanonicalProject,
  slug: string,
  excludedId?: string,
): boolean {
  return listTaxonomyDefinitions(project).some(
    (definition) => definition.id !== excludedId && definition.slug === slug,
  );
}

function validateReferences(
  project: CanonicalProject,
  definition: TaxonomyDefinition,
): TaxonomyMutationError | null {
  const knownContentTypes = new Set(listContentTypeDefinitions(project).map((contentType) => contentType.id));
  const unknownContentType = definition.contentTypeIds.find((id) => !knownContentTypes.has(id));
  if (unknownContentType) {
    return {
      code: 'UNKNOWN_CONTENT_TYPE',
      message: `Taxonomy references unknown content type ${unknownContentType}.`,
    };
  }

  const unknownFieldGroup = definition.fieldGroupIds.find((id) => !(id in project.fieldGroups));
  if (unknownFieldGroup) {
    return {
      code: 'UNKNOWN_FIELD_GROUP',
      message: `Taxonomy references unknown field group ${unknownFieldGroup}.`,
    };
  }

  if (definition.archiveTemplateId !== null) {
    const document = project.documents[definition.archiveTemplateId];
    if (!document || document.kind !== 'archive') {
      return {
        code: 'UNKNOWN_ARCHIVE_TEMPLATE',
        message: `Taxonomy archive template ${definition.archiveTemplateId} is not an archive document.`,
      };
    }
  }

  return null;
}

function withValidatedProject(
  project: CanonicalProject,
  taxonomies: CanonicalProject['taxonomies'],
  value: TaxonomyDefinition,
): TaxonomyMutationResult {
  const nextProject: CanonicalProject = {
    ...project,
    metadata: { ...project.metadata, updatedAt: new Date().toISOString() },
    taxonomies,
  };
  const validation = validateCanonicalProject(nextProject);
  return validation.ok
    ? { ok: true, project: validation.value, value }
    : { ok: false, error: { code: 'PROJECT_INVALID', message: validation.error.message } };
}

export function createTaxonomy(project: CanonicalProject, input: unknown): TaxonomyMutationResult {
  const validation = validateTaxonomyDefinition(input);
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
  const definition = validation.value;
  if (definition.id in project.taxonomies) {
    return { ok: false, error: { code: 'DUPLICATE_ID', message: `Taxonomy ${definition.id} already exists.` } };
  }
  if (slugBelongsToAnotherTaxonomy(project, definition.slug)) {
    return { ok: false, error: { code: 'DUPLICATE_SLUG', message: `Taxonomy slug ${definition.slug} is already used.` } };
  }
  const referenceError = validateReferences(project, definition);
  if (referenceError) return { ok: false, error: referenceError };

  return withValidatedProject(
    project,
    { ...project.taxonomies, [definition.id]: serializeTaxonomyDefinition(definition) },
    definition,
  );
}

export function updateTaxonomy(
  project: CanonicalProject,
  id: string,
  input: unknown,
): TaxonomyMutationResult {
  if (!(id in project.taxonomies)) {
    return { ok: false, error: { code: 'NOT_FOUND', message: `Taxonomy ${id} was not found.` } };
  }
  const validation = validateTaxonomyDefinition(input);
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
  const definition = validation.value;
  if (definition.id !== id) {
    return { ok: false, error: { code: 'ID_MISMATCH', message: 'Taxonomy id is immutable after creation.' } };
  }
  if (slugBelongsToAnotherTaxonomy(project, definition.slug, id)) {
    return { ok: false, error: { code: 'DUPLICATE_SLUG', message: `Taxonomy slug ${definition.slug} is already used.` } };
  }
  const referenceError = validateReferences(project, definition);
  if (referenceError) return { ok: false, error: referenceError };

  return withValidatedProject(
    project,
    { ...project.taxonomies, [id]: serializeTaxonomyDefinition(definition) },
    definition,
  );
}

export function removeTaxonomy(project: CanonicalProject, id: string): TaxonomyMutationResult {
  const current = project.taxonomies[id];
  if (!current) {
    return { ok: false, error: { code: 'NOT_FOUND', message: `Taxonomy ${id} was not found.` } };
  }
  const validation = validateTaxonomyDefinition(current);
  if (!validation.ok) {
    return {
      ok: false,
      error: { code: 'INVALID_DEFINITION', message: 'Existing taxonomy definition is invalid.', issues: validation.issues },
    };
  }
  const taxonomies = { ...project.taxonomies };
  delete taxonomies[id];
  return withValidatedProject(project, taxonomies, validation.value);
}
