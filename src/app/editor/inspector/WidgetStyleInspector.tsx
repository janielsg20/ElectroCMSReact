import { useState, type FocusEvent } from 'react';
import type { JsonValue } from '../../../core/domain';
import {
  resolveResponsiveStyle,
  type DocumentNode,
} from '../../../core/project';
import type { CanvasStyleEditResult } from '../canvas/use-canvas-document-actions';

interface StyleField {
  key: string;
  label: string;
  kind: 'text' | 'number';
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
}

const STYLE_FIELDS: readonly StyleField[] = [
  { key: 'color', label: 'Text color', kind: 'text', placeholder: '#111827' },
  { key: 'backgroundColor', label: 'Background', kind: 'text', placeholder: '#ffffff' },
  { key: 'fontSize', label: 'Font size', kind: 'number', min: 1, max: 240, step: 1 },
  { key: 'padding', label: 'Padding', kind: 'number', min: 0, max: 256, step: 1 },
  { key: 'borderRadius', label: 'Radius', kind: 'number', min: 0, max: 256, step: 1 },
  { key: 'opacity', label: 'Opacity', kind: 'number', min: 0, max: 1, step: 0.05 },
];

export interface WidgetStyleInspectorProps {
  node: DocumentNode;
  breakpointId: string;
  onSetStyle?: (nodeId: string, key: string, value: JsonValue) => CanvasStyleEditResult;
  onUnsetStyle?: (nodeId: string, key: string) => CanvasStyleEditResult;
}

function formattedValue(value: JsonValue | undefined): string {
  return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
}

export function WidgetStyleInspector({
  node,
  breakpointId,
  onSetStyle,
  onUnsetStyle,
}: WidgetStyleInspectorProps) {
  const [issues, setIssues] = useState<Readonly<Record<string, string>>>({});

  const commit = (field: StyleField, rawValue: string) => {
    if (!onSetStyle) return;
    const trimmed = rawValue.trim();
    if (!trimmed) {
      const result = onUnsetStyle?.(node.id, field.key);
      if (result?.applied) {
        setIssues((current) => {
          const next = { ...current };
          delete next[field.key];
          return next;
        });
      }
      return;
    }

    let value: JsonValue = trimmed;
    if (field.kind === 'number') {
      const numeric = Number(trimmed);
      if (!Number.isFinite(numeric)) {
        setIssues((current) => ({ ...current, [field.key]: 'Enter a valid number.' }));
        return;
      }
      if (field.min !== undefined && numeric < field.min) {
        setIssues((current) => ({ ...current, [field.key]: `Minimum is ${field.min}.` }));
        return;
      }
      if (field.max !== undefined && numeric > field.max) {
        setIssues((current) => ({ ...current, [field.key]: `Maximum is ${field.max}.` }));
        return;
      }
      value = numeric;
    }

    const result = onSetStyle(node.id, field.key, value);
    setIssues((current) => {
      const next = { ...current };
      if (result.applied) delete next[field.key];
      else next[field.key] = result.message ?? 'Style could not be applied.';
      return next;
    });
  };

  const commitBlur = (field: StyleField) => (event: FocusEvent<HTMLInputElement>) => {
    commit(field, event.currentTarget.value);
  };

  return (
    <fieldset className="widget-inspector-section widget-style-inspector">
      <legend>Styles · {breakpointId}</legend>
      {STYLE_FIELDS.map((field) => {
        const resolved = resolveResponsiveStyle(node.styles, field.key, breakpointId);
        const currentSlot = node.styles[field.key]?.[breakpointId];
        const inherited = currentSlot?.state === 'inherited';
        const issue = issues[field.key];
        return (
          <label className="widget-inspector-field widget-style-field" key={field.key}>
            <span>{field.label}</span>
            <input
              key={`${node.id}-${breakpointId}-${field.key}-${formattedValue(resolved?.value)}`}
              aria-label={`Style ${field.label}`}
              type={field.kind === 'number' ? 'number' : 'text'}
              defaultValue={formattedValue(resolved?.value)}
              placeholder={field.placeholder}
              {...(field.min === undefined ? {} : { min: field.min })}
              {...(field.max === undefined ? {} : { max: field.max })}
              {...(field.step === undefined ? {} : { step: field.step })}
              onBlur={commitBlur(field)}
            />
            <small>
              {resolved
                ? inherited
                  ? `Inherited from ${resolved.sourceBreakpointId}`
                  : `Explicit on ${resolved.sourceBreakpointId}`
                : 'Unset'}
            </small>
            {issue ? <span className="widget-inspector-error" role="alert">{issue}</span> : null}
          </label>
        );
      })}
    </fieldset>
  );
}
