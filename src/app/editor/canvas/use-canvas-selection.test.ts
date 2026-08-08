import { describe, expect, it } from 'vitest';
import { toggleCanvasSelection } from './use-canvas-selection';

describe('toggleCanvasSelection', () => {
  it('replaces selection on normal click', () => {
    expect(toggleCanvasSelection(['node_a', 'node_b'], 'node_c', false)).toEqual(['node_c']);
  });

  it('adds and removes nodes with additive selection', () => {
    expect(toggleCanvasSelection(['node_a'], 'node_b', true)).toEqual(['node_a', 'node_b']);
    expect(toggleCanvasSelection(['node_a', 'node_b'], 'node_a', true)).toEqual(['node_b']);
  });
});
