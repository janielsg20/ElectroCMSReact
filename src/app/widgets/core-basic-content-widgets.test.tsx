import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { CanonicalDocument, DocumentNode } from '../../core/project';
import { EditorCanvas } from '../editor/canvas/EditorCanvas';
import { BASIC_CONTENT_WIDGET_TYPES } from './core-basic-content-widgets';
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
    id: 'document_basic_content_test',
    kind: 'page',
    name: 'Basic/content widget test',
    rootNodeId: 'node_root',
    nodes: {
      node_root: rootNode([node.id]),
      [node.id]: node,
    },
    metadata: {},
  };
}

describe('built-in basic and content widgets', () => {
  it('registers every MF-029 basic/content widget', () => {
    const registry = createDefaultEditorWidgetRegistry();
    const types = registry.core
      .listLatest()
      .filter((definition) => ['basic', 'content'].includes(definition.metadata.category))
      .map((definition) => definition.type)
      .sort((left, right) => left.localeCompare(right));

    expect(types).toEqual([...BASIC_CONTENT_WIDGET_TYPES].sort((left, right) => left.localeCompare(right)));
  });

  it('creates accessible defaults and rejects invalid heading props', () => {
    const registry = createDefaultEditorWidgetRegistry();
    const heading = registry.createNode('core/heading', { id: 'node_heading' });
    const image = registry.createNode('core/image', { id: 'node_image' });
    const login = registry.createNode('core/login', { id: 'node_login' });

    expect(heading.props).toEqual({ text: 'Heading', level: 2 });
    expect(image.props).toEqual({ src: '', alt: 'Image' });
    expect(login.props).toEqual({ title: 'Sign in', buttonLabel: 'Sign in' });
    expect(registry.core.validateNode({ ...heading, props: { text: 'Bad heading', level: 9 } }).valid).toBe(false);
  });

  it('renders content previews through the same registry-driven canvas path', () => {
    const registry = createDefaultEditorWidgetRegistry();
    const cta = registry.createNode('core/cta', {
      id: 'node_cta',
      name: 'Launch CTA',
      props: {
        heading: 'Build faster',
        text: 'Compose locally and export later.',
        buttonLabel: 'Start building',
        href: '#start',
      },
    });

    const { container } = render(
      <EditorWidgetRegistryProvider registry={registry}>
        <EditorCanvas
          document={documentWith(cta)}
          breakpointId="desktop"
          viewportWidth={1440}
          zoom={100}
        />
      </EditorWidgetRegistryProvider>,
    );

    expect(screen.getByText('Build faster')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Start building' })).toHaveAttribute('href', '#start');
    expect(container.querySelector('[data-canvas-node-id="node_cta"]')).toHaveAttribute(
      'data-widget-registered',
      'true',
    );
  });
});
