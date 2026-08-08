import type { CSSProperties } from 'react';
import { resolveNodeStyleValues, type DocumentNode } from '../../../core/project';

const SAFE_CANVAS_STYLE_KEYS = new Set([
  'color',
  'backgroundColor',
  'fontSize',
  'fontWeight',
  'lineHeight',
  'letterSpacing',
  'textAlign',
  'padding',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'margin',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  'borderRadius',
  'borderWidth',
  'borderColor',
  'borderStyle',
  'opacity',
  'gap',
  'minWidth',
  'maxWidth',
  'minHeight',
  'maxHeight',
]);

export function resolveCanvasNodeStyle(node: DocumentNode, breakpointId: string): CSSProperties {
  const resolved = resolveNodeStyleValues(node, breakpointId);
  const css: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(resolved)) {
    if (!SAFE_CANVAS_STYLE_KEYS.has(key)) continue;
    if (typeof value === 'string' || typeof value === 'number') css[key] = value;
  }
  return css as CSSProperties;
}
