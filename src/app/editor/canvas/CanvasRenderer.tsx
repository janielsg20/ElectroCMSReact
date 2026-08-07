import { inspectDocumentTree, type CanonicalDocument, type DocumentNode } from '../../../core/project';

export interface CanvasRendererProps {
  document: CanonicalDocument;
  viewportWidth: number;
  zoom: number;
}

interface CanvasNodeViewProps {
  document: CanonicalDocument;
  node: DocumentNode;
  depth: number;
}

function nodeLabel(node: DocumentNode): string {
  return node.name?.trim() || node.type;
}

function CanvasNodeView({ document, node, depth }: CanvasNodeViewProps) {
  const children = node.children
    .map((childId) => document.nodes[childId])
    .filter((child): child is DocumentNode => Boolean(child));

  if (node.type === 'core/root') {
    return (
      <div
        className="canvas-document-root"
        data-canvas-node-id={node.id}
        data-canvas-node-type={node.type}
        data-depth={depth}
      >
        {children.length > 0 ? (
          children.map((child) => (
            <CanvasNodeView key={child.id} document={document} node={child} depth={depth + 1} />
          ))
        ) : (
          <div className="canvas-empty-state" data-testid="canvas-empty-state">
            <strong>Empty document</strong>
            <span>Insert elements in MF-021. The canvas is rendering the canonical root now.</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <article
      className="canvas-node"
      data-canvas-node-id={node.id}
      data-canvas-node-type={node.type}
      data-depth={depth}
      data-locked={node.locked ? 'true' : 'false'}
      data-hidden={node.hidden ? 'true' : 'false'}
    >
      <header className="canvas-node-label">
        <span>{nodeLabel(node)}</span>
        <code>{node.type}</code>
      </header>
      <div className="canvas-node-content">
        {children.map((child) => (
          <CanvasNodeView key={child.id} document={document} node={child} depth={depth + 1} />
        ))}
        {children.length === 0 ? <div className="canvas-node-leaf" aria-hidden="true" /> : null}
      </div>
    </article>
  );
}

export function CanvasRenderer({ document, viewportWidth, zoom }: CanvasRendererProps) {
  const inspection = inspectDocumentTree(document);
  const rootNode = document.nodes[document.rootNodeId];

  if (!inspection.valid || !rootNode) {
    return (
      <div className="canvas-render-error" role="alert">
        <strong>Canvas unavailable</strong>
        <span>The active document tree is invalid and cannot be rendered safely.</span>
      </div>
    );
  }

  const scale = zoom / 100;
  const canvasStyle = {
    '--canvas-document-width': `${viewportWidth}px`,
    '--canvas-zoom': String(scale),
  } as React.CSSProperties;

  return (
    <div
      className="canvas-renderer"
      style={canvasStyle}
      data-testid="canvas-renderer"
      data-document-id={document.id}
      data-viewport-width={viewportWidth}
      data-zoom={zoom}
    >
      <div className="canvas-scaled-document">
        <CanvasNodeView document={document} node={rootNode} depth={0} />
      </div>
    </div>
  );
}
