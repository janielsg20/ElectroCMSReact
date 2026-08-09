import { useMemo, useState, type FocusEvent } from 'react';
import type { JsonObject, JsonValue } from '../../../core/domain';
import type { BreakpointDefinition, CanonicalProject, DocumentNode, DynamicBinding } from '../../../core/project';
import {
  formatInspectorFieldValue,
  normalizeInspectorSchema,
  parseInspectorFieldValue,
  type InspectorFieldSchema,
  type WidgetPropValidationIssue,
} from '../../../core/widgets';
import { Icon } from '../../components/Icon';
import { useEditorWidgetRegistry } from '../../widgets/editor-widget-registry-context';
import type {
  CanvasPropEditResult,
  CanvasStyleEditResult,
} from '../canvas/use-canvas-document-actions';
import type { CanvasBindingEditResult } from '../canvas/use-canvas-dynamic-binding-actions';
import { WidgetBindingsInspector } from './WidgetBindingsInspector';
import { WidgetStyleInspector } from './WidgetStyleInspector';
import './widget-inspector.css';

export interface WidgetInspectorProps {
  node: DocumentNode | null;
  project?: CanonicalProject;
  breakpointId?: string;
  breakpoints?: readonly BreakpointDefinition[];
  onSetProps?: (nodeId: string, patch: JsonObject) => CanvasPropEditResult;
  onSetBindings?: (nodeId: string, bindings: readonly DynamicBinding[]) => CanvasBindingEditResult;
  onSetStyle?: (nodeId: string, key: string, value: JsonValue) => CanvasStyleEditResult;
  onUnsetStyle?: (nodeId: string, key: string) => CanvasStyleEditResult;
  onInheritStyle?: (nodeId: string, key: string, fromBreakpointId: string) => CanvasStyleEditResult;
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
        <input id={controlId} type="checkbox" checked={value === true} onChange={(event) => onCommit(field, event.target.checked)} />
        {commonDescription}
        {error}
      </label>
    );
  }

  if (field.kind === 'select') {
    return (
      <label className="widget-inspector-field" htmlFor={controlId}>
        <span>{field.label}</span>
        <select id={controlId} value={typeof value === 'string' ? value : ''} onChange={(event) => onCommit(field, event.target.value)}>
          {(field.options ?? []).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        {commonDescription}
        {error}
      </label>
    );
  }

  const commitBlur = (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => onCommit(field, event.currentTarget.value);

  if (field.kind === 'json') {
    return (
      <label className="widget-inspector-field" htmlFor={controlId}>
        <span>{field.label}</span>
        <textarea key={`${node.id}-${field.key}-${JSON.stringify(value)}`} id={controlId} rows={4} defaultValue={formatInspectorFieldValue(field, value)} placeholder={field.placeholder} onBlur={commitBlur} />
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

export function WidgetInspector({
  node,
  project,
  breakpointId = 'desktop',
  breakpoints = [],
  onSetProps,
  onSetBindings,
  onSetStyle,
  onUnsetStyle,
  onInheritStyle,
}: WidgetInspectorProps) {
  const registry = useEditorWidgetRegistry();
  const [issues, setIssues] = useState<Readonly<Record<string, string>>>({});
  const [activeTab, setActiveTab] = useState<'content' | 'bindings' | 'style'>('content');
  const [collapsedSections, setCollapsedSections] = useState<ReadonlySet<string>>(() => new Set());
  const definition = node && registry.has(node.type, node.version) ? registry.core.resolve(node.type, node.version) : null;
  const schema = useMemo(() => definition && node ? normalizeInspectorSchema(definition.inspectorSchema, node.props) : { sections: [] }, [definition, node]);

  if (!node) {
    return (
      <aside className="widget-inspector widget-inspector-v2" aria-label="Widget inspector" data-state="empty">
        <div className="widget-inspector-empty widget-inspector-empty-v2">
          <span className="widget-inspector-empty-mark" aria-hidden="true">+</span>
          <strong>Nothing selected</strong>
          <span>Select one widget to inspect its properties.</span>
          <small>Select a single element on the canvas to edit its properties and design.</small>
        </div>
      </aside>
    );
  }

  if (!definition) {
    return (
      <aside className="widget-inspector widget-inspector-v2" aria-label="Widget inspector" data-state="unregistered">
        <header className="widget-inspector-header"><div><strong>{node.name ?? node.type}</strong><span className="widget-inspector-eyebrow">Unregistered element</span></div><code>{node.type}</code></header>
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
    const matchingIssue = editResult.issues.find((candidate: WidgetPropValidationIssue) => candidate.path === field.key || candidate.path.endsWith(`.${field.key}`)) ?? editResult.issues[0];
    setIssues((current) => ({ ...current, [field.key]: matchingIssue?.message ?? 'The value could not be applied.' }));
  };

  const toggleSection = (sectionId: string) => {
    setCollapsedSections((current) => {
      const next = new Set(current);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  };

  return (
    <aside className="widget-inspector widget-inspector-v2" aria-label="Widget inspector" data-state="ready">
      <header className="widget-inspector-header widget-inspector-header-v2">
        <div className="min-w-0">
          <span className="widget-inspector-eyebrow">{definition.metadata.category}</span>
          <strong>{node.name ?? definition.metadata.name}</strong>
        </div>
        <code title={`${definition.type}@${definition.version}`}>{definition.type}</code>
      </header>

      <div className="widget-inspector-tabs" role="tablist" aria-label="Inspector sections">
        <button type="button" role="tab" aria-selected={activeTab === 'content'} data-active={activeTab === 'content'} onClick={() => setActiveTab('content')}>Properties</button>
        {project ? <button type="button" role="tab" aria-selected={activeTab === 'bindings'} data-active={activeTab === 'bindings'} onClick={() => setActiveTab('bindings')}>Bindings</button> : null}
        <button type="button" role="tab" aria-selected={activeTab === 'style'} data-active={activeTab === 'style'} onClick={() => setActiveTab('style')}>Design</button>
      </div>

      <div className="widget-inspector-scroll">
        {activeTab === 'content' ? (
          <div role="tabpanel" aria-label="Properties inspector">
            {schema.sections.length > 0 ? (
              <div className="widget-inspector-sections">
                {schema.sections.map((section) => {
                  const collapsed = collapsedSections.has(section.id);
                  return (
                    <section key={`${node.id}-${section.id}`} className="widget-inspector-section widget-inspector-disclosure">
                      <button type="button" className="widget-inspector-disclosure-trigger" aria-expanded={!collapsed} aria-controls={`inspector-section-${node.id}-${section.id}`} onClick={() => toggleSection(section.id)}>
                        <span>{section.label}</span>
                        <Icon name={collapsed ? 'expand' : 'arrow-down'} size={12} />
                      </button>
                      {!collapsed ? (
                        <div id={`inspector-section-${node.id}-${section.id}`} className="widget-inspector-section-fields">
                          {section.fields.map((field) => {
                            const fieldIssue = issues[field.key];
                            return <InspectorFieldControl key={field.key} node={node} field={field} {...(fieldIssue === undefined ? {} : { issue: fieldIssue })} onCommit={commit} />;
                          })}
                        </div>
                      ) : null}
                    </section>
                  );
                })}
              </div>
            ) : <div className="widget-inspector-empty">This element has no editable properties.</div>}
          </div>
        ) : activeTab === 'bindings' && project ? (
          <div role="tabpanel" aria-label="Bindings inspector">
            <WidgetBindingsInspector project={project} node={node} {...(onSetBindings ? { onSetBindings } : {})} />
          </div>
        ) : (
          <div role="tabpanel" aria-label="Design inspector">
            <WidgetStyleInspector
              node={node}
              breakpointId={breakpointId}
              breakpoints={breakpoints}
              {...(onSetStyle ? { onSetStyle } : {})}
              {...(onUnsetStyle ? { onUnsetStyle } : {})}
              {...(onInheritStyle ? { onInheritStyle } : {})}
            />
          </div>
        )}
      </div>
    </aside>
  );
}
