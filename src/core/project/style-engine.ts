import { ValidationError, isJsonValue, type JsonValue } from '../domain';
import { updateDocumentNode } from './document-tree';
import type {
  CanonicalDocument,
  DocumentNode,
  ResponsiveSlot,
  ResponsiveStyleSet,
  ResponsiveValue,
} from './project-model';

export interface ResolvedResponsiveStyle {
  key: string;
  breakpointId: string;
  sourceBreakpointId: string;
  value: JsonValue;
}

export class ResponsiveStyleError extends ValidationError {
  constructor(message: string) {
    super(message);
  }
}

function resolveSlot(
  responsive: ResponsiveValue<JsonValue> | undefined,
  key: string,
  breakpointId: string,
  seen: Set<string>,
): ResolvedResponsiveStyle | null {
  const slot: ResponsiveSlot<JsonValue> | undefined = responsive?.[breakpointId];
  if (!slot || slot.state === 'unset') return null;
  if (slot.state === 'explicit') {
    return {
      key,
      breakpointId,
      sourceBreakpointId: breakpointId,
      value: structuredClone(slot.value),
    };
  }

  if (seen.has(slot.fromBreakpointId)) {
    throw new ResponsiveStyleError(`Responsive style inheritance cycle for "${key}" at "${breakpointId}".`);
  }
  seen.add(slot.fromBreakpointId);
  const resolved = resolveSlot(responsive, key, slot.fromBreakpointId, seen);
  return resolved
    ? {
        ...resolved,
        breakpointId,
      }
    : null;
}

export function resolveResponsiveStyle(
  styles: ResponsiveStyleSet,
  key: string,
  breakpointId: string,
): ResolvedResponsiveStyle | null {
  return resolveSlot(styles[key], key, breakpointId, new Set([breakpointId]));
}

export function resolveResponsiveStyleValue(
  styles: ResponsiveStyleSet,
  key: string,
  breakpointId: string,
): JsonValue | undefined {
  return resolveResponsiveStyle(styles, key, breakpointId)?.value;
}

export function resolveNodeStyleValues(
  node: DocumentNode,
  breakpointId: string,
): Readonly<Record<string, JsonValue>> {
  const resolved: Record<string, JsonValue> = {};
  for (const key of Object.keys(node.styles).sort((left, right) => left.localeCompare(right))) {
    const value = resolveResponsiveStyleValue(node.styles, key, breakpointId);
    if (value !== undefined) resolved[key] = value;
  }
  return resolved;
}

function withSlot(
  styles: ResponsiveStyleSet,
  key: string,
  breakpointId: string,
  slot: ResponsiveSlot<JsonValue>,
): ResponsiveStyleSet {
  return {
    ...styles,
    [key]: {
      ...(styles[key] ?? {}),
      [breakpointId]: slot,
    },
  };
}

export function setResponsiveStyleValue(
  styles: ResponsiveStyleSet,
  key: string,
  breakpointId: string,
  value: JsonValue,
): ResponsiveStyleSet {
  if (!key.trim()) throw new ResponsiveStyleError('Responsive style key cannot be empty.');
  if (!breakpointId.trim()) throw new ResponsiveStyleError('Breakpoint id cannot be empty.');
  if (!isJsonValue(value)) throw new ResponsiveStyleError(`Style "${key}" must be JSON-compatible.`);
  return withSlot(styles, key, breakpointId, {
    state: 'explicit',
    value: structuredClone(value),
  });
}

export function inheritResponsiveStyleValue(
  styles: ResponsiveStyleSet,
  key: string,
  breakpointId: string,
  fromBreakpointId: string,
): ResponsiveStyleSet {
  if (!key.trim()) throw new ResponsiveStyleError('Responsive style key cannot be empty.');
  if (!breakpointId.trim() || !fromBreakpointId.trim()) {
    throw new ResponsiveStyleError('Breakpoint ids cannot be empty.');
  }
  if (breakpointId === fromBreakpointId) {
    throw new ResponsiveStyleError('A responsive style cannot inherit from the same breakpoint.');
  }
  const candidate = withSlot(styles, key, breakpointId, {
    state: 'inherited',
    fromBreakpointId,
  });
  resolveResponsiveStyle(candidate, key, breakpointId);
  return candidate;
}

export function unsetResponsiveStyleValue(
  styles: ResponsiveStyleSet,
  key: string,
  breakpointId: string,
): ResponsiveStyleSet {
  return withSlot(styles, key, breakpointId, { state: 'unset' });
}

export function setNodeResponsiveStyle(
  document: CanonicalDocument,
  nodeId: string,
  key: string,
  breakpointId: string,
  value: JsonValue,
): CanonicalDocument {
  return updateDocumentNode(document, nodeId, (node) => ({
    ...node,
    styles: setResponsiveStyleValue(node.styles, key, breakpointId, value),
  }));
}

export function inheritNodeResponsiveStyle(
  document: CanonicalDocument,
  nodeId: string,
  key: string,
  breakpointId: string,
  fromBreakpointId: string,
): CanonicalDocument {
  return updateDocumentNode(document, nodeId, (node) => ({
    ...node,
    styles: inheritResponsiveStyleValue(node.styles, key, breakpointId, fromBreakpointId),
  }));
}

export function unsetNodeResponsiveStyle(
  document: CanonicalDocument,
  nodeId: string,
  key: string,
  breakpointId: string,
): CanonicalDocument {
  return updateDocumentNode(document, nodeId, (node) => ({
    ...node,
    styles: unsetResponsiveStyleValue(node.styles, key, breakpointId),
  }));
}
