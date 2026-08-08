import { describe, expect, it } from 'vitest';
import { createCanonicalProject } from '../project';
import { mergeThemePackageResources } from './theme-package-merge';
import type { ProjectThemePackageResources, ThemePackageResourceSelection } from './theme-package';

function createSelection(overrides: Partial<ThemePackageResourceSelection> = {}): ThemePackageResourceSelection {
  return {
    documents: true,
    contentModels: true,
    queryTools: true,
    rolesAndBackend: true,
    demoData: false,
    ...overrides,
  };
}

describe('theme package resource merge', () => {
  it('imports selected resources while leaving demo data disabled by default', () => {
    const project = createCanonicalProject({
      id: 'project_target',
      name: 'Target',
      randomUuid: () => 'target',
    });
    const source = createCanonicalProject({
      id: 'project_source',
      name: 'Source',
      randomUuid: () => 'source',
    });
    source.contentTypes.product = { label: 'Product' };
    source.taxonomies.category = { label: 'Category' };
    source.forms.contact = { label: 'Contact form' };
    source.roles.editor = { label: 'Editor' };
    source.records.demo_product = { title: 'Demo product' };

    const resources: ProjectThemePackageResources = {
      documents: source.documents,
      documentOrder: source.documentOrder,
      contentTypes: source.contentTypes,
      taxonomies: source.taxonomies,
      forms: source.forms,
      roles: source.roles,
      records: source.records,
    };
    const result = mergeThemePackageResources(project, resources, createSelection());

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(Object.keys(result.project.documents)).toHaveLength(2);
    expect(result.project.contentTypes.product).toEqual({ label: 'Product' });
    expect(result.project.taxonomies.category).toEqual({ label: 'Category' });
    expect(result.project.forms.contact).toEqual({ label: 'Contact form' });
    expect(result.project.roles.editor).toEqual({ label: 'Editor' });
    expect(result.project.records.demo_product).toBeUndefined();
    expect(result.report.demoData.imported).toBe(0);
  });

  it('imports demo records only when explicitly selected', () => {
    const project = createCanonicalProject({ id: 'project_target', name: 'Target', randomUuid: () => 'target' });
    const resources: ProjectThemePackageResources = {
      records: {
        demo_article: { title: 'Demo article' },
      },
    };

    const withoutDemo = mergeThemePackageResources(project, resources, createSelection());
    expect(withoutDemo.ok && withoutDemo.project.records.demo_article).toBeUndefined();

    const withDemo = mergeThemePackageResources(project, resources, createSelection({ demoData: true }));
    expect(withDemo.ok).toBe(true);
    if (!withDemo.ok) return;
    expect(withDemo.project.records.demo_article).toEqual({ title: 'Demo article' });
    expect(withDemo.report.demoData.imported).toBe(1);
  });

  it('never overwrites existing resource ids and reports conflicts', () => {
    const project = createCanonicalProject({ id: 'project_target', name: 'Target', randomUuid: () => 'target' });
    project.contentTypes.product = { label: 'Existing Product', source: 'target' };
    project.roles.editor = { label: 'Existing Editor' };
    project.backend.layout = 'existing';

    const resources: ProjectThemePackageResources = {
      contentTypes: {
        product: { label: 'Incoming Product', source: 'package' },
        service: { label: 'Service' },
      },
      roles: {
        editor: { label: 'Incoming Editor' },
        manager: { label: 'Manager' },
      },
      backend: {
        layout: 'incoming',
        density: 'compact',
      },
    };

    const result = mergeThemePackageResources(project, resources, createSelection());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.project.contentTypes.product).toEqual({ label: 'Existing Product', source: 'target' });
    expect(result.project.contentTypes.service).toEqual({ label: 'Service' });
    expect(result.project.roles.editor).toEqual({ label: 'Existing Editor' });
    expect(result.project.roles.manager).toEqual({ label: 'Manager' });
    expect(result.project.backend.layout).toBe('existing');
    expect(result.project.backend.density).toBe('compact');
    expect(result.report.contentModels.skippedConflicts).toBe(1);
    expect(result.report.rolesAndBackend.skippedConflicts).toBe(2);
  });

  it('honors category selection instead of importing every package resource', () => {
    const project = createCanonicalProject({ id: 'project_target', name: 'Target', randomUuid: () => 'target' });
    const resources: ProjectThemePackageResources = {
      contentTypes: { product: { label: 'Product' } },
      queries: { products: { source: 'product' } },
      roles: { manager: { label: 'Manager' } },
    };

    const result = mergeThemePackageResources(
      project,
      resources,
      createSelection({ contentModels: false, rolesAndBackend: false }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.project.contentTypes.product).toBeUndefined();
    expect(result.project.queries.products).toEqual({ source: 'product' });
    expect(result.project.roles.manager).toBeUndefined();
  });
});
