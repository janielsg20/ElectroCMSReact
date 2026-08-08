import type { JsonObject, JsonValue } from '../domain';

export const FIELD_TYPE_CATEGORIES = [
  'text',
  'number',
  'choice',
  'date-time',
  'media',
  'location',
  'reference',
  'structure',
  'computed',
] as const;

export type FieldTypeCategory = (typeof FIELD_TYPE_CATEGORIES)[number];

export const FIELD_TYPE_FEATURES = [
  'defaultValue',
  'placeholder',
  'description',
  'validation',
  'required',
  'options',
  'conditions',
  'repetition',
  'relations',
  'roleVisibility',
] as const;

export type FieldTypeFeature = (typeof FIELD_TYPE_FEATURES)[number];
export type FieldTypeFeatureStatus = 'supported' | 'modeled' | 'unsupported';
export type FieldTypeAvailability = 'available' | 'modeled';
export type FieldValueShape = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'json';

export interface FieldTypeMetadata {
  label: string;
  category: FieldTypeCategory;
  icon: string;
  description: string;
  keywords?: readonly string[];
}

export interface FieldTypeValidationIssue {
  code: string;
  path: string;
  message: string;
}

export interface FieldTypeValidationResult {
  valid: boolean;
  issues: readonly FieldTypeValidationIssue[];
}

export type FieldTypeConfigValidator = (config: JsonObject) => FieldTypeValidationResult;
export type FieldTypeValueValidator = (
  value: JsonValue,
  config: JsonObject,
) => FieldTypeValidationResult;
export type FieldTypeDefaultValueFactory = (config: JsonObject) => JsonValue;

export interface FieldTypeMigrationHook {
  fromVersion: number;
  toVersion: number;
  migrate(config: JsonObject): JsonObject;
}

export interface FieldTypeDefinition {
  type: string;
  version: number;
  metadata: FieldTypeMetadata;
  availability: FieldTypeAvailability;
  valueShape: FieldValueShape;
  configSchema: JsonObject;
  defaultConfig: JsonObject;
  validateConfig: FieldTypeConfigValidator;
  createDefaultValue: FieldTypeDefaultValueFactory;
  validateValue: FieldTypeValueValidator;
  features: Readonly<Record<FieldTypeFeature, FieldTypeFeatureStatus>>;
  migrations: readonly FieldTypeMigrationHook[];
}

export function validFieldTypeValue(): FieldTypeValidationResult {
  return { valid: true, issues: [] };
}

export function invalidFieldTypeValue(
  code: string,
  path: string,
  message: string,
): FieldTypeValidationResult {
  return { valid: false, issues: [{ code, path, message }] };
}
