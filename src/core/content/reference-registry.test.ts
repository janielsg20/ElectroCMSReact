import { describe, expect, it } from 'vitest';
import { createContentFieldTypeRegistry } from './index';

describe('MF-043 complete Field Type registry', () => {
  it('exposes all 27 latest built-ins as available while preserving deferred v1 contracts', () => {
    const registry = createContentFieldTypeRegistry();
    const latest = registry.listLatest();

    expect(latest).toHaveLength(27);
    expect(latest.every((definition) => definition.availability === 'available')).toBe(true);
    expect(registry.listLatest({ availability: 'modeled' })).toEqual([]);

    for (const type of [
      'core/repeater',
      'core/group',
      'core/calculated',
      'core/conditional',
      'core/relation',
      'core/user',
      'core/taxonomy',
    ]) {
      expect(registry.resolve(type, 1)).toMatchObject({ version: 1, availability: 'modeled' });
      expect(registry.resolve(type)).toMatchObject({ version: 2, availability: 'available' });
    }
  });
});
