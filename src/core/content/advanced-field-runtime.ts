import { isJsonObject, isJsonValue, type JsonObject, type JsonValue } from '../domain';
import type { CustomFieldDefinition, FieldGroupDefinition } from './field-group';
import type { FieldTypeValidationIssue } from './field-type-definition';
import { FieldTypeRegistry } from './field-type-registry';

export const MF042_ADVANCED_FIELD_TYPES = [
  'core/repeater',
  'core/group',
  'core/calculated',
  'core/conditional',
] as const;

export type Mf042AdvancedFieldType = (typeof MF042_ADVANCED_FIELD_TYPES)[number];

export const CONDITIONAL_OPERATORS = [
  'equals',
  'notEquals',
  'truthy',
  'falsy',
  'greaterThan',
  'lessThan',
] as const;

export type ConditionalOperator = (typeof CONDITIONAL_OPERATORS)[number];

export interface AdvancedFieldRuntimeIssue extends FieldTypeValidationIssue {
  path: string;
}

export interface AdvancedFieldRuntimeContext {
  registry: FieldTypeRegistry;
  resolveGroup(id: string): FieldGroupDefinition | null;
  currentValues?: JsonObject;
  depth?: number;
}

export const MAX_ADVANCED_FIELD_DEPTH = 8;
export const MAX_REPEATER_ITEMS = 100;
export const MAX_CALC_EXPRESSION_LENGTH = 240;

function issue(code: string, path: string, message: string): AdvancedFieldRuntimeIssue {
  return { code, path, message };
}

function requiredValueMissing(value: JsonValue): boolean {
  if (value === null) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

export function advancedFieldGroupReference(field: CustomFieldDefinition): string | null {
  if (field.type !== 'core/group' && field.type !== 'core/repeater' && field.type !== 'core/conditional') {
    return null;
  }
  return typeof field.config.fieldGroupId === 'string' && field.config.fieldGroupId.trim()
    ? field.config.fieldGroupId.trim()
    : null;
}

export function validateAdvancedFieldConfig(field: CustomFieldDefinition): AdvancedFieldRuntimeIssue[] {
  const issues: AdvancedFieldRuntimeIssue[] = [];
  if (!MF042_ADVANCED_FIELD_TYPES.includes(field.type as Mf042AdvancedFieldType)) return issues;

  if (field.type === 'core/group') {
    const fieldGroupId = advancedFieldGroupReference(field);
    if (!fieldGroupId) issues.push(issue('INVALID_GROUP_REFERENCE', 'config.fieldGroupId', 'Group requires a referenced Field Group id.'));
    return issues;
  }

  if (field.type === 'core/repeater') {
    const fieldGroupId = advancedFieldGroupReference(field);
    if (!fieldGroupId) issues.push(issue('INVALID_GROUP_REFERENCE', 'config.fieldGroupId', 'Repeater requires a referenced Field Group id.'));
    const minItems = field.config.minItems;
    const maxItems = field.config.maxItems;
    if (minItems !== undefined && (!Number.isInteger(minItems) || Number(minItems) < 0)) {
      issues.push(issue('INVALID_MIN_ITEMS', 'config.minItems', 'minItems must be a non-negative integer.'));
    }
    if (maxItems !== undefined && (!Number.isInteger(maxItems) || Number(maxItems) < 1)) {
      issues.push(issue('INVALID_MAX_ITEMS', 'config.maxItems', 'maxItems must be a positive integer.'));
    }
    if (typeof maxItems === 'number' && maxItems > MAX_REPEATER_ITEMS) {
      issues.push(issue('REPEATER_LIMIT_EXCEEDED', 'config.maxItems', `maxItems cannot exceed ${MAX_REPEATER_ITEMS}.`));
    }
    if (typeof minItems === 'number' && minItems > MAX_REPEATER_ITEMS) {
      issues.push(issue('REPEATER_LIMIT_EXCEEDED', 'config.minItems', `minItems cannot exceed ${MAX_REPEATER_ITEMS}.`));
    }
    if (typeof minItems === 'number' && typeof maxItems === 'number' && minItems > maxItems) {
      issues.push(issue('INVALID_ITEM_RANGE', 'config', 'minItems cannot exceed maxItems.'));
    }
    return issues;
  }

  if (field.type === 'core/calculated') {
    const expression = typeof field.config.expression === 'string' ? field.config.expression.trim() : '';
    if (!expression || expression.length > MAX_CALC_EXPRESSION_LENGTH) {
      issues.push(issue('INVALID_EXPRESSION', 'config.expression', `Calculated expression is required and must be at most ${MAX_CALC_EXPRESSION_LENGTH} characters.`));
    } else {
      const syntax = validateCalculationExpression(expression);
      if (!syntax.ok) issues.push(issue('INVALID_EXPRESSION', 'config.expression', syntax.message));
    }
    return issues;
  }

  const fieldGroupId = advancedFieldGroupReference(field);
  if (!fieldGroupId) issues.push(issue('INVALID_GROUP_REFERENCE', 'config.fieldGroupId', 'Conditional requires a referenced Field Group id.'));
  const sourceField = typeof field.config.sourceField === 'string' ? field.config.sourceField.trim() : '';
  if (!sourceField) issues.push(issue('INVALID_SOURCE_FIELD', 'config.sourceField', 'Conditional requires a source field storage name.'));
  if (!CONDITIONAL_OPERATORS.includes(field.config.operator as ConditionalOperator)) {
    issues.push(issue('INVALID_CONDITION_OPERATOR', 'config.operator', 'Conditional operator is not supported.'));
  }
  return issues;
}

export function createAdvancedFieldDefaultValue(
  field: CustomFieldDefinition,
  context: AdvancedFieldRuntimeContext,
): JsonValue {
  if (field.type === 'core/repeater') return [];
  if (field.type === 'core/group') {
    const groupId = advancedFieldGroupReference(field);
    const group = groupId ? context.resolveGroup(groupId) : null;
    return group ? createGroupDefaultValue(group, context) : {};
  }
  if (field.type === 'core/calculated') {
    const result = evaluateCalculatedField(field, context.currentValues ?? {});
    return result.ok ? result.value : null;
  }
  if (field.type === 'core/conditional') {
    if (!evaluateConditionalField(field, context.currentValues ?? {})) return null;
    const groupId = advancedFieldGroupReference(field);
    const group = groupId ? context.resolveGroup(groupId) : null;
    return group ? createGroupDefaultValue(group, context) : {};
  }
  return structuredClone(field.defaultValue);
}

export function normalizeAdvancedFieldValue(
  field: CustomFieldDefinition,
  value: JsonValue,
  context: AdvancedFieldRuntimeContext,
): JsonValue {
  if (field.type === 'core/calculated') {
    const result = evaluateCalculatedField(field, context.currentValues ?? {});
    return result.ok ? result.value : null;
  }
  if (field.type === 'core/conditional' && !evaluateConditionalField(field, context.currentValues ?? {})) {
    return null;
  }
  if ((field.type === 'core/group' || field.type === 'core/conditional') && value === null) {
    return createAdvancedFieldDefaultValue(field, context);
  }
  return structuredClone(value);
}

export function validateAdvancedFieldValue(
  field: CustomFieldDefinition,
  value: JsonValue,
  context: AdvancedFieldRuntimeContext,
): AdvancedFieldRuntimeIssue[] {
  const depth = context.depth ?? 0;
  if (depth > MAX_ADVANCED_FIELD_DEPTH) {
    return [issue('ADVANCED_FIELD_DEPTH', '$', `Advanced field nesting exceeds ${MAX_ADVANCED_FIELD_DEPTH} levels.`)];
  }

  if (field.type === 'core/calculated') {
    const result = evaluateCalculatedField(field, context.currentValues ?? {});
    if (!result.ok) return [issue('CALCULATION_FAILED', '$', result.message)];
    if (value !== result.value) return [issue('STALE_CALCULATED_VALUE', '$', 'Calculated value does not match the current expression inputs.')];
    return [];
  }

  if (field.type === 'core/conditional') {
    const active = evaluateConditionalField(field, context.currentValues ?? {});
    if (!active) return value === null ? [] : [issue('INACTIVE_CONDITIONAL_VALUE', '$', 'Conditional value must be null while its condition is false.')];
    return validateNestedGroupValue(field, value, context);
  }

  if (field.type === 'core/group') return validateNestedGroupValue(field, value, context);

  if (field.type === 'core/repeater') {
    if (!Array.isArray(value)) return [issue('INVALID_REPEATER', '$', 'Repeater value must be an array.')];
    const minItems = typeof field.config.minItems === 'number' ? field.config.minItems : 0;
    const configuredMax = typeof field.config.maxItems === 'number' ? field.config.maxItems : MAX_REPEATER_ITEMS;
    const maxItems = Math.min(configuredMax, MAX_REPEATER_ITEMS);
    const issues: AdvancedFieldRuntimeIssue[] = [];
    if (value.length < minItems) issues.push(issue('REPEATER_TOO_SHORT', '$', `Repeater requires at least ${minItems} items.`));
    if (value.length > maxItems) issues.push(issue('REPEATER_TOO_LONG', '$', `Repeater allows at most ${maxItems} items.`));
    const groupId = advancedFieldGroupReference(field);
    const group = groupId ? context.resolveGroup(groupId) : null;
    if (!group) return [...issues, issue('UNKNOWN_GROUP_REFERENCE', '$', `Referenced Field Group ${groupId ?? '(empty)'} does not exist.`)];
    value.slice(0, MAX_REPEATER_ITEMS).forEach((item, index) => {
      if (!isJsonObject(item)) {
        issues.push(issue('INVALID_REPEATER_ITEM', `${index}`, 'Repeater item must be an object.'));
        return;
      }
      issues.push(...validateGroupObject(group, item, { ...context, currentValues: item, depth: depth + 1 }).map((nested) => ({ ...nested, path: `${index}${nested.path === '$' ? '' : `.${nested.path}`}` })));
    });
    return issues;
  }

  return [];
}

function validateNestedGroupValue(
  field: CustomFieldDefinition,
  value: JsonValue,
  context: AdvancedFieldRuntimeContext,
): AdvancedFieldRuntimeIssue[] {
  if (!isJsonObject(value)) return [issue('INVALID_GROUP_VALUE', '$', 'Group value must be an object.')];
  const groupId = advancedFieldGroupReference(field);
  const group = groupId ? context.resolveGroup(groupId) : null;
  if (!group) return [issue('UNKNOWN_GROUP_REFERENCE', '$', `Referenced Field Group ${groupId ?? '(empty)'} does not exist.`)];
  return validateGroupObject(group, value, { ...context, currentValues: value, depth: (context.depth ?? 0) + 1 });
}

export function createGroupDefaultValue(
  group: FieldGroupDefinition,
  context: AdvancedFieldRuntimeContext,
): JsonObject {
  const values: JsonObject = {};
  for (const field of group.fields) {
    const value = MF042_ADVANCED_FIELD_TYPES.includes(field.type as Mf042AdvancedFieldType)
      ? createAdvancedFieldDefaultValue(field, { ...context, currentValues: values, depth: (context.depth ?? 0) + 1 })
      : structuredClone(field.defaultValue);
    values[field.name] = value;
  }
  for (const field of group.fields) {
    if (field.type === 'core/calculated') {
      values[field.name] = createAdvancedFieldDefaultValue(field, { ...context, currentValues: values, depth: (context.depth ?? 0) + 1 });
    }
  }
  return values;
}

export function validateGroupObject(
  group: FieldGroupDefinition,
  value: JsonObject,
  context: AdvancedFieldRuntimeContext,
): AdvancedFieldRuntimeIssue[] {
  const issues: AdvancedFieldRuntimeIssue[] = [];
  const known = new Set(group.fields.map((field) => field.name));
  for (const key of Object.keys(value)) {
    if (!known.has(key)) issues.push(issue('UNKNOWN_NESTED_FIELD', key, `Field ${key} is not defined by ${group.label}.`));
  }

  const normalizedContext: JsonObject = { ...value };
  for (const field of group.fields) {
    const existingValue = value[field.name];
    let candidate: JsonValue = existingValue === undefined
      ? structuredClone(field.defaultValue)
      : existingValue;
    if (!isJsonValue(candidate)) {
      issues.push(issue('INVALID_NESTED_VALUE', field.name, `${field.label} must be portable JSON.`));
      continue;
    }
    if (MF042_ADVANCED_FIELD_TYPES.includes(field.type as Mf042AdvancedFieldType)) {
      candidate = normalizeAdvancedFieldValue(field, candidate, { ...context, currentValues: normalizedContext });
    }
    normalizedContext[field.name] = candidate;
  }

  for (const field of group.fields) {
    const candidate = normalizedContext[field.name];
    if (candidate === undefined) continue;
    if (field.required && requiredValueMissing(candidate)) {
      issues.push(issue('REQUIRED_NESTED_FIELD', field.name, `${field.label} is required.`));
    }
    if (MF042_ADVANCED_FIELD_TYPES.includes(field.type as Mf042AdvancedFieldType)) {
      issues.push(...validateAdvancedFieldValue(field, candidate, { ...context, currentValues: normalizedContext }).map((nested) => ({ ...nested, path: `${field.name}${nested.path === '$' ? '' : `.${nested.path}`}` })));
      continue;
    }
    try {
      const validation = context.registry.validateValue(field.type, candidate, field.config, field.typeVersion);
      issues.push(...validation.issues.map((nested) => issue(nested.code, `${field.name}${nested.path === '$' ? '' : `.${nested.path}`}`, nested.message)));
    } catch (error) {
      issues.push(issue('NESTED_FIELD_VALIDATION', field.name, error instanceof Error ? error.message : `Cannot validate ${field.label}.`));
    }
  }
  return issues;
}

export function evaluateConditionalField(field: CustomFieldDefinition, values: JsonObject): boolean {
  const sourceField = typeof field.config.sourceField === 'string' ? field.config.sourceField : '';
  const operator = field.config.operator as ConditionalOperator;
  const source = values[sourceField];
  const expected = field.config.compareValue as JsonValue | undefined;
  if (operator === 'truthy') return Boolean(source);
  if (operator === 'falsy') return !source;
  if (operator === 'equals') return JSON.stringify(source) === JSON.stringify(expected);
  if (operator === 'notEquals') return JSON.stringify(source) !== JSON.stringify(expected);
  if (operator === 'greaterThan') return typeof source === 'number' && typeof expected === 'number' && source > expected;
  if (operator === 'lessThan') return typeof source === 'number' && typeof expected === 'number' && source < expected;
  return false;
}

type CalculationResult = { ok: true; value: number } | { ok: false; message: string };

type CalcToken =
  | { kind: 'number'; value: number }
  | { kind: 'identifier'; value: string }
  | { kind: 'operator'; value: '+' | '-' | '*' | '/' }
  | { kind: 'lparen' }
  | { kind: 'rparen' };

function tokenizeCalculation(expression: string): CalcToken[] | null {
  const tokens: CalcToken[] = [];
  let index = 0;
  while (index < expression.length) {
    const char = expression[index]!;
    if (/\s/.test(char)) { index += 1; continue; }
    if ('+-*/'.includes(char)) {
      tokens.push({ kind: 'operator', value: char as '+' | '-' | '*' | '/' });
      index += 1;
      continue;
    }
    if (char === '(') { tokens.push({ kind: 'lparen' }); index += 1; continue; }
    if (char === ')') { tokens.push({ kind: 'rparen' }); index += 1; continue; }
    const number = expression.slice(index).match(/^(?:\d+(?:\.\d+)?|\.\d+)/);
    if (number) {
      tokens.push({ kind: 'number', value: Number(number[0]) });
      index += number[0].length;
      continue;
    }
    const identifier = expression.slice(index).match(/^[A-Za-z_][A-Za-z0-9_]*/);
    if (identifier) {
      tokens.push({ kind: 'identifier', value: identifier[0] });
      index += identifier[0].length;
      continue;
    }
    return null;
  }
  return tokens;
}

function parseCalculation(tokens: readonly CalcToken[], values: JsonObject): CalculationResult {
  let index = 0;
  const primary = (): CalculationResult => {
    const token = tokens[index];
    if (!token) return { ok: false, message: 'Expression ended unexpectedly.' };
    if (token.kind === 'number') { index += 1; return { ok: true, value: token.value }; }
    if (token.kind === 'identifier') {
      index += 1;
      const value = values[token.value];
      return typeof value === 'number' && Number.isFinite(value)
        ? { ok: true, value }
        : { ok: false, message: `Field ${token.value} must contain a finite number.` };
    }
    if (token.kind === 'operator' && token.value === '-') {
      index += 1;
      const next = primary();
      return next.ok ? { ok: true, value: -next.value } : next;
    }
    if (token.kind === 'lparen') {
      index += 1;
      const nested = expressionParser();
      if (!nested.ok) return nested;
      if (tokens[index]?.kind !== 'rparen') return { ok: false, message: 'Missing closing parenthesis.' };
      index += 1;
      return nested;
    }
    return { ok: false, message: 'Unexpected token in expression.' };
  };
  const term = (): CalculationResult => {
    let left = primary();
    if (!left.ok) return left;
    while (tokens[index]?.kind === 'operator' && (tokens[index] as { kind: 'operator'; value: string }).value.match(/[*/]/)) {
      const operator = (tokens[index] as { kind: 'operator'; value: '*' | '/' }).value;
      index += 1;
      const right = primary();
      if (!right.ok) return right;
      if (operator === '/' && right.value === 0) return { ok: false, message: 'Division by zero is not allowed.' };
      left = { ok: true, value: operator === '*' ? left.value * right.value : left.value / right.value };
    }
    return left;
  };
  const expressionParser = (): CalculationResult => {
    let left = term();
    if (!left.ok) return left;
    while (tokens[index]?.kind === 'operator' && (tokens[index] as { kind: 'operator'; value: string }).value.match(/[+-]/)) {
      const operator = (tokens[index] as { kind: 'operator'; value: '+' | '-' }).value;
      index += 1;
      const right = term();
      if (!right.ok) return right;
      left = { ok: true, value: operator === '+' ? left.value + right.value : left.value - right.value };
    }
    return left;
  };
  const result = expressionParser();
  if (!result.ok) return result;
  if (index !== tokens.length) return { ok: false, message: 'Unexpected trailing token in expression.' };
  return Number.isFinite(result.value) ? result : { ok: false, message: 'Calculation must produce a finite number.' };
}

export function validateCalculationExpression(expression: string): { ok: true } | { ok: false; message: string } {
  const tokens = tokenizeCalculation(expression);
  if (!tokens || tokens.length === 0) return { ok: false, message: 'Expression contains unsupported syntax.' };
  const placeholderValues: JsonObject = {};
  for (const token of tokens) if (token.kind === 'identifier') placeholderValues[token.value] = 1;
  const result = parseCalculation(tokens, placeholderValues);
  return result.ok ? { ok: true } : { ok: false, message: result.message };
}

export function evaluateCalculatedField(field: CustomFieldDefinition, values: JsonObject): CalculationResult {
  const expression = typeof field.config.expression === 'string' ? field.config.expression.trim() : '';
  if (!expression) return { ok: false, message: 'Calculated field has no expression.' };
  const tokens = tokenizeCalculation(expression);
  if (!tokens || tokens.length === 0) return { ok: false, message: 'Calculated expression contains unsupported syntax.' };
  return parseCalculation(tokens, values);
}
