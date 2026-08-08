import type { CSSProperties } from 'react';
import type { SnapGuide } from '../../../core/project';

export interface CanvasOverlayLayerProps {
  viewportWidth: number;
  zoom: number;
  selectedNodeIds?: readonly string[];
  guides?: readonly SnapGuide[];
}

export function CanvasOverlayLayer({
  viewportWidth,
  zoom,
  selectedNodeIds = [],
  guides = [],
}: CanvasOverlayLayerProps) {
  const scale = zoom / 100;

  return (
    <div
      className="canvas-overlay-layer"
      aria-hidden="true"
      data-testid="canvas-overlay-layer"
      data-viewport-width={viewportWidth}
      data-zoom={zoom}
      data-selection-count={selectedNodeIds.length}
      data-guide-count={guides.length}
    >
      {guides.map((guide, index) => {
        const position = guide.value * scale;
        const style: CSSProperties =
          guide.axis === 'x' ? { left: `${position}px` } : { top: `${position}px` };
        return (
          <span
            key={`${guide.axis}-${guide.kind}-${guide.value}-${index}`}
            className="canvas-snap-guide"
            data-axis={guide.axis}
            data-kind={guide.kind}
            style={style}
          />
        );
      })}
      <div className="canvas-viewport-badge">
        <span>{viewportWidth}px</span>
        <span>{zoom}%</span>
        {selectedNodeIds.length > 0 ? <span>{selectedNodeIds.length} selected</span> : null}
      </div>
    </div>
  );
}
