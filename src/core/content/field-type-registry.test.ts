import { describe, expect, it } from 'vitest';
import { ConflictError } from '../domain';
import {
  createBuiltinFieldTypeDefinitions,
  createDefaultFieldTypeRegistry,
} from './builtin-field-types';
import {
  FIELD_TYPE_FEATURES,
  invalidFieldTypeValue,
  validFieldTypeValue,
  type FieldTypeDefinition,
  type FieldTypeFeature,
  type FieldTypeFeatureStatus,
} from './field-type-definition';
import { FieldTypeRegistry, FieldTypeRegistryError } from './field-type-registry';

function allSupportedFeatures(): Record<FieldTypeFeature, FieldTypeFeatureStatus> {
  return Object.fromEntries(
    FIELD_TYPE_FEATURES.map((feature) => [feature, 'supported'] as const),
  ) as Record<FieldTypeFeature, FieldTypeFeatureStatus>;
}

function ratingDefinition(version = 1): FieldTypeDefinition {
  return {
    type: 'plugin/rating',
    version,
    metadata: {
      label: 'Rating',
      category: 'number',
      icon: 'star',
      description: 'External plugin rating field.',
      keywords: ['score'],
    },
    availability: 'available',
    valueShape: 'number',
    configSchema: { max: 'number' },
    defaultConfig: { max: version === 1 ? 5 : 10 },
    validateConfig(config) {
      return typeof config.max === 'number' && Number.isInteger(config.max) && config.max > 0
        ? validFieldTypeValue()
        : invalidFieldTypeValue('INVALID_MAX', 'max', 'max must be a positive integer.');
    },
    createDefaultValue: () => null,
    validateValue(value, config) {
      if (value === null) return validFieldTypeValue();
      if (typeof value !== 'number') {
        return invalidFieldTypeValue('INVALID_RATING', '$', 'Rating must be numeric or null.');
      }
      return value >= 0 && typeof config.max === 'number' && value <= config.max
        ? validFieldTypeValue()
        : invalidFieldTypeValue('RATING_OUT_OF_RANGE', '$', 'Rating is outside configured range.');
    },
    features: allSupportedFeatures(),
    migrations:
      version === 2
        ? [
            {
              fromVersion: 1,
              toVersion: 2,
              migrate(config) {
                return { ...config, max: typeof config.max === 'number' ? config.max * 2 : 10 };
              },
            },
          ]
        : [],
  };
}

describe('FieldTypeRegistry', () => {
  it('registers the 27 minimum field contracts from the master prompt with honest availability', () => {
    const definitions = createBuiltinFieldTypeDefinitions();
    expect(definitions).toHaveLength(27);
    expect(new Set(definitions.map((definition) => definition.type)).size).toBe(27);

    const registry = createDefaultFieldTypeRegistry();
    expect(registry.listLatest()).toHaveLength(27);
    expect(registry.listLatest({ availability: 'available' })).toHaveLength(20);
    expect(registry.listLatest({ availability: 'modeled' })).toHaveLength(7);

    expect(registry.has('core/text')).toBe(true);
    expect(registry.has('core/map')).toBe(true);
    expect(registry.resolve('core/repeater').availability).toBe('modeled');
    expect(registry.resolve('core/relation').metadata.description).toContain('MF-043');
  });

  it('validates type-specific config and values without React or project state', () => {
    const registry = createDefaultFieldTypeRegistry();

    expect(registry.validateConfig('core/text', { minLength: 2, maxLength: 8 }).valid).toBe(true);
    expect(registry.validateConfig('core/text', { minLength: 9, maxLength: 8 }).valid).toBe(false);
    expect(registry.validateValue('core/text', 'hello', { minLength: 2, maxLength: 8 }).valid).toBe(true);
    expect(registry.validateValue('core/text', 'x', { minLength: 2 }).valid).toBe(false);

    expect(registry.validateValue('core/number', 12, { min: 10, max: 20 }).valid).toBe(true);
    expect(registry.validateValue('core/number', 21, { min: 10, max: 20 }).valid).toBe(false);

    const choiceConfig = {
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
    };
    expect(registry.validateConfig('core/select', choiceConfig).valid).toBe(true);
    expect(registry.validateValue('core/select', 'published', choiceConfig).valid).toBe(true);
    expect(registry.validateValue('core/select', 'missing', choiceConfig).valid).toBe(false);

    expect(registry.validateValue('core/map', { lat: 29.7604, lng: -95.3698 }).valid).toBe(true);
    expect(registry.validateValue('core/map', { lat: 100, lng: -95.3698 }).valid).toBe(false);
  });

  it('rejects malformed definitions and duplicate type versions', () => {
    const registry = new FieldTypeRegistry();
    const malformed = { ...ratingDefinition(), type: 'rating' };
    expect(() => registry.register(malformed)).toThrow(FieldTypeRegistryError);

    registry.register(ratingDefinition());
    expect(() => registry.register(ratingDefinition())).toThrow(ConflictError);
  });

  it('allows an external plugin field without modifying the core registry implementation', () => {
    const registry = createDefaultFieldTypeRegistry();
    registry.register(ratingDefinition());

    expect(registry.has('plugin/rating', 1)).toBe(true);
    expect(registry.resolve('plugin/rating').metadata.label).toBe('Rating');
    expect(registry.validateValue('plugin/rating', 4, { max: 5 }).valid).toBe(true);
    expect(registry.validateValue('plugin/rating', 7, { max: 5 }).valid).toBe(false);
    expect(registry.createDefaultValue('plugin/rating', { max: 5 })).toBeNull();
  });

  it('returns defensive definition clones so consumers cannot mutate registry state', () => {
    const registry = createDefaultFieldTypeRegistry();
    const first = registry.resolve('core/currency');
    first.defaultConfig.currency = 'EUR';
    first.metadata.label = 'Changed';
    (first.features as Record<FieldTypeFeature, FieldTypeFeatureStatus>).required = 'unsupported';

    const second = registry.resolve('core/currency');
    expect(second.defaultConfig.currency).toBe('USD');
    expect(second.metadata.label).toBe('Currency');
    expect(second.features.required).toBe('supported');
  });

  it('migrates versioned field config through explicit one-step hooks', () => {
    const registry = new FieldTypeRegistry();
    registry.register(ratingDefinition(1));
    registry.register(ratingDefinition(2));

    expect(registry.latestVersion('plugin/rating')).toBe(2);
    expect(registry.migrateConfig('plugin/rating', { max: 5 }, 1)).toEqual({ max: 10 });
  });

  it('rejects invalid default definitions at registration time', () => {
    const registry = new FieldTypeRegistry();
    const invalidDefault = {
      ...ratingDefinition(),
      defaultConfig: { max: 0 },
    };
    expect(() => registry.register(invalidDefault)).toThrowError(
      expect.objectContaining({ registryCode: 'INVALID_DEFINITION' }),
    );
  });
});
