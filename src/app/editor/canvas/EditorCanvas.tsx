import { useEffect } from 'react';
import type { CanonicalDocument } from '../../../core/project';
import { CanvasOverlayLayer } from './CanvasOverlayLayer';
import { CanvasRenderer } from './CanvasRenderer';
import { useCanvasSelection } from './use-canvas-selection';

export interface EditorCanvasProps {
  document: CanonicalDocument;
  viewportWidth: number;
  zoom: number;
  onInsertContainer?: () => void;
  onMoveNode?: (nodeId: string, parentId: string, index: number) => boolean;
}

export function EditorCanvas({
  document,
  viewportWidth,
  zoom,
  onInsertContainer,
  onMoveNode,
}: EditorCanvasProps) {
  const selection = useCanvasSelection(Object.keys(document.nodes));
  const rendererProps = onMoveNode ? { onMoveNode } : {};

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') selection.clearSelection();
    };
    globalThis.addEventListener('keydown', handleKeyDown);
    return () => globalThis.removeEventListener('keydown', handleKeyDown);
  }, [selection.clearSelection]);

  return (
    <section
      className="editor-canvas"
      aria-label="Visual document canvas"
      data-testid="editor-canvas"
      onClick={selection.clearSelection}
    >
      {onInsertContainer ? (
        <div className="canvas-command-bar" aria-label="Canvas commands">
          <button type="button" onClick={onInsertContainer}>
            Insert container
          </button>
          <span>Drag nodes between insertion targets to reorder or nest them.</span>
        </div>
      ) : null}
      <div className="editor-canvas-layers">
        <CanvasRenderer
          document={document}
          viewportWidth={viewportWidth}
          zoom={zoom}
          selectedNodeIds={selection.selectedNodeIds}
          onSelectNode={selection.selectNode}
          {...rendererProps}
        />
        <CanvasOverlayLayer
          viewportWidth={viewportWidth}
          zoom={zoom}
          selectedNodeIds={selection.selectedNodeIds}
        />
      </div>
    </section>
  );
}
