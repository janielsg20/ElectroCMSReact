import { describe, expect, it } from 'vitest';
import { ConflictError } from '../domain';
import type { DocumentNode } from '../project';
import { validWidgetProps, type WidgetDefinition } from './widget-definition';
import { WidgetRegistry, WidgetRegistryError } from './widget-registry';

function definition(version = 1): WidgetDefinition {
  return {
    type: 'plugin/promo',
    version,
    metadata: {
      name: 'Promo',
      category: 'content',
      icon: 'bolt',
      description: 'Plugin promo widget.',
      keywords: ['promo', 'plugin'],
    },
    createNode: ({ id, name, props, styles, children }) => ({
      id,
      type: 'plugin/promo',
      version,
      ...(name === undefined ? {} : { name }),
      props: props ?? {},
      styles: styles ?? {},
      children: [...(children ?? [])],
    }),
    propSchema: { type: 'object' },
    validateProps: validWidgetProps,
    inspectorSchema: { sections: [] },
    childPolicy: { kind: 'none' },
    previewRendererId: 'plugin/promo-preview',
    capabilities: {
      local: 'interactive-demo',
      react: 'modeled',
      lamp: 'planned',
      wordpress: 'planned',
    },
    migrations: [],
  };
}

describe('WidgetRegistry', () => {
  it('registers an external widget and creates canonical nodes without editor-core changes', () => {
    const registry = new WidgetRegistry();
    registry.register(definition());

    const node = registry.createNode('plugin/promo', {
      id: 'node_plugin_promo',
      name: 'Promo block',
      props: { headline: 'Hello' },
    });

    expect(registry.has('plugin/promo')).toBe(true);
    expect(registry.latestVersion('plugin/promo')).toBe(1);
    expect(registry.listLatest().map((item) => item.type)).toEqual(['plugin/promo']);
    expect(node).toMatchObject({
      id: 'node_plugin_promo',
      type: 'plugin/promo',
      version: 1,
      name: 'Promo block',
      props: { headline: 'Hello' },
    });
  });

  it('rejects duplicate registrations and malformed factory output', () => {
    const registry = new WidgetRegistry();
    registry.register(definition());
    expect(() => registry.register(definition())).toThrow(ConflictError);

    const invalid = definition();
    invalid.type = 'plugin/broken';
    invalid.createNode = ({ id }) => ({
      id,
      type: 'plugin/other',
      version: 1,
      props: {},
      styles: {},
      children: [],
    });
    registry.register(invalid);

    expect(() => registry.createNode('plugin/broken', { id: 'node_broken' })).toThrow(
      WidgetRegistryError,
    );
  });

  it('runs prop validation for factory output and existing nodes', () => {
    const registry = new WidgetRegistry();
    const validated = definition();
    validated.type = 'plugin/validated';
    validated.createNode = ({ id, props }) => ({
      id,
      type: 'plugin/validated',
      version: 1,
      props: props ?? {},
      styles: {},
      children: [],
    });
    validated.validateProps = (props) =>
      typeof props.title === 'string'
        ? validWidgetProps()
        : {
            valid: false,
            issues: [{ code: 'TITLE_REQUIRED', path: 'title', message: 'title is required' }],
          };
    registry.register(validated);

    expect(() =>
      registry.createNode('plugin/validated', { id: 'node_invalid', props: {} }),
    ).toThrow(WidgetRegistryError);

    const node = registry.createNode('plugin/validated', {
      id: 'node_valid',
      props: { title: 'Valid' },
    });
    expect(registry.validateNode(node).valid).toBe(true);
  });

  it('enforces child policies through the registry contract', () => {
    const registry = new WidgetRegistry();
    const none = definition();
    none.type = 'plugin/leaf';
    none.createNode = ({ id }) => ({
      id,
      type: 'plugin/leaf',
      version: 1,
      props: {},
      styles: {},
      children: [],
    });
    registry.register(none);

    const parent = definition();
    parent.type = 'plugin/parent';
    parent.createNode = ({ id, children }) => ({
      id,
      type: 'plugin/parent',
      version: 1,
      props: {},
      styles: {},
      children: [...(children ?? [])],
    });
    parent.childPolicy = { kind: 'allowlist', allowedTypes: ['plugin/leaf'] };
    registry.register(parent);

    expect(registry.allowsChild('plugin/leaf', 'plugin/leaf')).toBe(false);
    expect(registry.allowsChild('plugin/parent', 'plugin/leaf')).toBe(true);
    expect(registry.allowsChild('plugin/parent', 'plugin/promo')).toBe(false);
  });

  it('migrates a node across sequential widget versions', () => {
    const registry = new WidgetRegistry();
    const v1 = definition(1);
    v1.migrations = [
      {
        fromVersion: 1,
        toVersion: 2,
        migrate: (node) => ({
          ...node,
          version: 2,
          props: { ...node.props, migrated: true },
        }),
      },
    ];
    const v2 = definition(2);
    v2.validateProps = (props) =>
      props.migrated === true
        ? validWidgetProps()
        : {
            valid: false,
            issues: [{ code: 'MIGRATION_REQUIRED', path: 'migrated', message: 'must be true' }],
          };
    registry.register(v1);
    registry.register(v2);

    const legacy: DocumentNode = {
      id: 'node_legacy',
      type: 'plugin/promo',
      version: 1,
      props: {},
      styles: {},
      children: [],
    };
    const migrated = registry.migrateNode(legacy);

    expect(migrated.version).toBe(2);
    expect(migrated.props.migrated).toBe(true);
  });
});
