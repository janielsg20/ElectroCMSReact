import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { CanonicalDocument, DocumentNode } from '../../core/project';
import { EditorCanvas } from '../editor/canvas/EditorCanvas';
import { DYNAMIC_CONTRACT_WIDGET_TYPES } from './core-dynamic-contract-widgets';
import { createDefaultEditorWidgetRegistry } from './default-editor-widget-registry';
import { EditorWidgetRegistryProvider } from './EditorWidgetRegistryProvider';

function rootNode(children: string[]): DocumentNode {
  return {
    id: 'node_root',
    type: 'core/root',
    version: 1,
    name: 'Root',
    props: {},
    styles: {},
    children,
  };
}

function documentWith(node: DocumentNode): CanonicalDocument {
  return {
    id: 'document_contract_test',
    kind: 'page',
    name: 'Contract widget test',
    rootNodeId: 'node_root',
    nodes: {
      node_root: rootNode([node.id]),
      [node.id]: node,
    },
    metadata: {},
  };
}

describe('MF-030 dynamic/commerce/form/filter widget contracts', () => {
  it('registers the complete modeled contract catalog', () => {
    const registry = createDefaultEditorWidgetRegistry();
    const categories = new Set(['dynamic', 'commerce', 'form', 'filter']);
    const types = registry.core
      .listLatest()
      .filter((definition) => categories.has(definition.metadata.category))
      .map((definition) => definition.type)
      .sort((left, right) => left.localeCompare(right));

    expect(types).toEqual([...DYNAMIC_CONTRACT_WIDGET_TYPES].sort((left, right) => left.localeCompare(right)));
  });

  it('keeps capabilities honest until later data/form phases implement behavior', () => {
    const registry = createDefaultEditorWidgetRegistry();
    for (const type of DYNAMIC_CONTRACT_WIDGET_TYPES) {
      const definition = registry.core.resolve(type);
      expect(definition.capabilities.local).toBe('modeled');
      expect(definition.capabilities.react).toBe('modeled');
      expect(definition.capabilities.lamp).toBe('planned');
      expect(definition.capabilities.wordpress).toBe('planned');
    }
  });

  it('validates bindings and renders a clearly modeled preview', () => {
    const registry = createDefaultEditorWidgetRegistry();
    const field = registry.createNode('core/dynamic-field', {
      id: 'node_dynamic_field',
      name: 'Post title binding',
      props: { source: 'current', field: 'title', fallback: 'Untitled' },
    });
    expect(registry.core.validateNode({ ...field, props: { source: 42, field: 'title', fallback: '' } }).valid).toBe(false);

    const { container } = render(
      <EditorWidgetRegistryProvider registry={registry}>
        <EditorCanvas
          document={documentWith(field)}
          breakpointId="desktop"
          viewportWidth={1440}
          zoom={100}
        />
      </EditorWidgetRegistryProvider>,
    );

    expect(screen.getByText('Modeled contract')).toBeInTheDocument();
    const preview = container.querySelector('[data-widget-preview-type="core/dynamic-field"]');
    expect(preview).toHaveTextContent('Post title binding');
    expect(preview).toHaveAttribute('data-capability', 'modeled');
  });
});
