import type { DragEvent } from 'react';
import { inspectDocumentTree, type CanonicalDocument, type DocumentNode } from '../../../core/project';

const NODE_MIME = 'application/x-electrocms-node-id';

export interface CanvasRendererProps {
  document: CanonicalDocument;
  viewportWidth: number;
  zoom: number;
  onMoveNode?: (nodeId: string, parentId: string, index: number) => boolean;
}

interface CanvasNodeViewProps {
  document: CanonicalDocument;
  node: DocumentNode;
  depth: number;
  onMoveNode?: (nodeId: string, parentId: string, index: number) => boolean;
}

function nodeLabel(node: DocumentNode): string {
  return node.name?.trim() || node.type;
}

function DropZone({
  parentId,
  index,
  onMoveNode,
}: {
  parentId: string;
  index: number;
  onMoveNode?: (nodeId: string, parentId: string, index: number) => boolean;
}) {
  if (!onMoveNode) return null;

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const nodeId = event.dataTransfer.getData(NODE_MIME) || event.dataTransfer.getData('text/plain');
    if (nodeId) onMoveNode(nodeId, parentId, index);
  };

  return (
    <div
      className="canvas-drop-zone"
      data-drop-parent-id={parentId}
      data-drop-index={index}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      aria-hidden="true"
    />
  );
}

function CanvasNodeView({ document, node, depth, onMoveNode }: CanvasNodeViewProps) {
  const children = node.children
    .map((childId) => document.nodes[childId])
    .filter((child): child is DocumentNode => Boolean(child));

  const renderChildren = () => (
    <>
      <DropZone parentId={node.id} index={0} onMoveNode={onMoveNode} />
      {children.map((child, index) => (
        <div className="canvas-child-entry" key={child.id}>
          <CanvasNodeView
            document={document}
            node={child}
            depth={depth + 1}
            onMoveNode={onMoveNode}
          />
          <DropZone parentId={node.id} index={index + 1} onMoveNode={onMoveNode} />
        </div>
      ))}
    </>
  );

  if (node.type === 'core/root') {
    return (
      <div
        className="canvas-document-root"
        data-canvas-node-id={node.id}
        data-canvas-node-type={node.type}
        data-depth={depth}
      >
        {children.length > 0 || onMoveNode ? (
          renderChildren()
        ) : (
          <div className="canvas-empty-state" data-testid="canvas-empty-state">
            <strong>Empty document</strong>
            <span>Insert elements to begin composing this document.</span>
          </div>
        )}
      </div>
    );
  }

  const handleDragStart = (event: DragEvent<HTMLElement>) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData(NODE_MIME, node.id);
    event.dataTransfer.setData('text/plain', node.id);
  };

  return (
    <article
      className="canvas-node"
      data-canvas-node-id={node.id}
      data-canvas-node-type={node.type}
      data-depth={depth}
      data-locked={node.locked ? 'true' : 'false'}
      data-hidden={node.hidden ? 'true' : 'false'}
      draggable={Boolean(onMoveNode) && !node.locked}
      onDragStart={onMoveNode ? handleDragStart : undefined}
    >
      <header className="canvas-node-label">
        <span>{nodeLabel(node)}</span>
        <code>{node.type}</code>
      </header>
      <div className="canvas-node-content">
        {children.length > 0 || onMoveNode ? renderChildren() : <div className="canvas-node-leaf" aria-hidden="true" />}
      </div>
    </article>
  );
}

export function CanvasRenderer({ document, viewportWidth, zoom, onMoveNode }: CanvasRendererProps) {
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

  const nodeViewProps = onMoveNode ? { onMoveNode } : {};

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
        <CanvasNodeView document={document} node={rootNode} depth={0} {...nodeViewProps} />
      </div>
    </div>
  );
}
