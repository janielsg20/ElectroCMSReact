import { isJsonObject, type JsonObject, type JsonValue } from '../domain';
import { CONDITIONAL_OPERATORS, validateCalculationExpression } from './advanced-field-runtime';
import { createBuiltinFieldTypeDefinitions } from './builtin-field-types';
import {
  FIELD_TYPE_FEATURES,
  invalidFieldTypeValue,
  validFieldTypeValue,
  type FieldTypeDefinition,
  type FieldTypeFeature,
  type FieldTypeFeatureStatus,
  type FieldTypeValidationResult,
} from './field-type-definition';
import { FieldTypeRegistry } from './field-type-registry';

function features(
  overrides: Partial<Record<FieldTypeFeature, FieldTypeFeatureStatus>> = {},
): Record<FieldTypeFeature, FieldTypeFeatureStatus> {
  const result = Object.fromEntries(
    FIELD_TYPE_FEATURES.map((feature) => [feature, 'unsupported'] as const),
  ) as Record<FieldTypeFeature, FieldTypeFeatureStatus>;
  result.defaultValue = 'supported';
  result.description = 'supported';
  result.validation = 'supported';
  result.required = 'supported';
  result.conditions = 'modeled';
  result.roleVisibility = 'modeled';
  result.repetition = 'modeled';
  return { ...result, ...overrides };
}

function rejectUnknownKeys(config: JsonObject, allowed: readonly string[]): FieldTypeValidationResult | null {
  const unknown = Object.keys(config).find((key) => !allowed.includes(key));
  return unknown
    ? invalidFieldTypeValue('UNKNOWN_ADVANCED_CONFIG', unknown, `Unsupported advanced field config key: ${unknown}.`)
    : null;
}

function validateGroupConfig(config: JsonObject): FieldTypeValidationResult {
  const unknown = rejectUnknownKeys(config, ['fieldGroupId']);
  if (unknown) return unknown;
  return typeof config.fieldGroupId === 'string'
    ? validFieldTypeValue()
    : invalidFieldTypeValue('INVALID_GROUP_REFERENCE', 'fieldGroupId', 'fieldGroupId must be a string.');
}

function validateRepeaterConfig(config: JsonObject): FieldTypeValidationResult {
  const unknown = rejectUnknownKeys(config, ['fieldGroupId', 'minItems', 'maxItems']);
  if (unknown) return unknown;
  const issues = [] as { code: string; path: string; message: string }[];
  if (typeof config.fieldGroupId !== 'string') {
    issues.push({ code: 'INVALID_GROUP_REFERENCE', path: 'fieldGroupId', message: 'fieldGroupId must be a string.' });
  }
  if (config.minItems !== undefined && (!Number.isInteger(config.minItems) || Number(config.minItems) < 0)) {
    issues.push({ code: 'INVALID_MIN_ITEMS', path: 'minItems', message: 'minItems must be a non-negative integer.' });
  }
  if (config.maxItems !== undefined && (!Number.isInteger(config.maxItems) || Number(config.maxItems) < 1)) {
    issues.push({ code: 'INVALID_MAX_ITEMS', path: 'maxItems', message: 'maxItems must be a positive integer.' });
  }
  if (typeof config.minItems === 'number' && typeof config.maxItems === 'number' && config.minItems > config.maxItems) {
    issues.push({ code: 'INVALID_ITEM_RANGE', path: '$', message: 'minItems cannot exceed maxItems.' });
  }
  return { valid: issues.length === 0, issues };
}

function validateCalculatedConfig(config: JsonObject): FieldTypeValidationResult {
  const unknown = rejectUnknownKeys(config, ['expression']);
  if (unknown) return unknown;
  const expression = typeof config.expression === 'string' ? config.expression.trim() : '';
  if (!expression) return invalidFieldTypeValue('INVALID_EXPRESSION', 'expression', 'expression is required.');
  const syntax = validateCalculationExpression(expression);
  return syntax.ok
    ? validFieldTypeValue()
    : invalidFieldTypeValue('INVALID_EXPRESSION', 'expression', syntax.message);
}

function validateConditionalConfig(config: JsonObject): FieldTypeValidationResult {
  const unknown = rejectUnknownKeys(config, ['fieldGroupId', 'sourceField', 'operator', 'compareValue']);
  if (unknown) return unknown;
  const issues = [] as { code: string; path: string; message: string }[];
  if (typeof config.fieldGroupId !== 'string') {
    issues.push({ code: 'INVALID_GROUP_REFERENCE', path: 'fieldGroupId', message: 'fieldGroupId must be a string.' });
  }
  if (typeof config.sourceField !== 'string') {
    issues.push({ code: 'INVALID_SOURCE_FIELD', path: 'sourceField', message: 'sourceField must be a string.' });
  }
  if (!CONDITIONAL_OPERATORS.includes(config.operator as (typeof CONDITIONAL_OPERATORS)[number])) {
    issues.push({ code: 'INVALID_CONDITION_OPERATOR', path: 'operator', message: 'operator must be a supported conditional operator.' });
  }
  return { valid: issues.length === 0, issues };
}

function validateObject(value: JsonValue): FieldTypeValidationResult {
  return isJsonObject(value)
    ? validFieldTypeValue()
    : invalidFieldTypeValue('INVALID_GROUP_VALUE', '$', 'Value must be an object.');
}

function validateRepeater(value: JsonValue): FieldTypeValidationResult {
  return Array.isArray(value) && value.every(isJsonObject)
    ? validFieldTypeValue()
    : invalidFieldTypeValue('INVALID_REPEATER_VALUE', '$', 'Repeater value must be an array of objects.');
}

function validateCalculated(value: JsonValue): FieldTypeValidationResult {
  return typeof value === 'number' && Number.isFinite(value)
    ? validFieldTypeValue()
    : invalidFieldTypeValue('INVALID_CALCULATED_VALUE', '$', 'Calculated value must be a finite number.');
}

function validateConditional(value: JsonValue): FieldTypeValidationResult {
  return value === null || isJsonObject(value)
    ? validFieldTypeValue()
    : invalidFieldTypeValue('INVALID_CONDITIONAL_VALUE', '$', 'Conditional value must be an object or null.');
}

function advancedDefinition(input: {
  type: 'core/repeater' | 'core/group' | 'core/calculated' | 'core/conditional';
  category: FieldTypeDefinition['metadata']['category'];
  label: string;
  icon: string;
  description: string;
  valueShape: FieldTypeDefinition['valueShape'];
  configSchema: JsonObject;
  defaultConfig: JsonObject;
  validateConfig: FieldTypeDefinition['validateConfig'];
  validateValue: FieldTypeDefinition['validateValue'];
  createDefaultValue: FieldTypeDefinition['createDefaultValue'];
  featureOverrides: Partial<Record<FieldTypeFeature, FieldTypeFeatureStatus>>;
}): FieldTypeDefinition {
  return {
    type: input.type,
    version: 2,
    metadata: {
      label: input.label,
      category: input.category,
      icon: input.icon,
      description: input.description,
      keywords: ['advanced', 'mf-042'],
    },
    availability: 'available',
    valueShape: input.valueShape,
    configSchema: structuredClone(input.configSchema),
    defaultConfig: structuredClone(input.defaultConfig),
    validateConfig: input.validateConfig,
    createDefaultValue: input.createDefaultValue,
    validateValue: input.validateValue,
    features: features(input.featureOverrides),
    migrations: [],
  };
}

export function createMf042AdvancedFieldTypeDefinitions(): FieldTypeDefinition[] {
  return [
    advancedDefinition({
      type: 'core/repeater',
      category: 'structure',
      label: 'Repeater',
      icon: 'list-plus',
      description: 'Repeat rows using another reusable Field Group as the item schema.',
      valueShape: 'array',
      configSchema: { fieldGroupId: 'field-group-id', minItems: 'integer?', maxItems: 'integer?' },
      defaultConfig: { fieldGroupId: '', minItems: 0 },
      validateConfig: validateRepeaterConfig,
      validateValue: validateRepeater,
      createDefaultValue: () => [],
      featureOverrides: { repetition: 'supported', conditions: 'supported' },
    }),
    advancedDefinition({
      type: 'core/group',
      category: 'structure',
      label: 'Group',
      icon: 'folder-tree',
      description: 'Embed one reusable Field Group as a nested object.',
      valueShape: 'object',
      configSchema: { fieldGroupId: 'field-group-id' },
      defaultConfig: { fieldGroupId: '' },
      validateConfig: validateGroupConfig,
      validateValue: validateObject,
      createDefaultValue: () => ({}),
      featureOverrides: { conditions: 'supported' },
    }),
    advancedDefinition({
      type: 'core/calculated',
      category: 'computed',
      label: 'Calculated',
      icon: 'calculator',
      description: 'Read-only numeric value derived from sibling numeric fields with a safe expression.',
      valueShape: 'number',
      configSchema: { expression: 'calculation-expression' },
      defaultConfig: { expression: '0' },
      validateConfig: validateCalculatedConfig,
      validateValue: validateCalculated,
      createDefaultValue: () => 0,
      featureOverrides: { defaultValue: 'unsupported', conditions: 'supported' },
    }),
    advancedDefinition({
      type: 'core/conditional',
      category: 'computed',
      label: 'Conditional',
      icon: 'workflow',
      description: 'Conditionally expose a nested reusable Field Group based on a sibling field value.',
      valueShape: 'object',
      configSchema: {
        fieldGroupId: 'field-group-id',
        sourceField: 'field-storage-name',
        operator: 'conditional-operator',
        compareValue: 'json?',
      },
      defaultConfig: { fieldGroupId: '', sourceField: '', operator: 'truthy' },
      validateConfig: validateConditionalConfig,
      validateValue: validateConditional,
      createDefaultValue: () => null,
      featureOverrides: { conditions: 'supported' },
    }),
  ];
}

export function createContentFieldTypeRegistry(): FieldTypeRegistry {
  const registry = new FieldTypeRegistry();
  for (const definition of createBuiltinFieldTypeDefinitions()) registry.register(definition);
  for (const definition of createMf042AdvancedFieldTypeDefinitions()) registry.register(definition);
  return registry;
}
