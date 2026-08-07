import { describe, expect, it } from 'vitest';
import { createCanonicalProject } from './project-factory';
import { validateCanonicalProject } from './project-validator';

const ids = [
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000003',
];

function deterministicUuid(): () => string {
  let index = 0;
  return () => ids[index++] ?? `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`;
}

describe('canonical project model', () => {
  it('creates a valid project with a rooted initial document and six breakpoints', () => {
    const project = createCanonicalProject({
      name: 'Demo',
      now: '2026-08-07T20:00:00.000Z',
      randomUuid: deterministicUuid(),
    });

    const validation = validateCanonicalProject(project);

    expect(validation.ok).toBe(true);
    expect(project.documentOrder).toHaveLength(1);
    expect(project.breakpoints.map((breakpoint) => breakpoint.id)).toEqual([
      'desktop',
      'laptop',
      'tablet-landscape',
      'tablet-portrait',
      'mobile-large',
      'mobile-small',
    ]);
  });

  it('rejects broken tree references without mutating the payload', () => {
    const project = createCanonicalProject({ name: 'Broken', randomUuid: deterministicUuid() });
    const document = project.documents[project.documentOrder[0] ?? ''];
    if (!document) throw new Error('Expected initial document.');
    const root = document.nodes[document.rootNodeId];
    if (!root) throw new Error('Expected root node.');
    root.children.push('node_missing');

    const validation = validateCanonicalProject(project);

    expect(validation.ok).toBe(false);
    if (!validation.ok) {
      expect(validation.error.issues.some((issue) => issue.code === 'MISSING_CHILD')).toBe(true);
    }
    expect(root.children).toEqual(['node_missing']);
  });
});
