import { describe, expect, it } from 'vitest';
import { createCanonicalProject } from './project-factory';
import { insertDocumentNode } from './document-tree';
import {
  readNodeGeometry,
  setNodeGeometry,
  snapCanvasNumber,
  snapNodeGeometryPatch,
} from './node-geometry';
import type { CanonicalDocument, DocumentNode } from './project-model';

function editableDocument(): CanonicalDocument {
  const project = createCanonicalProject({ id: 'project_geometry_test', name: 'Geometry test' });
  const document = project.documents[project.documentOrder[0] ?? ''];
  if (!document) throw new Error('Expected default document.');
  const node: DocumentNode = {
    id: 'node_geometry',
    type: 'core/container',
    version: 1,
    name: 'Geometry',
    props: {},
    styles: {},
    children: [],
  };
  return insertDocumentNode(document, node, { parentId: document.rootNodeId });
}

describe('responsive node geometry', () => {
  it('stores explicit geometry per breakpoint without changing another breakpoint', () => {
    let document = editableDocument();
    document = setNodeGeometry(document, 'node_geometry', 'desktop', {
      x: 17,
      y: 26,
      width: 319,
      height: 111,
    });
    document = setNodeGeometry(document, 'node_geometry', 'mobile', { width: 280 });

    const node = document.nodes.node_geometry;
    if (!node) throw new Error('Expected geometry node.');
    expect(readNodeGeometry(node, 'desktop')).toEqual({ x: 17, y: 26, width: 319, height: 111 });
    expect(readNodeGeometry(node, 'mobile')).toEqual({ x: 0, y: 0, width: 280 });
  });

  it('resolves inherited numeric slots', () => {
    let document = editableDocument();
    document = setNodeGeometry(document, 'node_geometry', 'desktop', { x: 24 });
    const node = document.nodes.node_geometry;
    if (!node) throw new Error('Expected geometry node.');
    node.styles['layout.x'] = {
      ...node.styles['layout.x'],
      tablet: { state: 'inherited', fromBreakpointId: 'desktop' },
    };
    expect(readNodeGeometry(node, 'tablet').x).toBe(24);
  });

  it('snaps to the nearest grid or viewport anchor within threshold', () => {
    expect(snapCanvasNumber(15, 'x').value).toBe(16);
    expect(snapCanvasNumber(503, 'x', { viewportSize: 1000 }).value).toBe(500);
    expect(snapCanvasNumber(37, 'y', { threshold: 1 }).value).toBe(37);
  });

  it('snaps a geometry patch and enforces minimum resize dimensions', () => {
    const snapped = snapNodeGeometryPatch({ x: 17, y: 25, width: 30, height: 41 }, 1440);
    expect(snapped.patch).toEqual({ x: 16, y: 24, width: 32, height: 40 });
    expect(snapped.guides).toHaveLength(4);
  });
});
