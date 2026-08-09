import { isJsonObject, type JsonObject, type JsonValue } from '../domain';
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

interface BuiltinFieldTypeSpec {
  name: string;
  label: string;
  category: FieldTypeDefinition['metadata']['category'];
  icon: string;
  description: string;
  keywords?: readonly string[];
  availability?: FieldTypeDefinition['availability'];
  valueShape: FieldTypeDefinition['valueShape'];
  configSchema?: JsonObject;
  defaultConfig?: JsonObject;
  validateConfig?: FieldTypeDefinition['validateConfig'];
  validateValue: FieldTypeDefinition['validateValue'];
  createDefaultValue?: FieldTypeDefinition['createDefaultValue'];
  featureOverrides?: Partial<Record<FieldTypeFeature, FieldTypeFeatureStatus>>;
}

function featureMatrix(overrides: Partial<Record<FieldTypeFeature, FieldTypeFeatureStatus>> = {}): Record<FieldTypeFeature, FieldTypeFeatureStatus> {
  const features = Object.fromEntries(FIELD_TYPE_FEATURES.map((feature) => [feature, 'unsupported'] as const)) as Record<FieldTypeFeature, FieldTypeFeatureStatus>;
  features.defaultValue = 'supported';
  features.description = 'supported';
  features.validation = 'supported';
  features.required = 'supported';
  features.conditions = 'modeled';
  features.repetition = 'modeled';
  features.roleVisibility = 'modeled';
  return { ...features, ...overrides };
}

function validateEmptyConfig(config: JsonObject): FieldTypeValidationResult {
  return Object.keys(config).length === 0
    ? validFieldTypeValue()
    : invalidFieldTypeValue('UNSUPPORTED_CONFIG', '$', 'This field type does not accept type-specific config yet.');
}

function validateStringConfig(config: JsonObject): FieldTypeValidationResult {
  const issues = [] as { code: string; path: string; message: string }[];
  const minLength = config.minLength;
  const maxLength = config.maxLength;
  if (minLength !== undefined && (!Number.isInteger(minLength) || (minLength as number) < 0)) issues.push({ code: 'INVALID_MIN_LENGTH', path: 'minLength', message: 'minLength must be a non-negative integer.' });
  if (maxLength !== undefined && (!Number.isInteger(maxLength) || (maxLength as number) < 1)) issues.push({ code: 'INVALID_MAX_LENGTH', path: 'maxLength', message: 'maxLength must be a positive integer.' });
  if (typeof minLength === 'number' && typeof maxLength === 'number' && minLength > maxLength) issues.push({ code: 'INVALID_LENGTH_RANGE', path: '$', message: 'minLength cannot exceed maxLength.' });
  return { valid: issues.length === 0, issues };
}

function validateStringValue(value: JsonValue, config: JsonObject): FieldTypeValidationResult {
  if (value === null) return validFieldTypeValue();
  if (typeof value !== 'string') return invalidFieldTypeValue('INVALID_STRING', '$', 'Value must be a string or null.');
  const minLength = typeof config.minLength === 'number' ? config.minLength : null;
  const maxLength = typeof config.maxLength === 'number' ? config.maxLength : null;
  if (minLength !== null && value.length < minLength) return invalidFieldTypeValue('STRING_TOO_SHORT', '$', `Value must contain at least ${minLength} characters.`);
  if (maxLength !== null && value.length > maxLength) return invalidFieldTypeValue('STRING_TOO_LONG', '$', `Value must contain at most ${maxLength} characters.`);
  return validFieldTypeValue();
}

function validateNumberConfig(config: JsonObject): FieldTypeValidationResult {
  const issues = [] as { code: string; path: string; message: string }[];
  for (const key of ['min', 'max', 'step'] as const) {
    const value = config[key];
    if (value !== undefined && (typeof value !== 'number' || !Number.isFinite(value))) issues.push({ code: 'INVALID_NUMBER_CONFIG', path: key, message: `${key} must be a finite number.` });
  }
  if (typeof config.step === 'number' && config.step <= 0) issues.push({ code: 'INVALID_STEP', path: 'step', message: 'step must be greater than zero.' });
  if (typeof config.min === 'number' && typeof config.max === 'number' && config.min > config.max) issues.push({ code: 'INVALID_NUMBER_RANGE', path: '$', message: 'min cannot exceed max.' });
  if (config.currency !== undefined && (typeof config.currency !== 'string' || !/^[A-Z]{3}$/.test(config.currency))) issues.push({ code: 'INVALID_CURRENCY', path: 'currency', message: 'currency must be a 3-letter uppercase code.' });
  return { valid: issues.length === 0, issues };
}

function validateNumberValue(value: JsonValue, config: JsonObject): FieldTypeValidationResult {
  if (value === null) return validFieldTypeValue();
  if (typeof value !== 'number' || !Number.isFinite(value)) return invalidFieldTypeValue('INVALID_NUMBER', '$', 'Value must be a finite number or null.');
  if (typeof config.min === 'number' && value < config.min) return invalidFieldTypeValue('NUMBER_BELOW_MIN', '$', `Value must be at least ${config.min}.`);
  if (typeof config.max === 'number' && value > config.max) return invalidFieldTypeValue('NUMBER_ABOVE_MAX', '$', `Value must be at most ${config.max}.`);
  return validFieldTypeValue();
}

function validateBooleanValue(value: JsonValue): FieldTypeValidationResult {
  return value === null || typeof value === 'boolean' ? validFieldTypeValue() : invalidFieldTypeValue('INVALID_BOOLEAN', '$', 'Value must be boolean or null.');
}

function validateChoiceConfig(config: JsonObject): FieldTypeValidationResult {
  const options = config.options;
  if (!Array.isArray(options)) return invalidFieldTypeValue('INVALID_OPTIONS', 'options', 'options must be an array.');
  const seen = new Set<string>();
  for (let index = 0; index < options.length; index += 1) {
    const option = options[index];
    if (!isJsonObject(option) || typeof option.label !== 'string' || typeof option.value !== 'string') return invalidFieldTypeValue('INVALID_OPTION', `options.${index}`, 'Each option must have string label and value.');
    if (!option.label.trim() || !option.value.trim() || seen.has(option.value)) return invalidFieldTypeValue('INVALID_OPTION', `options.${index}`, 'Option label/value must be non-empty and values must be unique.');
    seen.add(option.value);
  }
  return validFieldTypeValue();
}

function validateChoiceValue(value: JsonValue, config: JsonObject): FieldTypeValidationResult {
  if (value === null) return validFieldTypeValue();
  if (typeof value !== 'string') return invalidFieldTypeValue('INVALID_CHOICE', '$', 'Choice value must be a string or null.');
  const options = Array.isArray(config.options) ? config.options : [];
  return options.some((option) => isJsonObject(option) && option.value === value)
    ? validFieldTypeValue()
    : invalidFieldTypeValue('UNKNOWN_CHOICE', '$', `Value ${value} is not present in options.`);
}

function validateStringReference(value: JsonValue): FieldTypeValidationResult {
  return value === null || (typeof value === 'string' && value.length > 0) ? validFieldTypeValue() : invalidFieldTypeValue('INVALID_REFERENCE', '$', 'Reference value must be a non-empty string id or null.');
}

function validateStringReferenceList(value: JsonValue): FieldTypeValidationResult {
  if (value === null) return validFieldTypeValue();
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string' || !item)) return invalidFieldTypeValue('INVALID_REFERENCE_LIST', '$', 'Value must be an array of non-empty string ids or null.');
  return new Set(value).size === value.length ? validFieldTypeValue() : invalidFieldTypeValue('DUPLICATE_REFERENCE', '$', 'Reference ids must be unique.');
}

function validateMapValue(value: JsonValue): FieldTypeValidationResult {
  if (value === null) return validFieldTypeValue();
  if (!isJsonObject(value) || typeof value.lat !== 'number' || typeof value.lng !== 'number') return invalidFieldTypeValue('INVALID_MAP_POINT', '$', 'Map value must contain numeric lat and lng.');
  if (value.lat < -90 || value.lat > 90 || value.lng < -180 || value.lng > 180) return invalidFieldTypeValue('MAP_POINT_OUT_OF_RANGE', '$', 'Map coordinates are out of range.');
  return validFieldTypeValue();
}

function validateArrayValue(value: JsonValue): FieldTypeValidationResult {
  return value === null || Array.isArray(value) ? validFieldTypeValue() : invalidFieldTypeValue('INVALID_ARRAY', '$', 'Value must be an array or null.');
}

function validateObjectValue(value: JsonValue): FieldTypeValidationResult {
  return value === null || isJsonObject(value) ? validFieldTypeValue() : invalidFieldTypeValue('INVALID_OBJECT', '$', 'Value must be an object or null.');
}

function validateJsonValue(): FieldTypeValidationResult {
  return validFieldTypeValue();
}

function makeBuiltinFieldType(spec: BuiltinFieldTypeSpec): FieldTypeDefinition {
  return {
    type: `core/${spec.name}`,
    version: 1,
    metadata: {
      label: spec.label,
      category: spec.category,
      icon: spec.icon,
      description: spec.description,
      ...(spec.keywords ? { keywords: [...spec.keywords] } : {}),
    },
    availability: spec.availability ?? 'available',
    valueShape: spec.valueShape,
    configSchema: structuredClone(spec.configSchema ?? {}),
    defaultConfig: structuredClone(spec.defaultConfig ?? {}),
    validateConfig: spec.validateConfig ?? validateEmptyConfig,
    createDefaultValue: spec.createDefaultValue ?? (() => null),
    validateValue: spec.validateValue,
    features: featureMatrix(spec.featureOverrides),
    migrations: [],
  };
}

const placeholderFeature = { placeholder: 'supported' as const };
const choiceFeatures = { options: 'supported' as const, placeholder: 'supported' as const };
const relationFeatures = { relations: 'modeled' as const };

export function createBuiltinFieldTypeDefinitions(): FieldTypeDefinition[] {
  return [
    makeBuiltinFieldType({ name: 'text', label: 'Text', category: 'text', icon: 'type', description: 'Single-line plain text.', valueShape: 'string', configSchema: { minLength: 'integer?', maxLength: 'integer?' }, validateConfig: validateStringConfig, validateValue: validateStringValue, featureOverrides: placeholderFeature }),
    makeBuiltinFieldType({ name: 'textarea', label: 'Textarea', category: 'text', icon: 'align-left', description: 'Multi-line plain text.', valueShape: 'string', configSchema: { minLength: 'integer?', maxLength: 'integer?' }, validateConfig: validateStringConfig, validateValue: validateStringValue, featureOverrides: placeholderFeature }),
    makeBuiltinFieldType({ name: 'rich-text', label: 'Rich text', category: 'text', icon: 'text-cursor-input', description: 'Portable rich text source stored as text until the rich-text engine is introduced.', valueShape: 'string', configSchema: { minLength: 'integer?', maxLength: 'integer?' }, validateConfig: validateStringConfig, validateValue: validateStringValue }),
    makeBuiltinFieldType({ name: 'number', label: 'Number', category: 'number', icon: 'hash', description: 'Finite numeric value with optional range and step.', valueShape: 'number', configSchema: { min: 'number?', max: 'number?', step: 'number?' }, validateConfig: validateNumberConfig, validateValue: validateNumberValue }),
    makeBuiltinFieldType({ name: 'currency', label: 'Currency', category: 'number', icon: 'circle-dollar-sign', description: 'Numeric money amount with an ISO-style currency code.', valueShape: 'number', configSchema: { min: 'number?', max: 'number?', step: 'number?', currency: 'string?' }, defaultConfig: { currency: 'USD' }, validateConfig: validateNumberConfig, validateValue: validateNumberValue }),
    ...[
      ['email', 'Email', 'mail', 'Email address.'],
      ['phone', 'Phone', 'phone', 'Telephone value stored as text.'],
      ['url', 'URL', 'link', 'URL value stored as text.'],
    ].map(([name, label, icon, description]) => makeBuiltinFieldType({ name: name!, label: label!, category: 'text', icon: icon!, description: description!, valueShape: 'string', configSchema: { minLength: 'integer?', maxLength: 'integer?' }, validateConfig: validateStringConfig, validateValue: validateStringValue, featureOverrides: placeholderFeature })),
    ...[
      ['date', 'Date', 'calendar-days', 'Calendar date stored as text.'],
      ['time', 'Time', 'clock-3', 'Time value stored as text.'],
      ['datetime', 'Date and time', 'calendar-clock', 'Combined date/time value stored as text.'],
      ['color', 'Color', 'palette', 'Color token/value stored as text.'],
    ].map(([name, label, icon, description]) => makeBuiltinFieldType({ name: name!, label: label!, category: name === 'color' ? 'text' : 'date-time', icon: icon!, description: description!, valueShape: 'string', validateValue: validateStringValue, featureOverrides: placeholderFeature })),
    ...[
      ['select', 'Select', 'list-filter', 'Single option selected from configured choices.'],
      ['radio', 'Radio', 'circle-dot', 'Single radio option selected from configured choices.'],
    ].map(([name, label, icon, description]) => makeBuiltinFieldType({ name: name!, label: label!, category: 'choice', icon: icon!, description: description!, valueShape: 'string', configSchema: { options: 'array<{label:string,value:string}>' }, defaultConfig: { options: [] }, validateConfig: validateChoiceConfig, validateValue: validateChoiceValue, featureOverrides: choiceFeatures })),
    makeBuiltinFieldType({ name: 'checkbox', label: 'Checkbox', category: 'choice', icon: 'square-check', description: 'Boolean checkbox value.', valueShape: 'boolean', validateValue: validateBooleanValue }),
    makeBuiltinFieldType({ name: 'switch', label: 'Switch', category: 'choice', icon: 'toggle-right', description: 'Boolean on/off value.', valueShape: 'boolean', validateValue: validateBooleanValue }),
    makeBuiltinFieldType({ name: 'image', label: 'Image', category: 'media', icon: 'image', description: 'Reference to one image asset.', valueShape: 'string', validateValue: validateStringReference }),
    makeBuiltinFieldType({ name: 'gallery', label: 'Gallery', category: 'media', icon: 'images', description: 'Ordered references to multiple image assets.', valueShape: 'array', validateValue: validateStringReferenceList }),
    makeBuiltinFieldType({ name: 'file', label: 'File', category: 'media', icon: 'file', description: 'Reference to one local media/file asset.', valueShape: 'string', validateValue: validateStringReference }),
    makeBuiltinFieldType({ name: 'map', label: 'Map', category: 'location', icon: 'map-pin', description: 'Portable latitude/longitude point.', valueShape: 'object', validateValue: validateMapValue }),
    makeBuiltinFieldType({ name: 'relation', label: 'Relation', category: 'reference', icon: 'git-branch', description: 'Modeled relation reference; behavior arrives with MF-043.', availability: 'modeled', valueShape: 'array', validateValue: validateStringReferenceList, featureOverrides: relationFeatures }),
    makeBuiltinFieldType({ name: 'user', label: 'User', category: 'reference', icon: 'user', description: 'Modeled user reference; record semantics arrive in later F05 work.', availability: 'modeled', valueShape: 'string', validateValue: validateStringReference, featureOverrides: relationFeatures }),
    makeBuiltinFieldType({ name: 'taxonomy', label: 'Taxonomy', category: 'reference', icon: 'tags', description: 'Modeled taxonomy-term references; term behavior is not implemented in MF-039.', availability: 'modeled', valueShape: 'array', validateValue: validateStringReferenceList, featureOverrides: relationFeatures }),
    makeBuiltinFieldType({ name: 'repeater', label: 'Repeater', category: 'structure', icon: 'repeat-2', description: 'Modeled repeated field rows; runtime behavior arrives in MF-042.', availability: 'modeled', valueShape: 'array', validateValue: validateArrayValue }),
    makeBuiltinFieldType({ name: 'group', label: 'Group', category: 'structure', icon: 'boxes', description: 'Modeled nested field group; runtime behavior arrives in MF-042.', availability: 'modeled', valueShape: 'object', validateValue: validateObjectValue }),
    makeBuiltinFieldType({ name: 'calculated', label: 'Calculated', category: 'computed', icon: 'calculator', description: 'Modeled calculated field; expression evaluation arrives in MF-042.', availability: 'modeled', valueShape: 'json', validateValue: validateJsonValue, featureOverrides: { defaultValue: 'unsupported' } }),
    makeBuiltinFieldType({ name: 'conditional', label: 'Conditional', category: 'computed', icon: 'split', description: 'Modeled conditional field wrapper; evaluation arrives in MF-042.', availability: 'modeled', valueShape: 'json', validateValue: validateJsonValue }),
  ];
}

export function createDefaultFieldTypeRegistry(): FieldTypeRegistry {
  const registry = new FieldTypeRegistry();
  for (const definition of createBuiltinFieldTypeDefinitions()) registry.register(definition);
  return registry;
}
