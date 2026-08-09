import { describe, expect, it } from 'vitest';
import { createCanonicalProject } from '../project';
import {
  createContentType,
  createDefaultContentTypeDefinition,
  listContentTypeDefinitions,
  removeContentType,
  updateContentType,
} from './content-type';

function makeProject() {
  return createCanonicalProject({
    id: 'content_type_test',
    name: 'Content type test',
    now: '2026-08-08T23:15:00.000Z',
    randomUuid: (() => {
      let sequence = 0;
      return () => `00000000-0000-4000-8000-${String(++sequence).padStart(12, '0')}`;
    })(),
  });
}

describe('MF-037 content type engine', () => {
  it('creates updates lists and deletes validated definitions', () => {
    const definition = {
      ...createDefaultContentTypeDefinition('article', 'Articles'),
      singularLabel: 'Article',
      slug: 'articles',
    };
    const created = createContentType(makeProject(), definition);
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(listContentTypeDefinitions(created.project)).toHaveLength(1);

    const updated = updateContentType(created.project, 'article', { ...definition, description: 'Editorial articles' });
    expect(updated.ok).toBe(true);
    if (!updated.ok) return;
    expect(updated.value.description).toBe('Editorial articles');

    const removed = removeContentType(updated.project, 'article');
    expect(removed.ok).toBe(true);
    if (!removed.ok) return;
    expect(listContentTypeDefinitions(removed.project)).toEqual([]);
  });

  it('rejects duplicate slugs and unsafe deletion while referenced', () => {
    const first = createContentType(makeProject(), { ...createDefaultContentTypeDefinition('article', 'Articles'), singularLabel: 'Article', slug: 'content' });
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const duplicate = createContentType(first.project, { ...createDefaultContentTypeDefinition('news', 'News'), singularLabel: 'News item', slug: 'content' });
    expect(duplicate).toMatchObject({ ok: false, error: { code: 'DUPLICATE_SLUG' } });

    const projectWithRecord = { ...first.project, records: { record_1: { contentTypeId: 'article', title: 'Hello' } } };
    const blocked = removeContentType(projectWithRecord, 'article');
    expect(blocked).toMatchObject({ ok: false, error: { code: 'CONTENT_TYPE_IN_USE' } });
  });
});
