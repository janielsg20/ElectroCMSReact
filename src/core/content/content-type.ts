import { isJsonObject, type JsonObject } from '../domain';
import { validateCanonicalProject, type CanonicalProject } from '../project';

export const CONTENT_TYPE_DEFINITION_VERSION = 1 as const;

export interface ContentTypeSupports {
  title: boolean;
  editor: boolean;
  excerpt: boolean;
  featuredImage: boolean;
}

export interface ContentTypeDefinition {
  version: typeof CONTENT_TYPE_DEFINITION_VERSION;
  id: string;
  label: string;
  singularLabel: string;
  slug: string;
  description: string;
  public: boolean;
  hierarchical: boolean;
  supports: ContentTypeSupports;
}

export type ContentTypeValidationCode =
  | 'INVALID_OBJECT'
  | 'INVALID_VERSION'
  | 'INVALID_ID'
  | 'INVALID_LABEL'
  | 'INVALID_SINGULAR_LABEL'
  | 'INVALID_SLUG'
  | 'INVALID_DESCRIPTION'
  | 'INVALID_PUBLIC'
  | 'INVALID_HIERARCHICAL'
  | 'INVALID_SUPPORTS';

export interface ContentTypeValidationIssue {
  code: ContentTypeValidationCode;
  path: string;
  message: string;
}

export type ContentTypeValidationResult =
  | { ok: true; value: ContentTypeDefinition }
  | { ok: false; issues: readonly ContentTypeValidationIssue[] };

export type ContentTypeMutationErrorCode =
  | 'INVALID_DEFINITION'
  | 'DUPLICATE_ID'
  | 'DUPLICATE_SLUG'
  | 'NOT_FOUND'
  | 'ID_MISMATCH'
  | 'CONTENT_TYPE_IN_USE'
  | 'PROJECT_INVALID';

export interface ContentTypeMutationError {
  code: ContentTypeMutationErrorCode;
  message: string;
  issues?: readonly ContentTypeValidationIssue[];
}

export type ContentTypeMutationResult =
  | { ok: true; project: CanonicalProject; value: ContentTypeDefinition }
  | { ok: false; error: ContentTypeMutationError };

const CONTENT_TYPE_ID_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const CONTENT_TYPE_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_LABEL_LENGTH = 80;
const MAX_DESCRIPTION_LENGTH = 280;

function trimmedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function supportsFromUnknown(value: unknown): ContentTypeSupports | null {
  if (!isJsonObject(value)) return null;
  const keys = ['title', 'editor', 'excerpt', 'featuredImage'] as const;
  if (!keys.every((key) => typeof value[key] === 'boolean')) return null;
  return {
    title: value.title as boolean,
    editor: value.editor as boolean,
    excerpt: value.excerpt as boolean,
    featuredImage: value.featuredImage as boolean,
  };
}

export function createDefaultContentTypeDefinition(
  id = 'content-type',
  label = 'Content Type',
): ContentTypeDefinition {
  const safeId = CONTENT_TYPE_ID_PATTERN.test(id) ? id : 'content-type';
  return {
    version: CONTENT_TYPE_DEFINITION_VERSION,
    id: safeId,
    label,
    singularLabel: label,
    slug: safeId,
    description: '',
    public: true,
    hierarchical: false,
    supports: {
      title: true,
      editor: true,
      excerpt: false,
      featuredImage: false,
    },
  };
}

export function validateContentTypeDefinition(input: unknown): ContentTypeValidationResult {
  if (!isJsonObject(input)) {
    return {
      ok: false,
      issues: [{ code: 'INVALID_OBJECT', path: '$', message: 'Content type must be a JSON object.' }],
    };
  }

  const issues: ContentTypeValidationIssue[] = [];
  const id = trimmedString(input.id);
  const label = trimmedString(input.label);
  const singularLabel = trimmedString(input.singularLabel);
  const slug = trimmedString(input.slug);
  const description = typeof input.description === 'string' ? input.description.trim() : '';
  const supports = supportsFromUnknown(input.supports);

  if (input.version !== CONTENT_TYPE_DEFINITION_VERSION) {
    issues.push({
      code: 'INVALID_VERSION',
      path: 'version',
      message: `Content type version must be ${CONTENT_TYPE_DEFINITION_VERSION}.`,
    });
  }
  if (!CONTENT_TYPE_ID_PATTERN.test(id) || id.length > 64) {
    issues.push({
      code: 'INVALID_ID',
      path: 'id',
      message: 'Content type id must be kebab-case, begin with a letter and be at most 64 characters.',
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
  if (!CONTENT_TYPE_SLUG_PATTERN.test(slug) || slug.length > 80) {
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
  if (typeof input.public !== 'boolean') {
    issues.push({ code: 'INVALID_PUBLIC', path: 'public', message: 'Public must be boolean.' });
  }
  if (typeof input.hierarchical !== 'boolean') {
    issues.push({
      code: 'INVALID_HIERARCHICAL',
      path: 'hierarchical',
      message: 'Hierarchical must be boolean.',
    });
  }
  if (!supports) {
    issues.push({
      code: 'INVALID_SUPPORTS',
      path: 'supports',
      message: 'Supports must define boolean title, editor, excerpt and featuredImage flags.',
    });
  }

  if (issues.length > 0 || !supports) return { ok: false, issues };
  return {
    ok: true,
    value: {
      version: CONTENT_TYPE_DEFINITION_VERSION,
      id,
      label,
      singularLabel,
      slug,
      description,
      public: input.public as boolean,
      hierarchical: input.hierarchical as boolean,
      supports,
    },
  };
}

export function serializeContentTypeDefinition(definition: ContentTypeDefinition): JsonObject {
  return {
    version: definition.version,
    id: definition.id,
    label: definition.label,
    singularLabel: definition.singularLabel,
    slug: definition.slug,
    description: definition.description,
    public: definition.public,
    hierarchical: definition.hierarchical,
    supports: {
      title: definition.supports.title,
      editor: definition.supports.editor,
      excerpt: definition.supports.excerpt,
      featuredImage: definition.supports.featuredImage,
    },
  };
}

export function listContentTypeDefinitions(project: CanonicalProject): ContentTypeDefinition[] {
  return Object.values(project.contentTypes)
    .map((value) => validateContentTypeDefinition(value))
    .filter((result): result is { ok: true; value: ContentTypeDefinition } => result.ok)
    .map((result) => result.value)
    .sort((a, b) => a.label.localeCompare(b.label));
}

function slugBelongsToAnotherContentType(
  project: CanonicalProject,
  slug: string,
  excludedId?: string,
): boolean {
  return listContentTypeDefinitions(project).some(
    (definition) => definition.id !== excludedId && definition.slug === slug,
  );
}

function withValidatedProject(
  project: CanonicalProject,
  contentTypes: CanonicalProject['contentTypes'],
  value: ContentTypeDefinition,
): ContentTypeMutationResult {
  const nextProject: CanonicalProject = {
    ...project,
    metadata: { ...project.metadata, updatedAt: new Date().toISOString() },
    contentTypes,
  };
  const validation = validateCanonicalProject(nextProject);
  return validation.ok
    ? { ok: true, project: validation.value, value }
    : {
        ok: false,
        error: { code: 'PROJECT_INVALID', message: validation.error.message },
      };
}

export function createContentType(
  project: CanonicalProject,
  input: unknown,
): ContentTypeMutationResult {
  const validation = validateContentTypeDefinition(input);
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
  if (definition.id in project.contentTypes) {
    return { ok: false, error: { code: 'DUPLICATE_ID', message: `Content type ${definition.id} already exists.` } };
  }
  if (slugBelongsToAnotherContentType(project, definition.slug)) {
    return { ok: false, error: { code: 'DUPLICATE_SLUG', message: `Slug ${definition.slug} is already used.` } };
  }

  return withValidatedProject(
    project,
    { ...project.contentTypes, [definition.id]: serializeContentTypeDefinition(definition) },
    definition,
  );
}

export function updateContentType(
  project: CanonicalProject,
  id: string,
  input: unknown,
): ContentTypeMutationResult {
  if (!(id in project.contentTypes)) {
    return { ok: false, error: { code: 'NOT_FOUND', message: `Content type ${id} was not found.` } };
  }
  const validation = validateContentTypeDefinition(input);
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
    return { ok: false, error: { code: 'ID_MISMATCH', message: 'Content type id is immutable after creation.' } };
  }
  if (slugBelongsToAnotherContentType(project, definition.slug, id)) {
    return { ok: false, error: { code: 'DUPLICATE_SLUG', message: `Slug ${definition.slug} is already used.` } };
  }

  return withValidatedProject(
    project,
    { ...project.contentTypes, [id]: serializeContentTypeDefinition(definition) },
    definition,
  );
}

export function removeContentType(project: CanonicalProject, id: string): ContentTypeMutationResult {
  const current = project.contentTypes[id];
  if (!current) {
    return { ok: false, error: { code: 'NOT_FOUND', message: `Content type ${id} was not found.` } };
  }
  const validation = validateContentTypeDefinition(current);
  if (!validation.ok) {
    return {
      ok: false,
      error: { code: 'INVALID_DEFINITION', message: 'Existing content type definition is invalid.', issues: validation.issues },
    };
  }
  const inUse = Object.values(project.records).some(
    (record) => record.contentTypeId === id || record.contentType === id,
  );
  if (inUse) {
    return {
      ok: false,
      error: {
        code: 'CONTENT_TYPE_IN_USE',
        message: `Content type ${id} has records and cannot be deleted without an explicit migration.`,
      },
    };
  }

  const contentTypes = { ...project.contentTypes };
  delete contentTypes[id];
  return withValidatedProject(project, contentTypes, validation.value);
}
