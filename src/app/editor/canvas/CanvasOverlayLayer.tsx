export interface CanvasOverlayLayerProps {
  viewportWidth: number;
  zoom: number;
  selectedNodeIds?: readonly string[];
}

export function CanvasOverlayLayer({
  viewportWidth,
  zoom,
  selectedNodeIds = [],
}: CanvasOverlayLayerProps) {
  return (
    <div
      className="canvas-overlay-layer"
      aria-hidden="true"
      data-testid="canvas-overlay-layer"
      data-viewport-width={viewportWidth}
      data-zoom={zoom}
      data-selection-count={selectedNodeIds.length}
    >
      <div className="canvas-viewport-badge">
        <span>{viewportWidth}px</span>
        <span>{zoom}%</span>
        {selectedNodeIds.length > 0 ? <span>{selectedNodeIds.length} selected</span> : null}
      </div>
    </div>
  );
}
