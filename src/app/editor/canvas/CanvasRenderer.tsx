import type { CSSProperties, DragEvent, KeyboardEvent, MouseEvent } from 'react';
import {
  inspectDocumentTree,
  readNodeGeometry,
  type CanonicalDocument,
  type DocumentNode,
} from '../../../core/project';
import type { EditorWidgetRegistry } from '../../widgets/editor-widget-registry';
import { useEditorWidgetRegistry } from '../../widgets/editor-widget-registry-context';
import { resolveCanvasNodeStyle } from './canvas-node-style';

const NODE_MIME = 'application/x-electrocms-node-id';
type MoveNodeHandler = (nodeId: string, parentId: string, index: number) => boolean;
type SelectNodeHandler = (nodeId: string, additive: boolean) => void;

export interface CanvasRendererProps {
  document: CanonicalDocument;
  breakpointId: string;
  viewportWidth: number;
  zoom: number;
  selectedNodeIds?: readonly string[];
  onMoveNode?: MoveNodeHandler;
  onSelectNode?: SelectNodeHandler;
}

interface CanvasNodeViewProps {
  document: CanonicalDocument;
  breakpointId: string;
  node: DocumentNode;
  depth: number;
  selectedNodeIds: ReadonlySet<string>;
  widgetRegistry: EditorWidgetRegistry;
  onMoveNode: MoveNodeHandler | undefined;
  onSelectNode: SelectNodeHandler | undefined;
}

interface DropZoneProps {
  parentId: string;
  index: number;
  onMoveNode: MoveNodeHandler | undefined;
}

function nodeLabel(node: DocumentNode): string {
  return node.name?.trim() || node.type;
}

function setRendererDragState(element: HTMLElement, active: boolean) {
  const renderer = element.closest<HTMLElement>('.canvas-renderer');
  if (renderer) renderer.dataset.dragActive = active ? 'true' : 'false';
}

function DropZone({ parentId, index, onMoveNode }: DropZoneProps) {
  if (!onMoveNode) return null;

  const allowDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
    allowDrop(event);
    event.currentTarget.dataset.dropActive = 'true';
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.currentTarget.dataset.dropActive = 'false';
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.dataset.dropActive = 'false';
    setRendererDragState(event.currentTarget, false);
    const nodeId = event.dataTransfer.getData(NODE_MIME) || event.dataTransfer.getData('text/plain');
    if (nodeId) onMoveNode(nodeId, parentId, index);
  };

  return (
    <div
      className="canvas-drop-zone"
      data-drop-parent-id={parentId}
      data-drop-index={index}
      data-drop-active="false"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={allowDrop}
      onDrop={handleDrop}
      aria-hidden="true"
    />
  );
}

function CanvasNodeView({
  document,
  breakpointId,
  node,
  depth,
  selectedNodeIds,
  widgetRegistry,
  onMoveNode,
  onSelectNode,
}: CanvasNodeViewProps) {
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
            breakpointId={breakpointId}
            node={child}
            depth={depth + 1}
            selectedNodeIds={selectedNodeIds}
            widgetRegistry={widgetRegistry}
            onMoveNode={onMoveNode}
            onSelectNode={onSelectNode}
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

  const selected = selectedNodeIds.has(node.id);
  const geometry = readNodeGeometry(node, breakpointId);
  const visualStyle = resolveCanvasNodeStyle(node, breakpointId);
  const nodeStyle: CSSProperties = {
    ...visualStyle,
    ...(geometry.x === 0 && geometry.y === 0
      ? {}
      : { transform: `translate(${geometry.x}px, ${geometry.y}px)` }),
    ...(geometry.width === undefined ? {} : { width: `${geometry.width}px` }),
    ...(geometry.height === undefined ? {} : { minHeight: `${geometry.height}px` }),
  };
  const handleDragStart = (event: DragEvent<HTMLElement>) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData(NODE_MIME, node.id);
    event.dataTransfer.setData('text/plain', node.id);
    event.currentTarget.dataset.dragSource = 'true';
    setRendererDragState(event.currentTarget, true);
  };
  const handleDragEnd = (event: DragEvent<HTMLElement>) => {
    event.currentTarget.dataset.dragSource = 'false';
    setRendererDragState(event.currentTarget, false);
  };
  const handleSelect = (event: MouseEvent<HTMLElement>) => {
    if (!onSelectNode) return;
    event.stopPropagation();
    onSelectNode(node.id, event.ctrlKey || event.metaKey);
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!onSelectNode || (event.key !== 'Enter' && event.key !== ' ')) return;
    event.preventDefault();
    event.stopPropagation();
    onSelectNode(node.id, event.ctrlKey || event.metaKey);
  };
  const childContent =
    children.length > 0 || onMoveNode ? renderChildren() : <div className="canvas-node-leaf" aria-hidden="true" />;
  const previewRegistered = widgetRegistry.hasPreview(node.type, node.version);
  const previewContent = widgetRegistry.renderPreview(node.type, node.version, {
    node,
    breakpointId,
    selected,
    children: childContent,
  });

  return (
    <article
      className="canvas-node"
      style={nodeStyle}
      data-canvas-node-id={node.id}
      data-canvas-node-type={node.type}
      data-depth={depth}
      data-selected={selected ? 'true' : 'false'}
      data-locked={node.locked ? 'true' : 'false'}
      data-hidden={node.hidden ? 'true' : 'false'}
      data-geometry-x={geometry.x}
      data-geometry-y={geometry.y}
      data-geometry-width={geometry.width ?? ''}
      data-geometry-height={geometry.height ?? ''}
      data-widget-registered={previewRegistered ? 'true' : 'false'}
      data-drag-source="false"
      draggable={Boolean(onMoveNode) && !node.locked}
      onDragStart={onMoveNode ? handleDragStart : undefined}
      onDragEnd={onMoveNode ? handleDragEnd : undefined}
      onKeyDown={onSelectNode ? handleKeyDown : undefined}
      tabIndex={onSelectNode ? 0 : undefined}
      aria-selected={onSelectNode ? selected : undefined}
      role={onSelectNode ? 'option' : undefined}
    >
      <header className="canvas-node-label" onClick={onSelectNode ? handleSelect : undefined}>
        <span>{nodeLabel(node)}</span>
        <code>{node.type}</code>
      </header>
      <div className="canvas-node-content">{previewContent ?? childContent}</div>
    </article>
  );
}

export function CanvasRenderer({
  document,
  breakpointId,
  viewportWidth,
  zoom,
  selectedNodeIds = [],
  onMoveNode,
  onSelectNode,
}: CanvasRendererProps) {
  const widgetRegistry = useEditorWidgetRegistry();
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
  } as CSSProperties;
  const selectedSet = new Set(selectedNodeIds);

  return (
    <div
      className="canvas-renderer"
      style={canvasStyle}
      data-testid="canvas-renderer"
      data-document-id={document.id}
      data-breakpoint-id={breakpointId}
      data-viewport-width={viewportWidth}
      data-zoom={zoom}
      data-drag-active="false"
      role={onSelectNode ? 'listbox' : undefined}
      aria-label={onSelectNode ? 'Canvas nodes' : undefined}
      aria-multiselectable={onSelectNode ? true : undefined}
    >
      <div className="canvas-scaled-document">
        <CanvasNodeView
          document={document}
          breakpointId={breakpointId}
          node={rootNode}
          depth={0}
          selectedNodeIds={selectedSet}
          widgetRegistry={widgetRegistry}
          onMoveNode={onMoveNode}
          onSelectNode={onSelectNode}
        />
      </div>
    </div>
  );
}
