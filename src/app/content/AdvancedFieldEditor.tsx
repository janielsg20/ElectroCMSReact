import { useMemo, useState } from 'react';
import {
  CONDITIONAL_OPERATORS,
  MF042_ADVANCED_FIELD_TYPES,
  UNCONFIGURED_ADVANCED_REFERENCE,
  createContentFieldTypeRegistry,
  createDefaultCustomFieldDefinition,
  listFieldGroupDefinitions,
  validateFieldGroupDefinition,
  type CustomFieldDefinition,
  type FieldGroupDefinition,
  type Mf042AdvancedFieldType,
} from '../../core/content';
import type { JsonValue } from '../../core/domain';
import { useProjectSession } from '../project/project-session-context';
import './advanced-field-editor.css';

const ADVANCED_TYPES = new Set<string>(MF042_ADVANCED_FIELD_TYPES);

function nextFieldId(type: string, fields: readonly CustomFieldDefinition[]): string {
  const base = type.split('/').at(-1) ?? 'advanced-field';
  const ids = new Set(fields.map((field) => field.id));
  if (!ids.has(base)) return base;
  let index = 2;
  while (ids.has(`${base}-${index}`)) index += 1;
  return `${base}-${index}`;
}

function storageName(id: string): string {
  return id.replaceAll('-', '_');
}

function jsonText(value: JsonValue | undefined): string {
  return value === undefined ? '' : JSON.stringify(value);
}

function parseComparison(raw: string): JsonValue {
  if (!raw.trim()) return null;
  try {
    const value = JSON.parse(raw) as unknown;
    if (
      value === null ||
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      Array.isArray(value) ||
      (typeof value === 'object' && value !== null)
    ) {
      return value as JsonValue;
    }
  } catch {
    return raw;
  }
  return raw;
}

export function AdvancedFieldEditor() {
  const session = useProjectSession();
  const registry = useMemo(() => createContentFieldTypeRegistry(), []);
  const groups = useMemo(
    () => listFieldGroupDefinitions(session.project, registry),
    [registry, session.project],
  );
  const advancedDefinitions = useMemo(
    () => registry.listLatest({ availability: 'available', category: 'advanced' }),
    [registry],
  );
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [draft, setDraft] = useState<FieldGroupDefinition | null>(null);
  const [selectedFieldIndex, setSelectedFieldIndex] = useState<number | null>(null);
  const [status, setStatus] = useState('Select a Field Group, then insert an advanced field from the library.');

  const selectedGroup = groups.find((group) => group.id === selectedGroupId) ?? null;
  const activeDraft = draft && draft.id === selectedGroupId ? draft : selectedGroup;
  const validation = activeDraft
    ? validateFieldGroupDefinition(session.project, activeDraft, registry)
    : null;
  const selectedField = activeDraft && selectedFieldIndex !== null
    ? activeDraft.fields[selectedFieldIndex] ?? null
    : null;
  const selectedIsAdvanced = Boolean(selectedField && ADVANCED_TYPES.has(selectedField.type));
  const targetGroups = groups.filter((group) => group.id !== activeDraft?.id);
  const siblingFields = activeDraft?.fields.filter((field) => field.id !== selectedField?.id) ?? [];
  const numericSiblings = siblingFields.filter((field) => ['core/number', 'core/currency', 'core/calculated'].includes(field.type));

  const chooseGroup = (groupId: string) => {
    const group = groups.find((candidate) => candidate.id === groupId) ?? null;
    setSelectedGroupId(groupId);
    setDraft(group ? structuredClone(group) : null);
    const firstAdvanced = group?.fields.findIndex((field) => ADVANCED_TYPES.has(field.type)) ?? -1;
    setSelectedFieldIndex(firstAdvanced >= 0 ? firstAdvanced : null);
    setStatus(group ? `Editing advanced fields in ${group.label}.` : 'Select a Field Group.');
  };

  const patchField = (index: number, updater: (field: CustomFieldDefinition) => CustomFieldDefinition) => {
    setDraft((current) => {
      if (!current || !current.fields[index]) return current;
      const fields = [...current.fields];
      fields[index] = updater(fields[index]!);
      return { ...current, fields };
    });
  };

  const addAdvancedField = (type: Mf042AdvancedFieldType) => {
    if (!activeDraft) return;
    const definition = registry.resolve(type);
    const id = nextFieldId(type, activeDraft.fields);
    const field = createDefaultCustomFieldDefinition(registry, type, id, definition.metadata.label);
    setDraft({ ...activeDraft, fields: [...activeDraft.fields, field] });
    setSelectedFieldIndex(activeDraft.fields.length);
    setStatus(`${definition.metadata.label} added. Configure its references before saving.`);
  };

  const removeSelectedField = () => {
    if (!draft || selectedFieldIndex === null || !selectedIsAdvanced) return;
    const fields = draft.fields.filter((_, index) => index !== selectedFieldIndex);
    setDraft({ ...draft, fields });
    const next = fields.findIndex((field) => ADVANCED_TYPES.has(field.type));
    setSelectedFieldIndex(next >= 0 ? next : null);
    setStatus('Advanced field removed from the draft. Save to persist the schema change.');
  };

  const moveSelected = (direction: -1 | 1) => {
    if (!draft || selectedFieldIndex === null) return;
    const target = selectedFieldIndex + direction;
    if (target < 0 || target >= draft.fields.length) return;
    const fields = [...draft.fields];
    const [field] = fields.splice(selectedFieldIndex, 1);
    if (!field) return;
    fields.splice(target, 0, field);
    setDraft({ ...draft, fields });
    setSelectedFieldIndex(target);
  };

  const save = () => {
    if (!draft || !validation?.ok) return;
    const result = session.updateFieldGroup(draft.id, draft);
    if (!result.ok) {
      setStatus(result.message);
      return;
    }
    setDraft(structuredClone(result.value));
    setStatus(result.changed ? `Saved advanced schema for ${result.value.label}.` : 'No schema changes to save.');
  };

  const patchConfig = (key: string, value: JsonValue | undefined) => {
    if (selectedFieldIndex === null) return;
    patchField(selectedFieldIndex, (field) => {
      const config = { ...field.config };
      if (value === undefined) delete config[key];
      else config[key] = value;
      return { ...field, config };
    });
  };

  return (
    <section className="advanced-field-editor" aria-label="Advanced Fields">
      <header className="advanced-field-header">
        <div>
          <span>Dynamic content · MF-042</span>
          <h3>Advanced Fields</h3>
          <p>Compose nested, repeated, calculated and conditional schemas from reusable Field Groups.</p>
        </div>
        <div className="advanced-field-header-actions">
          <select aria-label="Advanced field target group" value={selectedGroupId} onChange={(event) => chooseGroup(event.target.value)}>
            <option value="">Select Field Group…</option>
            {groups.map((group) => <option key={group.id} value={group.id}>{group.label}</option>)}
          </select>
          <button type="button" onClick={save} disabled={!draft || !validation?.ok}>Save schema</button>
        </div>
      </header>

      <div className="advanced-field-builder">
        <aside className="advanced-field-library" aria-label="Advanced field library">
          <div className="advanced-field-panel-heading"><strong>Insert</strong><span>Advanced library</span></div>
          <div className="advanced-field-library-list">
            {advancedDefinitions.map((definition) => (
              <button
                key={definition.type}
                type="button"
                disabled={!activeDraft}
                onClick={() => addAdvancedField(definition.type as Mf042AdvancedFieldType)}
              >
                <span aria-hidden="true">+</span>
                <span><strong>{definition.metadata.label}</strong><small>{definition.metadata.description}</small></span>
              </button>
            ))}
          </div>
          <div className="advanced-field-boundary">
            <strong>MF-043 boundary</strong>
            <span>Relation remains modeled. User/Taxonomy references also stay outside this runtime slice.</span>
          </div>
        </aside>

        <main className="advanced-field-schema" aria-label="Advanced field schema order">
          <div className="advanced-field-panel-heading">
            <strong>Stored order</strong>
            <span>{activeDraft?.fields.length ?? 0} fields</span>
          </div>
          {!activeDraft ? (
            <div className="advanced-field-empty"><strong>Select a Field Group</strong><span>The schema will appear here in canonical stored order.</span></div>
          ) : activeDraft.fields.length === 0 ? (
            <div className="advanced-field-empty"><strong>Empty schema</strong><span>Insert an advanced field from the left library.</span></div>
          ) : (
            <ol className="advanced-field-order-list">
              {activeDraft.fields.map((field, index) => (
                <li key={`${field.id}-${index}`} data-advanced={ADVANCED_TYPES.has(field.type) ? 'true' : 'false'}>
                  <button type="button" aria-pressed={selectedFieldIndex === index} onClick={() => setSelectedFieldIndex(index)}>
                    <span>{index + 1}</span>
                    <span><strong>{field.label}</strong><small>{field.type}@{field.typeVersion} · {field.name}</small></span>
                    <em>{ADVANCED_TYPES.has(field.type) ? 'Advanced' : 'Base'}</em>
                  </button>
                </li>
              ))}
            </ol>
          )}
        </main>

        <aside className="advanced-field-inspector" aria-label="Advanced field inspector">
          <div className="advanced-field-panel-heading"><strong>Inspector</strong><span>Contextual settings</span></div>
          {!selectedField || selectedFieldIndex === null ? (
            <div className="advanced-field-empty"><strong>Select an advanced field</strong><span>Its identity and runtime configuration will appear here.</span></div>
          ) : !selectedIsAdvanced ? (
            <div className="advanced-field-empty"><strong>Base field</strong><span>Edit basic fields from the Field Groups workspace. This inspector owns MF-042 field types.</span></div>
          ) : (
            <div className="advanced-field-inspector-form">
              <label><span>Label</span><input aria-label="Advanced field label" value={selectedField.label} onChange={(event) => patchField(selectedFieldIndex, (field) => ({ ...field, label: event.target.value }))} /></label>
              <label><span>ID</span><input aria-label="Advanced field ID" value={selectedField.id} onChange={(event) => patchField(selectedFieldIndex, (field) => ({ ...field, id: event.target.value, name: storageName(event.target.value) }))} /></label>
              <label><span>Storage name</span><input aria-label="Advanced field name" value={selectedField.name} onChange={(event) => patchField(selectedFieldIndex, (field) => ({ ...field, name: event.target.value }))} /></label>
              <label className="advanced-field-wide"><span>Description</span><textarea aria-label="Advanced field description" rows={2} value={selectedField.description} onChange={(event) => patchField(selectedFieldIndex, (field) => ({ ...field, description: event.target.value }))} /></label>

              {(selectedField.type === 'core/group' || selectedField.type === 'core/repeater' || selectedField.type === 'core/conditional') ? (
                <label className="advanced-field-wide">
                  <span>Referenced Field Group</span>
                  <select aria-label="Advanced referenced field group" value={typeof selectedField.config.fieldGroupId === 'string' ? selectedField.config.fieldGroupId : UNCONFIGURED_ADVANCED_REFERENCE} onChange={(event) => patchConfig('fieldGroupId', event.target.value)}>
                    <option value={UNCONFIGURED_ADVANCED_REFERENCE}>Select reusable schema…</option>
                    {targetGroups.map((group) => <option key={group.id} value={group.id}>{group.label}</option>)}
                  </select>
                </label>
              ) : null}

              {selectedField.type === 'core/repeater' ? (
                <>
                  <label><span>Minimum rows</span><input aria-label="Repeater minimum rows" type="number" min={0} value={typeof selectedField.config.minItems === 'number' ? selectedField.config.minItems : 0} onChange={(event) => patchConfig('minItems', Number(event.target.value))} /></label>
                  <label><span>Maximum rows</span><input aria-label="Repeater maximum rows" type="number" min={1} value={typeof selectedField.config.maxItems === 'number' ? selectedField.config.maxItems : ''} onChange={(event) => patchConfig('maxItems', event.target.value === '' ? undefined : Number(event.target.value))} /></label>
                </>
              ) : null}

              {selectedField.type === 'core/calculated' ? (
                <label className="advanced-field-wide">
                  <span>Safe expression</span>
                  <input aria-label="Calculated expression" value={typeof selectedField.config.expression === 'string' ? selectedField.config.expression : ''} onChange={(event) => patchConfig('expression', event.target.value)} placeholder="quantity * unit_price" />
                  <small>Numeric siblings: {numericSiblings.map((field) => field.name).join(', ') || 'none'} · operators + − × ÷ and parentheses.</small>
                </label>
              ) : null}

              {selectedField.type === 'core/conditional' ? (
                <>
                  <label className="advanced-field-wide"><span>Source field</span><select aria-label="Conditional source field" value={typeof selectedField.config.sourceField === 'string' ? selectedField.config.sourceField : UNCONFIGURED_ADVANCED_REFERENCE} onChange={(event) => patchConfig('sourceField', event.target.value)}><option value={UNCONFIGURED_ADVANCED_REFERENCE}>Select sibling field…</option>{siblingFields.map((field) => <option key={field.id} value={field.name}>{field.label} · {field.name}</option>)}</select></label>
                  <label><span>Operator</span><select aria-label="Conditional operator" value={typeof selectedField.config.operator === 'string' ? selectedField.config.operator : 'truthy'} onChange={(event) => patchConfig('operator', event.target.value)}>{CONDITIONAL_OPERATORS.map((operator) => <option key={operator} value={operator}>{operator}</option>)}</select></label>
                  {!['truthy', 'falsy'].includes(String(selectedField.config.operator)) ? <label><span>Compare value</span><input aria-label="Conditional compare value" defaultValue={jsonText(selectedField.config.compareValue as JsonValue | undefined)} onBlur={(event) => patchConfig('compareValue', parseComparison(event.target.value))} /></label> : null}
                </>
              ) : null}

              <label className="advanced-field-check advanced-field-wide"><input type="checkbox" checked={selectedField.required} disabled={selectedField.type === 'core/conditional' || selectedField.type === 'core/calculated'} onChange={(event) => patchField(selectedFieldIndex, (field) => ({ ...field, required: event.target.checked }))} /><span><strong>Required</strong><small>Calculated is derived; Conditional validates its nested schema only while active.</small></span></label>

              <div className="advanced-field-inspector-actions advanced-field-wide">
                <button type="button" onClick={() => moveSelected(-1)} disabled={selectedFieldIndex === 0}>Move up</button>
                <button type="button" onClick={() => moveSelected(1)} disabled={selectedFieldIndex === (draft?.fields.length ?? 1) - 1}>Move down</button>
                <button type="button" className="advanced-field-remove" onClick={removeSelectedField}>Remove</button>
              </div>
            </div>
          )}
        </aside>
      </div>

      <footer className="advanced-field-status" data-valid={validation?.ok === false ? 'false' : 'true'}>
        <span>{validation?.ok === false ? validation.issues[0]?.message ?? 'Advanced schema is invalid.' : status}</span>
        <code>{validation?.ok === false ? `${validation.issues.length} issue${validation.issues.length === 1 ? '' : 's'}` : session.saveState}</code>
      </footer>
    </section>
  );
}
