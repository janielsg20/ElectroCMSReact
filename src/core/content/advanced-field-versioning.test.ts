import { describe, expect, it } from 'vitest';
import {
  createContentFieldTypeRegistry,
  createDefaultCustomFieldDefinition,
  isMf042AdvancedField,
} from './index';

describe('MF-042 advanced field version boundary', () => {
  it('activates runtime behavior only for the available v2 definitions', () => {
    const registry = createContentFieldTypeRegistry();
    const current = createDefaultCustomFieldDefinition(registry, 'core/group', 'nested-group', 'Nested Group');
    expect(registry.resolve('core/group', 1)).toMatchObject({ version: 1, availability: 'modeled' });
    expect(registry.resolve('core/group', 2)).toMatchObject({ version: 2, availability: 'available' });
    expect(isMf042AdvancedField(current)).toBe(true);
    expect(isMf042AdvancedField({ ...current, typeVersion: 1 })).toBe(false);
  });
});
