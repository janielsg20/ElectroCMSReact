import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { CanonicalDocument, DocumentNode } from '../../../core/project';
import { EditorCanvas } from './EditorCanvas';

function node(id: string, name: string, children: string[] = []): DocumentNode {
  return {
    id,
    type: id === 'node_root' ? 'core/root' : 'test/box',
    version: 1,
    name,
    props: {},
    styles: {},
    children,
  };
}

function nestedDocument(): CanonicalDocument {
  return {
    id: 'document_canvas_test',
    kind: 'page',
    name: 'Canvas test',
    rootNodeId: 'node_root',
    nodes: {
      node_root: node('node_root', 'Root', ['node_a', 'node_b']),
      node_a: node('node_a', 'Section A', ['node_c']),
      node_b: node('node_b', 'Section B'),
      node_c: node('node_c', 'Nested C'),
    },
    metadata: {},
  };
}

describe('EditorCanvas', () => {
  it('renders canonical child order and nesting without mutating the document', () => {
    const document = nestedDocument();
    const before = structuredClone(document);

    const { container } = render(
      <EditorCanvas document={document} viewportWidth={1024} zoom={110} />,
    );

    const root = container.querySelector('[data-canvas-node-id="node_root"]');
    if (!root) throw new Error('Expected rendered root.');
    const directChildren = [...root.querySelectorAll('[data-canvas-node-id][data-depth="1"]')]
      .map((element) => element.getAttribute('data-canvas-node-id'));

    expect(directChildren).toEqual(['node_a', 'node_b']);
    const sectionA = container.querySelector('[data-canvas-node-id="node_a"]');
    if (!sectionA) throw new Error('Expected section A.');
    expect(within(sectionA as HTMLElement).getByText('Nested C')).toBeInTheDocument();
    expect(document).toEqual(before);
  });

  it('keeps renderer and overlays as separate sibling layers', () => {
    render(<EditorCanvas document={nestedDocument()} viewportWidth={768} zoom={90} />);

    const canvas = screen.getByTestId('editor-canvas');
    const renderer = screen.getByTestId('canvas-renderer');
    const overlay = screen.getByTestId('canvas-overlay-layer');

    expect(renderer.parentElement).toBe(overlay.parentElement);
    expect(canvas).toContainElement(renderer);
    expect(canvas).toContainElement(overlay);
    expect(renderer).toHaveAttribute('data-viewport-width', '768');
    expect(renderer).toHaveAttribute('data-zoom', '90');
  });

  it('renders a canonical empty root instead of inventing placeholder nodes', () => {
    const document = nestedDocument();
    document.nodes = {
      node_root: node('node_root', 'Root'),
    };

    render(<EditorCanvas document={document} viewportWidth={1440} zoom={100} />);

    expect(screen.getByTestId('canvas-empty-state')).toHaveTextContent('Empty document');
    expect(screen.queryByText('Section A')).not.toBeInTheDocument();
  });

  it('refuses to render an invalid tree and exposes a safe diagnostic surface', () => {
    const document = nestedDocument();
    document.nodes.node_a?.children.push('node_missing');

    render(<EditorCanvas document={document} viewportWidth={1440} zoom={100} />);

    expect(screen.getByRole('alert')).toHaveTextContent('Canvas unavailable');
    expect(screen.queryByText('Section A')).not.toBeInTheDocument();
  });
});
