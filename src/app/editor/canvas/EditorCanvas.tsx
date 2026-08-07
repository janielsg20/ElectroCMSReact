import type { CanonicalDocument } from '../../../core/project';
import { CanvasOverlayLayer } from './CanvasOverlayLayer';
import { CanvasRenderer } from './CanvasRenderer';

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
  const rendererProps = onMoveNode ? { onMoveNode } : {};

  return (
    <section className="editor-canvas" aria-label="Visual document canvas" data-testid="editor-canvas">
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
          {...rendererProps}
        />
        <CanvasOverlayLayer viewportWidth={viewportWidth} zoom={zoom} />
      </div>
    </section>
  );
}
