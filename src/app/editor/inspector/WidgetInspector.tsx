import { useMemo, useState, type FocusEvent } from 'react';
import type { JsonObject, JsonValue } from '../../../core/domain';
import type { DocumentNode } from '../../../core/project';
import {
  formatInspectorFieldValue,
  normalizeInspectorSchema,
  parseInspectorFieldValue,
  type InspectorFieldSchema,
  type WidgetPropValidationIssue,
} from '../../../core/widgets';
import { useEditorWidgetRegistry } from '../../widgets/editor-widget-registry-context';
import type { CanvasPropEditResult } from '../canvas/use-canvas-document-actions';
import './widget-inspector.css';

export interface WidgetInspectorProps {
  node: DocumentNode | null;
  onSetProps?: (nodeId: string, patch: JsonObject) => CanvasPropEditResult;
}

interface InspectorFieldControlProps {
  node: DocumentNode;
  field: InspectorFieldSchema;
  issue?: string;
  onCommit: (field: InspectorFieldSchema, rawValue: string | boolean) => void;
}

function fieldValue(node: DocumentNode, field: InspectorFieldSchema): JsonValue | undefined {
  return node.props[field.key];
}

function InspectorFieldControl({ node, field, issue, onCommit }: InspectorFieldControlProps) {
  const value = fieldValue(node, field);
  const controlId = `inspector-${node.id}-${field.key}`;
  const commonDescription = field.description ? <small>{field.description}</small> : null;
  const error = issue ? <span className="widget-inspector-error" role="alert">{issue}</span> : null;

  if (field.kind === 'boolean') {
    return (
      <label className="widget-inspector-field widget-inspector-field--boolean" htmlFor={controlId}>
        <span>{field.label}</span>
        <input
          id={controlId}
          type="checkbox"
          checked={value === true}
          onChange={(event) => onCommit(field, event.target.checked)}
        />
        {commonDescription}
        {error}
      </label>
    );
  }

  if (field.kind === 'select') {
    return (
      <label className="widget-inspector-field" htmlFor={controlId}>
        <span>{field.label}</span>
        <select
          id={controlId}
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => onCommit(field, event.target.value)}
        >
          {(field.options ?? []).map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        {commonDescription}
        {error}
      </label>
    );
  }

  const commitBlur = (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onCommit(field, event.currentTarget.value);
  };

  if (field.kind === 'json') {
    return (
      <label className="widget-inspector-field" htmlFor={controlId}>
        <span>{field.label}</span>
        <textarea
          key={`${node.id}-${field.key}-${JSON.stringify(value)}`}
          id={controlId}
          rows={4}
          defaultValue={formatInspectorFieldValue(field, value)}
          placeholder={field.placeholder}
          onBlur={commitBlur}
        />
        {commonDescription}
        {error}
      </label>
    );
  }

  return (
    <label className="widget-inspector-field" htmlFor={controlId}>
      <span>{field.label}</span>
      <input
        key={`${node.id}-${field.key}-${String(value ?? '')}`}
        id={controlId}
        type={field.kind === 'number' ? 'number' : 'text'}
        defaultValue={formatInspectorFieldValue(field, value)}
        placeholder={field.placeholder}
        {...(field.min === undefined ? {} : { min: field.min })}
        {...(field.max === undefined ? {} : { max: field.max })}
        {...(field.step === undefined ? {} : { step: field.step })}
        onBlur={commitBlur}
      />
      {commonDescription}
      {error}
    </label>
  );
}

export function WidgetInspector({ node, onSetProps }: WidgetInspectorProps) {
  const registry = useEditorWidgetRegistry();
  const [issues, setIssues] = useState<Readonly<Record<string, string>>>({});
  const definition = node && registry.has(node.type, node.version)
    ? registry.core.resolve(node.type, node.version)
    : null;
  const schema = useMemo(
    () => definition && node ? normalizeInspectorSchema(definition.inspectorSchema, node.props) : { sections: [] },
    [definition, node],
  );

  if (!node) {
    return (
      <aside className="widget-inspector" aria-label="Widget inspector" data-state="empty">
        <div className="widget-inspector-empty">Select one widget to inspect its properties.</div>
      </aside>
    );
  }

  if (!definition) {
    return (
      <aside className="widget-inspector" aria-label="Widget inspector" data-state="unregistered">
        <header><strong>{node.name ?? node.type}</strong><code>{node.type}</code></header>
        <div className="widget-inspector-empty">No registered inspector schema is available.</div>
      </aside>
    );
  }

  const commit = (field: InspectorFieldSchema, rawValue: string | boolean) => {
    const parsed = parseInspectorFieldValue(field, rawValue);
    if (!parsed.valid || parsed.value === undefined) {
      setIssues((current) => ({ ...current, [field.key]: parsed.message ?? 'Invalid value.' }));
      return;
    }
    const editResult = onSetProps?.(node.id, { [field.key]: parsed.value }) ?? { applied: false, issues: [] };
    if (editResult.applied) {
      setIssues((current) => {
        const next = { ...current };
        delete next[field.key];
        return next;
      });
      return;
    }
    const matchingIssue = editResult.issues.find((candidate: WidgetPropValidationIssue) =>
      candidate.path === field.key || candidate.path.endsWith(`.${field.key}`),
    ) ?? editResult.issues[0];
    setIssues((current) => ({
      ...current,
      [field.key]: matchingIssue?.message ?? 'The value could not be applied.',
    }));
  };

  return (
    <aside className="widget-inspector" aria-label="Widget inspector" data-state="ready">
      <header className="widget-inspector-header">
        <div>
          <span className="widget-inspector-eyebrow">{definition.metadata.category}</span>
          <strong>{node.name ?? definition.metadata.name}</strong>
        </div>
        <code>{definition.type}@{definition.version}</code>
      </header>
      <div className="widget-inspector-capability" data-status={definition.capabilities.local}>
        Local: {definition.capabilities.local}
      </div>
      {schema.sections.length > 0 ? (
        <div className="widget-inspector-sections">
          {schema.sections.map((section) => (
            <fieldset key={section.id} className="widget-inspector-section">
              <legend>{section.label}</legend>
              {section.fields.map((field) => {
                const fieldIssue = issues[field.key];
                return (
                  <InspectorFieldControl
                    key={field.key}
                    node={node}
                    field={field}
                    {...(fieldIssue === undefined ? {} : { issue: fieldIssue })}
                    onCommit={commit}
                  />
                );
              })}
            </fieldset>
          ))}
        </div>
      ) : (
        <div className="widget-inspector-empty">This widget has no editable properties in its inspector schema.</div>
      )}
    </aside>
  );
}
