import type { JsonValue } from '../domain';
import { updateDocumentNode } from './document-tree';
import type {
  CanonicalDocument,
  DocumentNode,
  ResponsiveSlot,
  ResponsiveStyleSet,
  ResponsiveValue,
} from './project-model';

export const NODE_GEOMETRY_KEYS = {
  x: 'layout.x',
  y: 'layout.y',
  width: 'layout.width',
  height: 'layout.height',
} as const;

export interface NodeGeometry {
  x: number;
  y: number;
  width?: number;
  height?: number;
}

export interface NodeGeometryPatch {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface SnapGuide {
  axis: 'x' | 'y';
  value: number;
  kind: 'grid' | 'viewport-edge' | 'viewport-center';
}

export interface SnapNumberResult {
  value: number;
  guide: SnapGuide;
}

function slotNumber(
  responsive: ResponsiveValue<JsonValue> | undefined,
  breakpointId: string,
  seen: Set<string>,
): number | undefined {
  const slot: ResponsiveSlot<JsonValue> | undefined = responsive?.[breakpointId];
  if (!slot || slot.state === 'unset') return undefined;
  if (slot.state === 'explicit') {
    return typeof slot.value === 'number' && Number.isFinite(slot.value) ? slot.value : undefined;
  }
  if (seen.has(slot.fromBreakpointId)) return undefined;
  seen.add(slot.fromBreakpointId);
  return slotNumber(responsive, slot.fromBreakpointId, seen);
}

export function readResponsiveStyleNumber(
  styles: ResponsiveStyleSet,
  key: string,
  breakpointId: string,
): number | undefined {
  return slotNumber(styles[key], breakpointId, new Set([breakpointId]));
}

export function readNodeGeometry(node: DocumentNode, breakpointId: string): NodeGeometry {
  const x = readResponsiveStyleNumber(node.styles, NODE_GEOMETRY_KEYS.x, breakpointId) ?? 0;
  const y = readResponsiveStyleNumber(node.styles, NODE_GEOMETRY_KEYS.y, breakpointId) ?? 0;
  const width = readResponsiveStyleNumber(node.styles, NODE_GEOMETRY_KEYS.width, breakpointId);
  const height = readResponsiveStyleNumber(node.styles, NODE_GEOMETRY_KEYS.height, breakpointId);
  return {
    x,
    y,
    ...(width === undefined ? {} : { width }),
    ...(height === undefined ? {} : { height }),
  };
}

function explicitNumberSlot(value: number): ResponsiveSlot<JsonValue> {
  return { state: 'explicit', value };
}

function setStyleNumber(
  styles: ResponsiveStyleSet,
  key: string,
  breakpointId: string,
  value: number,
): ResponsiveStyleSet {
  return {
    ...styles,
    [key]: {
      ...(styles[key] ?? {}),
      [breakpointId]: explicitNumberSlot(value),
    },
  };
}

function finiteGeometryValue(value: number, label: string): number {
  if (!Number.isFinite(value)) throw new Error(`${label} must be finite.`);
  return value;
}

export function setNodeGeometry(
  document: CanonicalDocument,
  nodeId: string,
  breakpointId: string,
  patch: NodeGeometryPatch,
): CanonicalDocument {
  return updateDocumentNode(document, nodeId, (node) => {
    let styles = node.styles;
    if (patch.x !== undefined) {
      styles = setStyleNumber(styles, NODE_GEOMETRY_KEYS.x, breakpointId, finiteGeometryValue(patch.x, 'x'));
    }
    if (patch.y !== undefined) {
      styles = setStyleNumber(styles, NODE_GEOMETRY_KEYS.y, breakpointId, finiteGeometryValue(patch.y, 'y'));
    }
    if (patch.width !== undefined) {
      styles = setStyleNumber(
        styles,
        NODE_GEOMETRY_KEYS.width,
        breakpointId,
        Math.max(32, finiteGeometryValue(patch.width, 'width')),
      );
    }
    if (patch.height !== undefined) {
      styles = setStyleNumber(
        styles,
        NODE_GEOMETRY_KEYS.height,
        breakpointId,
        Math.max(32, finiteGeometryValue(patch.height, 'height')),
      );
    }
    return { ...node, styles };
  });
}

function nearestCandidate(
  value: number,
  candidates: readonly { value: number; guide: SnapGuide }[],
): { value: number; guide: SnapGuide; distance: number } | null {
  let best: { value: number; guide: SnapGuide; distance: number } | null = null;
  for (const candidate of candidates) {
    const distance = Math.abs(candidate.value - value);
    if (!best || distance < best.distance) best = { ...candidate, distance };
  }
  return best;
}

export function snapCanvasNumber(
  value: number,
  axis: 'x' | 'y',
  options: {
    gridSize?: number;
    threshold?: number;
    viewportSize?: number;
  } = {},
): SnapNumberResult {
  const gridSize = options.gridSize ?? 8;
  const threshold = options.threshold ?? 4;
  const gridValue = Math.round(value / gridSize) * gridSize;
  const candidates: { value: number; guide: SnapGuide }[] = [
    { value: gridValue, guide: { axis, value: gridValue, kind: 'grid' } },
  ];

  if (options.viewportSize !== undefined) {
    const viewportSize = options.viewportSize;
    candidates.push(
      { value: 0, guide: { axis, value: 0, kind: 'viewport-edge' } },
      {
        value: viewportSize / 2,
        guide: { axis, value: viewportSize / 2, kind: 'viewport-center' },
      },
      {
        value: viewportSize,
        guide: { axis, value: viewportSize, kind: 'viewport-edge' },
      },
    );
  }

  const nearest = nearestCandidate(value, candidates);
  if (!nearest || nearest.distance > threshold) {
    return { value, guide: { axis, value, kind: 'grid' } };
  }
  return { value: nearest.value, guide: nearest.guide };
}

export function snapNodeGeometryPatch(
  patch: NodeGeometryPatch,
  viewportWidth: number,
): { patch: NodeGeometryPatch; guides: readonly SnapGuide[] } {
  const nextPatch: NodeGeometryPatch = {};
  const guides: SnapGuide[] = [];
  if (patch.x !== undefined) {
    const snapped = snapCanvasNumber(patch.x, 'x', { viewportSize: viewportWidth });
    nextPatch.x = snapped.value;
    guides.push(snapped.guide);
  }
  if (patch.y !== undefined) {
    const snapped = snapCanvasNumber(patch.y, 'y');
    nextPatch.y = snapped.value;
    guides.push(snapped.guide);
  }
  if (patch.width !== undefined) {
    const snapped = snapCanvasNumber(patch.width, 'x', { viewportSize: viewportWidth });
    nextPatch.width = Math.max(32, snapped.value);
    guides.push(snapped.guide);
  }
  if (patch.height !== undefined) {
    const snapped = snapCanvasNumber(patch.height, 'y');
    nextPatch.height = Math.max(32, snapped.value);
    guides.push(snapped.guide);
  }
  return { patch: nextPatch, guides };
}
