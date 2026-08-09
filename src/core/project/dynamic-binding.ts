import { isJsonObject, isJsonValue, type JsonObject, type JsonValue } from '../domain';
import type { CanonicalProject, DocumentNode, DynamicBinding, DynamicBindingKind } from './project-model';

export const DYNAMIC_BINDING_KINDS = ['text', 'image', 'link', 'listing'] as const satisfies readonly DynamicBindingKind[];
export const DYNAMIC_BINDING_SOURCE_PREFIXES = ['record', 'records'] as const;

export type DynamicBindingState = 'resolved' | 'fallback' | 'error';

export interface DynamicBindingIssue {
  code: string;
  path: string;
  message: string;
}

export type DynamicBindingValidationResult =
  | { ok: true; value: DynamicBinding }
  | { ok: false; issues: readonly DynamicBindingIssue[] };

export interface DynamicBindingResolution {
  binding: DynamicBinding;
  state: DynamicBindingState;
  value?: JsonValue;
  message?: string;
}

export interface ResolvedDocumentNodeBindings {
  node: DocumentNode;
  resolutions: readonly DynamicBindingResolution[];
  state: DynamicBindingState | 'none';
}

interface ParsedRecordSource {
  kind: 'record';
  recordId: string;
  path: string;
}

interface ParsedRecordsSource {
  kind: 'records';
  contentTypeId: string;
  itemPath: string;
}

type ParsedBindingSource = ParsedRecordSource | ParsedRecordsSource;

function nonEmpty(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function isBindingKind(value: unknown): value is DynamicBindingKind {
  return typeof value === 'string' && DYNAMIC_BINDING_KINDS.includes(value as DynamicBindingKind);
}

export function createDynamicBinding(input: {
  target: string;
  kind: DynamicBindingKind;
  source: string;
  fallback?: JsonValue;
}): DynamicBinding {
  return {
    target: input.target.trim(),
    kind: input.kind,
    source: input.source.trim(),
    ...(input.fallback === undefined ? {} : { fallback: structuredClone(input.fallback) }),
  };
}

export function validateDynamicBinding(input: unknown): DynamicBindingValidationResult {
  if (!isJsonObject(input)) {
    return { ok: false, issues: [{ code: 'INVALID_BINDING', path: '$', message: 'Binding must be a portable JSON object.' }] };
  }

  const issues: DynamicBindingIssue[] = [];
  const source = nonEmpty(input.source);
  const target = nonEmpty(input.target);
  const kind = input.kind;

  if (!source) issues.push({ code: 'INVALID_SOURCE', path: 'source', message: 'Binding source is required.' });
  if (!target) issues.push({ code: 'INVALID_TARGET', path: 'target', message: 'Binding target property is required.' });
  if (!isBindingKind(kind)) issues.push({ code: 'INVALID_KIND', path: 'kind', message: 'Binding kind must be text, image, link or listing.' });
  if (input.fallback !== undefined && !isJsonValue(input.fallback)) {
    issues.push({ code: 'INVALID_FALLBACK', path: 'fallback', message: 'Binding fallback must be portable JSON.' });
  }

  if (issues.length > 0 || !isBindingKind(kind)) return { ok: false, issues };
  return {
    ok: true,
    value: {
      target,
      kind,
      source,
      ...(input.fallback === undefined ? {} : { fallback: structuredClone(input.fallback as JsonValue) }),
    },
  };
}

export function validateDynamicBindings(input: unknown): { ok: true; value: DynamicBinding[] } | { ok: false; issues: readonly DynamicBindingIssue[] } {
  if (!Array.isArray(input)) {
    return { ok: false, issues: [{ code: 'INVALID_BINDINGS', path: '$', message: 'Bindings must be an array.' }] };
  }
  const bindings: DynamicBinding[] = [];
  const issues: DynamicBindingIssue[] = [];
  const targets = new Set<string>();
  input.forEach((candidate, index) => {
    const validation = validateDynamicBinding(candidate);
    if (!validation.ok) {
      validation.issues.forEach((issue) => issues.push({ ...issue, path: `${index}.${issue.path}` }));
      return;
    }
    if (targets.has(validation.value.target)) {
      issues.push({ code: 'DUPLICATE_TARGET', path: `${index}.target`, message: `Only one dynamic binding may target ${validation.value.target}.` });
      return;
    }
    targets.add(validation.value.target);
    bindings.push(validation.value);
  });
  return issues.length > 0 ? { ok: false, issues } : { ok: true, value: bindings };
}

export function createRecordBindingSource(recordId: string, path: string): string {
  return `record:${recordId.trim()}:${path.trim()}`;
}

export function createRecordsBindingSource(contentTypeId: string, itemPath = 'title'): string {
  return `records:${contentTypeId.trim()}:${itemPath.trim()}`;
}

export function parseDynamicBindingSource(source: string): ParsedBindingSource | null {
  const first = source.indexOf(':');
  const second = source.indexOf(':', first + 1);
  if (first <= 0 || second <= first + 1) return null;
  const prefix = source.slice(0, first);
  const id = source.slice(first + 1, second).trim();
  const path = source.slice(second + 1).trim();
  if (!id || !path) return null;
  if (prefix === 'record') return { kind: 'record', recordId: id, path };
  if (prefix === 'records') return { kind: 'records', contentTypeId: id, itemPath: path };
  return null;
}

function readPath(value: JsonValue, path: string): JsonValue | undefined {
  const segments = path.split('.').map((segment) => segment.trim()).filter(Boolean);
  let current: JsonValue | undefined = value;
  for (const segment of segments) {
    if (!isJsonObject(current)) return undefined;
    const next = current[segment];
    if (!isJsonValue(next)) return undefined;
    current = next;
  }
  return current;
}

function textValue(value: JsonValue): string | null {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return null;
}

function normalizeBoundValue(kind: DynamicBindingKind, value: JsonValue): JsonValue | null {
  if (kind === 'text') return textValue(value);
  if (kind === 'image' || kind === 'link') return typeof value === 'string' ? value : null;
  if (kind === 'listing') return Array.isArray(value) ? structuredClone(value) : null;
  return null;
}

function rawRecord(project: CanonicalProject, recordId: string): JsonObject | null {
  const value = project.records[recordId];
  return value && isJsonObject(value) ? value : null;
}

function resolveSource(project: CanonicalProject, source: ParsedBindingSource, kind: DynamicBindingKind): JsonValue | undefined {
  if (source.kind === 'record') {
    const record = rawRecord(project, source.recordId);
    return record ? readPath(record, source.path) : undefined;
  }

  if (kind !== 'listing') return undefined;
  const values: JsonValue[] = [];
  Object.entries(project.records)
    .filter(([, candidate]) => isJsonObject(candidate) && candidate.contentTypeId === source.contentTypeId)
    .sort(([leftId], [rightId]) => leftId.localeCompare(rightId))
    .forEach(([, candidate]) => {
      if (!isJsonObject(candidate)) return;
      const value = readPath(candidate, source.itemPath);
      if (value === undefined) return;
      const display = textValue(value);
      if (display !== null) values.push(display);
      else if (isJsonValue(value)) values.push(structuredClone(value));
    });
  return values;
}

function fallbackResolution(binding: DynamicBinding, message: string): DynamicBindingResolution {
  if (binding.fallback !== undefined && isJsonValue(binding.fallback)) {
    const normalized = normalizeBoundValue(binding.kind as DynamicBindingKind, binding.fallback);
    if (normalized !== null) return { binding, state: 'fallback', value: normalized, message };
  }
  return { binding, state: 'error', message };
}

export function resolveDynamicBinding(project: CanonicalProject, input: DynamicBinding): DynamicBindingResolution {
  const validation = validateDynamicBinding(input);
  if (!validation.ok) {
    return { binding: input, state: 'error', message: validation.issues.map((issue) => issue.message).join(' ') };
  }
  const binding = validation.value;
  const source = parseDynamicBindingSource(binding.source);
  if (!source) return fallbackResolution(binding, `Unsupported binding source ${binding.source}.`);
  if (binding.kind === 'listing' && source.kind !== 'records' && source.kind !== 'record') {
    return fallbackResolution(binding, 'Listing bindings require a record array or records source.');
  }
  const raw = resolveSource(project, source, binding.kind);
  if (raw === undefined) return fallbackResolution(binding, `Binding source ${binding.source} did not resolve.`);
  const normalized = normalizeBoundValue(binding.kind, raw);
  if (normalized === null) return fallbackResolution(binding, `Binding source ${binding.source} has an incompatible value for ${binding.kind}.`);
  return { binding, state: 'resolved', value: normalized };
}

export function resolveDocumentNodeBindings(project: CanonicalProject, node: DocumentNode): ResolvedDocumentNodeBindings {
  const bindings = node.bindings ?? [];
  if (bindings.length === 0) return { node, resolutions: [], state: 'none' };

  const props: JsonObject = structuredClone(node.props);
  const resolutions = bindings.map((binding) => resolveDynamicBinding(project, binding));
  resolutions.forEach((resolution) => {
    if (resolution.value !== undefined && resolution.binding.target) {
      props[resolution.binding.target] = structuredClone(resolution.value);
    }
  });

  const state: DynamicBindingState = resolutions.some((resolution) => resolution.state === 'error')
    ? 'error'
    : resolutions.some((resolution) => resolution.state === 'fallback')
      ? 'fallback'
      : 'resolved';
  return {
    node: { ...node, props },
    resolutions,
    state,
  };
}

function collectLeafPaths(value: JsonValue, prefix: string, output: Set<string>, depth: number): void {
  if (depth > 8) return;
  if (isJsonObject(value)) {
    Object.entries(value).forEach(([key, child]) => {
      if (!isJsonValue(child)) return;
      collectLeafPaths(child, prefix ? `${prefix}.${key}` : key, output, depth + 1);
    });
    return;
  }
  if (Array.isArray(value)) return;
  if (prefix) output.add(prefix);
}

export function listBindableRecordPaths(project: CanonicalProject, recordId: string): string[] {
  const record = rawRecord(project, recordId);
  if (!record) return [];
  const paths = new Set<string>();
  collectLeafPaths(record, '', paths, 0);
  return [...paths]
    .filter((path) => !['version', 'id', 'contentTypeId', 'status', 'createdAt', 'updatedAt'].includes(path))
    .sort((left, right) => left.localeCompare(right));
}
