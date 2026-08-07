export interface CanvasOverlayLayerProps {
  viewportWidth: number;
  zoom: number;
}

export function CanvasOverlayLayer({ viewportWidth, zoom }: CanvasOverlayLayerProps) {
  return (
    <div
      className="canvas-overlay-layer"
      aria-hidden="true"
      data-testid="canvas-overlay-layer"
      data-viewport-width={viewportWidth}
      data-zoom={zoom}
    >
      <div className="canvas-viewport-badge">
        <span>{viewportWidth}px</span>
        <span>{zoom}%</span>
      </div>
    </div>
  );
}
