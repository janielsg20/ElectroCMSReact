import { describe, expect, it } from 'vitest';
import { createCanonicalProject } from './project-factory';
import {
  getBreakpointInheritanceChain,
  getNearestNarrowerBreakpoint,
  getNearestWiderBreakpoint,
  sortBreakpoints,
  validateBreakpointSet,
} from './breakpoint-engine';

describe('breakpoint engine', () => {
  const breakpoints = createCanonicalProject({ id: 'project_breakpoints', name: 'Breakpoints' }).breakpoints;

  it('sorts the canonical chain from widest to narrowest', () => {
    expect(sortBreakpoints([...breakpoints].reverse()).map((item) => item.id)).toEqual([
      'desktop',
      'laptop',
      'tablet-landscape',
      'tablet-portrait',
      'mobile-large',
      'mobile-small',
    ]);
  });

  it('resolves adjacent wider and narrower breakpoints', () => {
    expect(getNearestWiderBreakpoint(breakpoints, 'tablet-portrait')?.id).toBe('tablet-landscape');
    expect(getNearestNarrowerBreakpoint(breakpoints, 'tablet-portrait')?.id).toBe('mobile-large');
    expect(getNearestWiderBreakpoint(breakpoints, 'desktop')).toBeNull();
    expect(getNearestNarrowerBreakpoint(breakpoints, 'mobile-small')).toBeNull();
  });

  it('returns inheritance candidates nearest-first', () => {
    expect(getBreakpointInheritanceChain(breakpoints, 'mobile-large').map((item) => item.id)).toEqual([
      'tablet-portrait',
      'tablet-landscape',
      'laptop',
      'desktop',
    ]);
  });

  it('rejects duplicate order and non-descending widths', () => {
    const invalid = [
      { ...breakpoints[0]!, id: 'wide', order: 0, width: 1200 },
      { ...breakpoints[1]!, id: 'narrower-same-order', order: 0, width: 1000 },
      { ...breakpoints[2]!, id: 'too-wide-next', order: 1, width: 1100 },
    ];
    const result = validateBreakpointSet(invalid);
    expect(result.valid).toBe(false);
    expect(result.issues.map((item) => item.code)).toContain('DUPLICATE_ORDER');
    expect(result.issues.map((item) => item.code)).toContain('NON_DESCENDING_WIDTH');
  });
});
