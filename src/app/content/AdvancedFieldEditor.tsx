import { useMemo, useState } from 'react';
import {
  CONDITIONAL_OPERATORS,
  MAX_REPEATER_ITEMS,
  UNCONFIGURED_ADVANCED_REFERENCE,
  createContentFieldTypeRegistry,
  createDefaultCustomFieldDefinition,
  listFieldGroupDefinitions,
  validateFieldGroupDefinition,
  type CustomFieldDefinition,
  type FieldGroupDefinition,
  type FieldTypeDefinition,
} from '../../core/content';
import { type JsonValue } from '../../core/domain';
import { useProjectSession } from '../project/project-session-context';
import './advanced-field-editor.css';

const registry = createContentFieldTypeRegistry();

type StatusTone = 'idle' | 'success' | 'error';

interface EditorStatus {
  tone: StatusTone;
  message: string;
}

const DEFAULT_STATUS: EditorStatus = {
  tone: 'idle',
  message: 'Advanced fields remain portable schema data; runtime behavior is resolved by the core registry.',
};

function nextFieldId(group: FieldGroupDefinition, type: string): string {
  const base = type.split('/').at(-1) ?? 'advanced-field';
  const existing = new Set(group.fields.map((field) => field.id));
  if (!existing.has(base)) return base;
  let index = 2;
  while (existing.has(`${base}-${index}`)) index += 1;
  return `${base}-${index}`;
}

function patchField(
  group: FieldGroupDefinition,
  fieldId: string,
  patch: Partial<CustomFieldDefinition>,
): FieldGroupDefinition {
  return {
    ...group,
    fields: group.fields.map((field) => field.id === fieldId ? { ...field, ...patch } : field),
  };
}

function moveField(group: FieldGroupDefinition, fieldId: string, direction: -1 | 1): FieldGroupDefinition {
  const index = group.fields.findIndex((field) => field.id === fieldId);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= group.fields.length) return group;
  const fields = [...group.fields];
  const [field] = fields.splice(index, 1);
  if (!field) return group;
  fields.splice(target, 0, field);
  return { ...group, fields };
}

function AdvancedConfigEditor({
  group,
  field,
  groups,
  onChange,
}: {
  group: FieldGroupDefinition;
  field: CustomFieldDefinition;
  groups: readonly FieldGroupDefinition[];
  onChange(field: CustomFieldDefinition): void;
}) {
  const referenceGroups = groups.filter((candidate) => candidate.id !== group.id);
  const patchConfig = (key: string, value: JsonValue | undefined) => {
    const config = { ...field.config };
    if (value === undefined) delete config[key];
    else config[key] = value;
    onChange({ ...field, config });
  };

  if (field.type === 'core/group') {
    return (
      <label className="advanced-field-control">
        <span>Referenced Field Group</span>
        <select
          aria-label="Advanced referenced field group"
          value={typeof field.config.fieldGroupId === 'string' ? field.config.fieldGroupId : UNCONFIGURED_ADVANCED_REFERENCE}
          onChange={(event) => patchConfig('fieldGroupId', event.target.value)}
        >
          <option value={UNCONFIGURED_ADVANCED_REFERENCE}>Choose a Field Group…</option>
          {referenceGroups.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.label}</option>)}
        </select>
        <small>Nested schema; direct/indirect cycles are rejected by core validation.</small>
      </label>
    );
  }

  if (field.type === 'core/repeater') {
    return (
      <div className="advanced-config-stack">
        <label className="advanced-field-control">
          <span>Row Field Group</span>
          <select
            aria-label="Repeater field group"
            value={typeof field.config.fieldGroupId === 'string' ? field.config.fieldGroupId : UNCONFIGURED_ADVANCED_REFERENCE}
            onChange={(event) => patchConfig('fieldGroupId', event.target.value)}
          >
            <option value={UNCONFIGURED_ADVANCED_REFERENCE}>Choose a Field Group…</option>
            {referenceGroups.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.label}</option>)}
          </select>
        </label>
        <div className="advanced-config-pair">
          <label className="advanced-field-control">
            <span>Min rows</span>
            <input
              aria-label="Repeater minimum rows"
              type="number"
              min={0}
              max={MAX_REPEATER_ITEMS}
              value={typeof field.config.minItems === 'number' ? field.config.minItems : 0}
              onChange={(event) => patchConfig('minItems', Number(event.target.value))}
            />
          </label>
          <label className="advanced-field-control">
            <span>Max rows</span>
            <input
              aria-label="Repeater maximum rows"
              type="number"
              min={1}
              max={MAX_REPEATER_ITEMS}
              placeholder={String(MAX_REPEATER_ITEMS)}
              value={typeof field.config.maxItems === 'number' ? field.config.maxItems : ''}
              onChange={(event) => patchConfig('maxItems', event.target.value === '' ? undefined : Number(event.target.value))}
            />
          </label>
        </div>
        <small className="advanced-config-note">Hard safety limit: {MAX_REPEATER_ITEMS} rows.</small>
      </div>
    );
  }

  if (field.type === 'core/calculated') {
    const numericSiblings = group.fields.filter(
      (candidate) => candidate.id !== field.id && ['core/number', 'core/currency', 'core/calculated'].includes(candidate.type),
    );
    return (
      <div className="advanced-config-stack">
        <label className="advanced-field-control">
          <span>Safe expression</span>
          <input
            aria-label="Calculated expression"
            value={typeof field.config.expression === 'string' ? field.config.expression : ''}
            placeholder="quantity * price"
            onChange={(event) => patchConfig('expression', event.target.value)}
          />
          <small>Only sibling numeric field names, numbers, + − × ÷ and parentheses. No JavaScript execution.</small>
        </label>
        <div className="advanced-chip-row" aria-label="Available calculated inputs">
          {numericSiblings.length === 0 ? <span>No numeric sibling fields</span> : numericSiblings.map((candidate) => <code key={candidate.id}>{candidate.name}</code>)}
        </div>
      </div>
    );
  }

  const sourceFields = group.fields.filter((candidate) => candidate.id !== field.id);
  return (
    <div className="advanced-config-stack">
      <label className="advanced-field-control">
        <span>Nested Field Group</span>
        <select
          aria-label="Conditional field group"
          value={typeof field.config.fieldGroupId === 'string' ? field.config.fieldGroupId : UNCONFIGURED_ADVANCED_REFERENCE}
          onChange={(event) => patchConfig('fieldGroupId', event.target.value)}
        >
          <option value={UNCONFIGURED_ADVANCED_REFERENCE}>Choose a Field Group…</option>
          {referenceGroups.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.label}</option>)}
        </select>
      </label>
      <label className="advanced-field-control">
        <span>Source sibling</span>
        <select
          aria-label="Conditional source field"
          value={typeof field.config.sourceField === 'string' ? field.config.sourceField : ''}
          onChange={(event) => patchConfig('sourceField', event.target.value)}
        >
          <option value="">Choose a field…</option>
          {sourceFields.map((candidate) => <option key={candidate.id} value={candidate.name}>{candidate.label} · {candidate.name}</option>)}
        </select>
      </label>
      <label className="advanced-field-control">
        <span>Operator</span>
        <select
          aria-label="Conditional operator"
          value={typeof field.config.operator === 'string' ? field.config.operator : 'truthy'}
          onChange={(event) => patchConfig('operator', event.target.value)}
        >
          {CONDITIONAL_OPERATORS.map((operator) => <option key={operator} value={operator}>{operator}</option>)}
        </select>
      </label>
      {!['truthy', 'falsy'].includes(String(field.config.operator ?? 'truthy')) ? (
        <label className="advanced-field-control">
          <span>Compare value</span>
          <input
            aria-label="Conditional compare value"
            value={field.config.compareValue === undefined || field.config.compareValue === null ? '' : String(field.config.compareValue)}
            onChange={(event) => patchConfig('compareValue', event.target.value)}
          />
        </label>
      ) : null}
    </div>
  );
}

export function AdvancedFieldEditor() {
  const session = useProjectSession();
  const groups = useMemo(() => listFieldGroupDefinitions(session.project), [session.project]);
  const definitions = useMemo(
    () => registry.listLatest({ availability: 'available', category: 'advanced' }),
    [],
  );
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [draft, setDraft] = useState<FieldGroupDefinition | null>(null);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [status, setStatus] = useState<EditorStatus>(DEFAULT_STATUS);

  const selectGroup = (id: string) => {
    const group = groups.find((candidate) => candidate.id === id) ?? null;
    setSelectedGroupId(id);
    setDraft(group ? structuredClone(group) : null);
    setSelectedFieldId(null);
    setStatus(DEFAULT_STATUS);
  };

  const selectedField = draft?.fields.find((field) => field.id === selectedFieldId) ?? null;
  const validation = draft ? validateFieldGroupDefinition(session.project, draft) : null;

  const addField = (definition: FieldTypeDefinition) => {
    if (!draft) {
      setStatus({ tone: 'error', message: 'Choose a Field Group before adding advanced fields.' });
      return;
    }
    const id = nextFieldId(draft, definition.type);
    const field = createDefaultCustomFieldDefinition(registry, definition.type, id, definition.metadata.label);
    const next = { ...draft, fields: [...draft.fields, field] };
    setDraft(next);
    setSelectedFieldId(field.id);
    setStatus({ tone: 'idle', message: `Added ${definition.metadata.label}. Complete its configuration before saving.` });
  };

  const updateSelectedField = (nextField: CustomFieldDefinition) => {
    if (!draft) return;
    setDraft(patchField(draft, nextField.id, nextField));
    setSelectedFieldId(nextField.id);
  };

  const save = () => {
    if (!draft || !validation?.ok) return;
    const result = session.updateFieldGroup(draft.id, draft);
    if (!result.ok) {
      setStatus({ tone: 'error', message: result.message });
      return;
    }
    setDraft(structuredClone(result.value));
    setSelectedGroupId(result.value.id);
    setStatus({ tone: 'success', message: result.changed ? `Saved ${result.value.label}.` : `No changes to save for ${result.value.label}.` });
  };

  return (
    <section className="advanced-field-editor" aria-label="Advanced Fields">
      <header className="advanced-field-editor-header">
        <div>
          <span className="advanced-field-eyebrow">Dynamic content · MF-042</span>
          <h3>Advanced Fields</h3>
          <p>Compose nested and computed field behavior without executable code or parallel storage.</p>
        </div>
        <label className="advanced-group-picker">
          <span>Field Group</span>
          <select aria-label="Advanced field target group" value={selectedGroupId} onChange={(event) => selectGroup(event.target.value)}>
            <option value="">Choose a Field Group…</option>
            {groups.map((group) => <option key={group.id} value={group.id}>{group.label}</option>)}
          </select>
        </label>
      </header>

      <div className="advanced-field-layout">
        <aside className="advanced-library" aria-label="Advanced field library">
          <div className="advanced-panel-heading"><strong>Field Library</strong><code>{definitions.length}</code></div>
          {definitions.map((definition) => (
            <button key={definition.type} type="button" onClick={() => addField(definition)} disabled={!draft}>
              <span className="advanced-field-icon" aria-hidden="true">{definition.metadata.icon.slice(0, 1).toUpperCase()}</span>
              <span><strong>{definition.metadata.label}</strong><small>{definition.metadata.description}</small></span>
              <code>v{definition.version}</code>
            </button>
          ))}
          <div className="advanced-boundary-note">Relation, User and Taxonomy stay modeled until MF-043.</div>
        </aside>

        <section className="advanced-order" aria-label="Advanced field order">
          <div className="advanced-panel-heading"><strong>Stored Order</strong><code>{draft?.fields.length ?? 0}</code></div>
          {!draft ? (
            <div className="advanced-empty"><strong>Choose a Field Group</strong><span>Advanced fields are added to an existing reusable schema.</span></div>
          ) : draft.fields.length === 0 ? (
            <div className="advanced-empty"><strong>No fields yet</strong><span>Add primitive fields in Field Groups or advanced fields from the library.</span></div>
          ) : (
            <div className="advanced-order-list">
              {draft.fields.map((field, index) => {
                const definition = registry.resolve(field.type, field.typeVersion);
                const advanced = definitions.some((candidate) => candidate.type === field.type);
                return (
                  <div
                    key={field.id}
                    className="advanced-order-item"
                    data-selected={selectedFieldId === field.id ? 'true' : 'false'}
                  >
                    <button
                      type="button"
                      className="advanced-order-select"
                      aria-pressed={selectedFieldId === field.id}
                      onClick={() => setSelectedFieldId(field.id)}
                    >
                      <span><strong>{field.label}</strong><small>{field.name} · {definition.metadata.label}</small></span>
                    </button>
                    <span className="advanced-order-actions">
                      {advanced ? <code>Advanced</code> : <code>Base</code>}
                      <button type="button" aria-label={`Move ${field.label} up`} disabled={index === 0} onClick={() => setDraft(moveField(draft, field.id, -1))}>↑</button>
                      <button type="button" aria-label={`Move ${field.label} down`} disabled={index === draft.fields.length - 1} onClick={() => setDraft(moveField(draft, field.id, 1))}>↓</button>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <aside className="advanced-inspector" aria-label="Advanced field inspector">
          <div className="advanced-panel-heading"><strong>Inspector</strong>{selectedField ? <code>{selectedField.type}@{selectedField.typeVersion}</code> : null}</div>
          {!draft || !selectedField ? (
            <div className="advanced-empty"><strong>Select a field</strong><span>Configure advanced behavior in context.</span></div>
          ) : !definitions.some((definition) => definition.type === selectedField.type) ? (
            <div className="advanced-empty"><strong>Base field selected</strong><span>Edit primitive/base fields in the Field Groups workspace.</span></div>
          ) : (
            <div className="advanced-inspector-body">
              <label className="advanced-field-control"><span>Label</span><input aria-label="Advanced field label" value={selectedField.label} onChange={(event) => updateSelectedField({ ...selectedField, label: event.target.value })} /></label>
              <label className="advanced-field-control"><span>Storage name</span><input aria-label="Advanced field name" value={selectedField.name} onChange={(event) => updateSelectedField({ ...selectedField, name: event.target.value })} /></label>
              <label className="advanced-required"><input aria-label="Advanced field required" type="checkbox" checked={selectedField.required} onChange={(event) => updateSelectedField({ ...selectedField, required: event.target.checked })} /><span>Required field</span></label>
              <AdvancedConfigEditor group={draft} field={selectedField} groups={groups} onChange={updateSelectedField} />
              <button type="button" className="advanced-remove" onClick={() => { setDraft({ ...draft, fields: draft.fields.filter((field) => field.id !== selectedField.id) }); setSelectedFieldId(null); }}>Remove field</button>
            </div>
          )}
        </aside>
      </div>

      {draft && validation && !validation.ok ? (
        <div className="advanced-validation" role="alert">
          <strong>Resolve {validation.issues.length} schema {validation.issues.length === 1 ? 'issue' : 'issues'} before saving.</strong>
          <span>{validation.issues[0]?.message}</span>
        </div>
      ) : null}

      <footer className="advanced-field-footer">
        <div data-tone={status.tone} aria-live="polite"><span>{status.message}</span><code>{session.saveState}</code></div>
        <button type="button" onClick={save} disabled={!draft || !validation?.ok}>Save advanced schema</button>
      </footer>
    </section>
  );
}
