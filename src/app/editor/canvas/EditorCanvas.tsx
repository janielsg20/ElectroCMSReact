import type { CanonicalDocument } from '../../../core/project';
import { CanvasOverlayLayer } from './CanvasOverlayLayer';
import { CanvasRenderer } from './CanvasRenderer';

export interface EditorCanvasProps {
  document: CanonicalDocument;
  viewportWidth: number;
  zoom: number;
}

export function EditorCanvas({ document, viewportWidth, zoom }: EditorCanvasProps) {
  return (
    <section className="editor-canvas" aria-label="Visual document canvas" data-testid="editor-canvas">
      <div className="editor-canvas-layers">
        <CanvasRenderer document={document} viewportWidth={viewportWidth} zoom={zoom} />
        <CanvasOverlayLayer viewportWidth={viewportWidth} zoom={zoom} />
      </div>
    </section>
  );
}
