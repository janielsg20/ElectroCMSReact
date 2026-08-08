import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { CanonicalDocument, DocumentNode } from '../../core/project';
import { EditorCanvas } from '../editor/canvas/EditorCanvas';
import {
  createDefaultEditorWidgetRegistry,
  STRUCTURAL_WIDGET_TYPES,
} from './core-structural-widgets';
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

function structuralDocument(node: DocumentNode): CanonicalDocument {
  return {
    id: 'document_structural_widget_test',
    kind: 'page',
    name: 'Structural widget test',
    rootNodeId: 'node_root',
    nodes: {
      node_root: rootNode([node.id]),
      [node.id]: node,
    },
    metadata: {},
  };
}

describe('built-in structural widgets', () => {
  it('registers the complete structural widget set', () => {
    const registry = createDefaultEditorWidgetRegistry();
    const types = registry.core
      .listLatest()
      .filter((definition) => definition.metadata.category === 'structural')
      .map((definition) => definition.type);

    expect(types).toEqual([...STRUCTURAL_WIDGET_TYPES].sort((left, right) => left.localeCompare(right)));
  });

  it('creates canonical defaults and validates constrained props', () => {
    const registry = createDefaultEditorWidgetRegistry();
    const grid = registry.createNode('core/grid', { id: 'node_grid' });
    const divider = registry.createNode('core/divider', { id: 'node_divider' });
    const spacer = registry.createNode('core/spacer', { id: 'node_spacer' });

    expect(grid.props).toEqual({ columns: 2, gap: 16 });
    expect(divider.props).toEqual({ orientation: 'horizontal' });
    expect(spacer.props).toEqual({ size: 24 });
    expect(registry.core.resolve('core/divider').childPolicy).toEqual({ kind: 'none' });
    expect(registry.core.validateNode({ ...grid, props: { columns: 0, gap: -1 } }).valid).toBe(false);
  });

  it('renders a structural preview through the registry binding', () => {
    const registry = createDefaultEditorWidgetRegistry();
    const grid = registry.createNode('core/grid', {
      id: 'node_grid',
      name: 'Feature grid',
      props: { columns: 3, gap: 24 },
    });

    const { container } = render(
      <EditorWidgetRegistryProvider registry={registry}>
        <EditorCanvas
          document={structuralDocument(grid)}
          breakpointId="desktop"
          viewportWidth={1440}
          zoom={100}
        />
      </EditorWidgetRegistryProvider>,
    );

    const preview = container.querySelector('[data-widget-preview-type="core/grid"]');
    expect(preview).toHaveAttribute('data-grid-columns', '3');
    expect(container.querySelector('[data-canvas-node-id="node_grid"]')).toHaveAttribute(
      'data-widget-registered',
      'true',
    );
    expect(screen.getByText('Feature grid')).toBeInTheDocument();
  });
});
