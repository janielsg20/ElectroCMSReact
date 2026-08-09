import { isJsonObject } from '../domain';
import type { CanonicalProject } from '../project';
import { removeTaxonomy as removeBaseTaxonomy, type TaxonomyMutationResult } from './taxonomy';

export function removeTaxonomyWithReferenceIntegrity(project: CanonicalProject, id: string): TaxonomyMutationResult {
  const referencingGroup = Object.entries(project.fieldGroups).find(([, raw]) => {
    if (!isJsonObject(raw) || !Array.isArray(raw.fields)) return false;
    return raw.fields.some((field) => (
      isJsonObject(field)
      && field.type === 'core/taxonomy'
      && typeof field.typeVersion === 'number'
      && field.typeVersion >= 2
      && isJsonObject(field.config)
      && field.config.taxonomyId === id
    ));
  });

  if (referencingGroup) {
    return {
      ok: false,
      error: {
        code: 'PROJECT_INVALID',
        message: `Taxonomy ${id} is referenced by Field Group ${referencingGroup[0]} and cannot be deleted until that field is removed or migrated.`,
      },
    };
  }
  return removeBaseTaxonomy(project, id);
}
