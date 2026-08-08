import { ValidationError, isJsonObject, isJsonValue, type JsonObject, type JsonValue } from '../domain';

export const INSPECTOR_FIELD_KINDS = ['text', 'number', 'boolean', 'select', 'json'] as const;
export type InspectorFieldKind = (typeof INSPECTOR_FIELD_KINDS)[number];

export interface InspectorSelectOption {
  label: string;
  value: string;
}

export interface InspectorFieldSchema {
  key: string;
  label: string;
  kind: InspectorFieldKind;
  description?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: readonly InspectorSelectOption[];
}

export interface InspectorSectionSchema {
  id: string;
  label: string;
  fields: readonly InspectorFieldSchema[];
}

export interface NormalizedInspectorSchema {
  sections: readonly InspectorSectionSchema[];
}

export interface InspectorValueParseResult {
  valid: boolean;
  value?: JsonValue;
  message?: string;
}

export class InspectorSchemaError extends ValidationError {
  constructor(message: string) {
    super(message);
  }
}

function humanizeKey(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .replace(/^./, (character) => character.toUpperCase());
}

function inferFieldKind(value: JsonValue | undefined): InspectorFieldKind {
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';
  if (Array.isArray(value) || isJsonObject(value)) return 'json';
  return 'text';
}

function optionalString(source: JsonObject, key: string): string | undefined {
  const value = source[key];
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function optionalNumber(source: JsonObject, key: string): number | undefined {
  const value = source[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function normalizeOptions(value: JsonValue | undefined): readonly InspectorSelectOption[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const options: InspectorSelectOption[] = [];
  for (const item of value) {
    if (typeof item === 'string') {
      options.push({ label: item, value: item });
      continue;
    }
    if (!isJsonObject(item) || typeof item.value !== 'string') continue;
    options.push({
      label: typeof item.label === 'string' ? item.label : item.value,
      value: item.value,
    });
  }
  return options.length > 0 ? options : undefined;
}

function normalizeField(field: JsonValue, props: JsonObject): InspectorFieldSchema | null {
  if (typeof field === 'string') {
    return {
      key: field,
      label: humanizeKey(field),
      kind: inferFieldKind(props[field]),
    };
  }
  if (!isJsonObject(field) || typeof field.key !== 'string' || !field.key.trim()) return null;

  const requestedKind = typeof field.type === 'string' ? field.type : undefined;
  const kind = INSPECTOR_FIELD_KINDS.includes(requestedKind as InspectorFieldKind)
    ? (requestedKind as InspectorFieldKind)
    : inferFieldKind(props[field.key]);
  const options = kind === 'select' ? normalizeOptions(field.options) : undefined;

  return {
    key: field.key,
    label: optionalString(field, 'label') ?? humanizeKey(field.key),
    kind,
    ...(optionalString(field, 'description') ? { description: optionalString(field, 'description')! } : {}),
    ...(optionalString(field, 'placeholder') ? { placeholder: optionalString(field, 'placeholder')! } : {}),
    ...(optionalNumber(field, 'min') === undefined ? {} : { min: optionalNumber(field, 'min')! }),
    ...(optionalNumber(field, 'max') === undefined ? {} : { max: optionalNumber(field, 'max')! }),
    ...(optionalNumber(field, 'step') === undefined ? {} : { step: optionalNumber(field, 'step')! }),
    ...(options ? { options } : {}),
  };
}

export function normalizeInspectorSchema(schema: JsonObject, props: JsonObject): NormalizedInspectorSchema {
  const rawSections = schema.sections;
  if (!Array.isArray(rawSections)) return { sections: [] };

  const sections: InspectorSectionSchema[] = [];
  for (const rawSection of rawSections) {
    if (!isJsonObject(rawSection)) continue;
    const rawFields = rawSection.fields;
    if (!Array.isArray(rawFields)) continue;
    const fields = rawFields
      .map((field) => normalizeField(field, props))
      .filter((field): field is InspectorFieldSchema => field !== null);
    if (fields.length === 0) continue;
    const id = optionalString(rawSection, 'id') ?? `section-${sections.length + 1}`;
    sections.push({
      id,
      label: optionalString(rawSection, 'label') ?? humanizeKey(id),
      fields,
    });
  }
  return { sections };
}

export function parseInspectorFieldValue(
  field: InspectorFieldSchema,
  rawValue: string | boolean,
): InspectorValueParseResult {
  if (field.kind === 'boolean') {
    if (typeof rawValue !== 'boolean') return { valid: false, message: 'Expected a boolean value.' };
    return { valid: true, value: rawValue };
  }
  if (typeof rawValue !== 'string') return { valid: false, message: 'Expected text input.' };

  if (field.kind === 'number') {
    const value = Number(rawValue);
    if (!Number.isFinite(value)) return { valid: false, message: 'Enter a valid number.' };
    if (field.min !== undefined && value < field.min) return { valid: false, message: `Minimum is ${field.min}.` };
    if (field.max !== undefined && value > field.max) return { valid: false, message: `Maximum is ${field.max}.` };
    return { valid: true, value };
  }

  if (field.kind === 'json') {
    try {
      const parsed: unknown = JSON.parse(rawValue);
      if (!isJsonValue(parsed)) return { valid: false, message: 'Value must be JSON-compatible.' };
      return { valid: true, value: parsed };
    } catch {
      return { valid: false, message: 'Enter valid JSON.' };
    }
  }

  if (field.kind === 'select' && field.options?.length) {
    if (!field.options.some((option) => option.value === rawValue)) {
      return { valid: false, message: 'Choose one of the available values.' };
    }
  }

  return { valid: true, value: rawValue };
}

export function formatInspectorFieldValue(field: InspectorFieldSchema, value: JsonValue | undefined): string {
  if (field.kind === 'json') return JSON.stringify(value ?? null, null, 2);
  if (value === null || value === undefined) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  return JSON.stringify(value);
}
