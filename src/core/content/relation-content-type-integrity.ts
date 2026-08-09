import type { CanonicalProject } from '../project';
import { removeContentType as removeBaseContentType, type ContentTypeMutationResult } from './content-type';
import { listRelationDefinitions } from './relation';

export function removeContentTypeWithRelationIntegrity(project: CanonicalProject, id: string): ContentTypeMutationResult {
  const relation = listRelationDefinitions(project).find((candidate) => candidate.sourceContentTypeId === id || candidate.targetContentTypeId === id);
  if (relation) {
    return { ok: false, error: { code: 'CONTENT_TYPE_IN_USE', message: `Content type ${id} is used by relation ${relation.id} and cannot be deleted until that relation is removed or migrated.` } };
  }
  return removeBaseContentType(project, id);
}
