import { ValidationError } from '../domain';
import type { BreakpointDefinition } from './project-model';

export interface BreakpointValidationIssue {
  code: string;
  breakpointId?: string;
  message: string;
}

export interface BreakpointValidationResult {
  valid: boolean;
  issues: readonly BreakpointValidationIssue[];
}

export class BreakpointEngineError extends ValidationError {
  readonly issues: readonly BreakpointValidationIssue[];

  constructor(issues: readonly BreakpointValidationIssue[]) {
    super(`Breakpoint validation failed with ${issues.length} issue(s).`);
    this.issues = issues;
  }
}

export function sortBreakpoints(
  breakpoints: readonly BreakpointDefinition[],
): readonly BreakpointDefinition[] {
  return [...breakpoints].sort((left, right) => left.order - right.order || right.width - left.width || left.id.localeCompare(right.id));
}

export function validateBreakpointSet(
  breakpoints: readonly BreakpointDefinition[],
): BreakpointValidationResult {
  const issues: BreakpointValidationIssue[] = [];
  const ids = new Set<string>();
  const orders = new Set<number>();

  for (const breakpoint of breakpoints) {
    if (!breakpoint.id.trim()) issues.push({ code: 'EMPTY_ID', message: 'Breakpoint id cannot be empty.' });
    if (ids.has(breakpoint.id)) issues.push({ code: 'DUPLICATE_ID', breakpointId: breakpoint.id, message: `Duplicate breakpoint id ${breakpoint.id}.` });
    ids.add(breakpoint.id);

    if (!Number.isFinite(breakpoint.width) || breakpoint.width <= 0) {
      issues.push({ code: 'INVALID_WIDTH', breakpointId: breakpoint.id, message: `Breakpoint ${breakpoint.id} must have a positive width.` });
    }
    if (!Number.isInteger(breakpoint.order) || breakpoint.order < 0) {
      issues.push({ code: 'INVALID_ORDER', breakpointId: breakpoint.id, message: `Breakpoint ${breakpoint.id} must have a non-negative integer order.` });
    }
    if (orders.has(breakpoint.order)) {
      issues.push({ code: 'DUPLICATE_ORDER', breakpointId: breakpoint.id, message: `Breakpoint order ${breakpoint.order} is duplicated.` });
    }
    orders.add(breakpoint.order);
  }

  const sorted = sortBreakpoints(breakpoints);
  for (let index = 1; index < sorted.length; index += 1) {
    const wider = sorted[index - 1]!;
    const current = sorted[index]!;
    if (wider.width <= current.width) {
      issues.push({
        code: 'NON_DESCENDING_WIDTH',
        breakpointId: current.id,
        message: `${current.id} (${current.width}px) must be narrower than ${wider.id} (${wider.width}px).`,
      });
    }
  }

  return { valid: issues.length === 0, issues };
}

export function assertBreakpointSet(
  breakpoints: readonly BreakpointDefinition[],
): readonly BreakpointDefinition[] {
  const result = validateBreakpointSet(breakpoints);
  if (!result.valid) throw new BreakpointEngineError(result.issues);
  return sortBreakpoints(breakpoints);
}

export function getBreakpoint(
  breakpoints: readonly BreakpointDefinition[],
  breakpointId: string,
): BreakpointDefinition | null {
  return breakpoints.find((breakpoint) => breakpoint.id === breakpointId) ?? null;
}

export function getNearestWiderBreakpoint(
  breakpoints: readonly BreakpointDefinition[],
  breakpointId: string,
): BreakpointDefinition | null {
  const sorted = assertBreakpointSet(breakpoints);
  const index = sorted.findIndex((breakpoint) => breakpoint.id === breakpointId);
  if (index <= 0) return null;
  return sorted[index - 1] ?? null;
}

export function getNearestNarrowerBreakpoint(
  breakpoints: readonly BreakpointDefinition[],
  breakpointId: string,
): BreakpointDefinition | null {
  const sorted = assertBreakpointSet(breakpoints);
  const index = sorted.findIndex((breakpoint) => breakpoint.id === breakpointId);
  if (index < 0 || index >= sorted.length - 1) return null;
  return sorted[index + 1] ?? null;
}

export function getBreakpointInheritanceChain(
  breakpoints: readonly BreakpointDefinition[],
  breakpointId: string,
): readonly BreakpointDefinition[] {
  const sorted = assertBreakpointSet(breakpoints);
  const index = sorted.findIndex((breakpoint) => breakpoint.id === breakpointId);
  if (index < 0) return [];
  return sorted.slice(0, index).reverse();
}
