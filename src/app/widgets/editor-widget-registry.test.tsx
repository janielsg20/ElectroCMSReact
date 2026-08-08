import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { CanonicalDocument, DocumentNode } from '../../core/project';
import { validWidgetProps, type WidgetDefinition } from '../../core/widgets';
import { EditorCanvas } from '../editor/canvas/EditorCanvas';
import { EditorWidgetRegistryProvider } from './EditorWidgetRegistryProvider';
import { EditorWidgetRegistry, type WidgetPreviewProps } from './editor-widget-registry';

function promoDefinition(): WidgetDefinition {
  return {
    type: 'plugin/promo',
    version: 1,
    metadata: {
      name: 'Promo',
      category: 'content',
      icon: 'bolt',
      description: 'External promo widget used to prove registry extensibility.',
    },
    createNode: ({ id, name, props, styles, children }) => ({
      id,
      type: 'plugin/promo',
      version: 1,
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

function PromoPreview({ node, breakpointId, selected, children }: WidgetPreviewProps) {
  return (
    <section
      data-testid="plugin-promo-preview"
      data-breakpoint={breakpointId}
      data-preview-selected={selected ? 'true' : 'false'}
    >
      <strong>{String(node.props.headline ?? 'Promo')}</strong>
      {children}
    </section>
  );
}

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

function pluginDocument(pluginNode: DocumentNode): CanonicalDocument {
  return {
    id: 'document_plugin_registry_test',
    kind: 'page',
    name: 'Plugin registry test',
    rootNodeId: 'node_root',
    nodes: {
      node_root: rootNode([pluginNode.id]),
      [pluginNode.id]: pluginNode,
    },
    metadata: {},
  };
}

describe('EditorWidgetRegistry React binding', () => {
  it('creates and renders an externally registered widget preview without editor type branching', () => {
    const registry = new EditorWidgetRegistry();
    registry.register({ definition: promoDefinition(), Preview: PromoPreview });
    const pluginNode = registry.createNode('plugin/promo', {
      id: 'node_plugin_promo',
      name: 'Campaign promo',
      props: { headline: 'Launch week' },
    });

    const { container } = render(
      <EditorWidgetRegistryProvider registry={registry}>
        <EditorCanvas
          document={pluginDocument(pluginNode)}
          breakpointId="desktop"
          viewportWidth={1440}
          zoom={100}
        />
      </EditorWidgetRegistryProvider>,
    );

    expect(screen.getByTestId('plugin-promo-preview')).toHaveTextContent('Launch week');
    expect(screen.getByTestId('plugin-promo-preview')).toHaveAttribute('data-breakpoint', 'desktop');
    expect(container.querySelector('[data-canvas-node-id="node_plugin_promo"]')).toHaveAttribute(
      'data-widget-registered',
      'true',
    );
  });

  it('keeps the generic canvas renderer as a safe fallback for unregistered node types', () => {
    const unknown: DocumentNode = {
      id: 'node_unknown',
      type: 'plugin/unregistered',
      version: 1,
      name: 'Unknown plugin node',
      props: {},
      styles: {},
      children: [],
    };

    const { container } = render(
      <EditorCanvas
        document={pluginDocument(unknown)}
        breakpointId="desktop"
        viewportWidth={1440}
        zoom={100}
      />,
    );

    expect(screen.getByText('Unknown plugin node')).toBeInTheDocument();
    expect(container.querySelector('[data-canvas-node-id="node_unknown"]')).toHaveAttribute(
      'data-widget-registered',
      'false',
    );
  });
});
