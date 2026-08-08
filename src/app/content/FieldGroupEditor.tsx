import { useMemo, useState, type ChangeEvent } from 'react';
import { createDefaultFieldTypeRegistry } from '../../core/content/builtin-field-types';
import type { FieldTypeDefinition } from '../../core/content/field-type-definition';
import {
  createDefaultCustomFieldDefinition,
  createDefaultFieldGroupDefinition,
  listFieldGroupDefinitions,
  validateFieldGroupDefinition,
  type CustomFieldDefinition,
  type FieldGroupDefinition,
} from '../../core/content/field-group';
import { isJsonObject, type JsonObject, type JsonValue } from '../../core/domain';
import { useProjectSession } from '../project/project-session-context';
import './field-group-editor.css';

type EditorMode = 'empty' | 'create' | 'edit';
type StatusTone = 'idle' | 'success' | 'error';

interface EditorStatus {
  tone: StatusTone;
  message: string;
}

interface TypeConfigEditorProps {
  definition: FieldTypeDefinition;
  config: JsonObject;
  onChange(config: JsonObject): void;
}

interface DefaultValueEditorProps {
  shape: FieldTypeDefinition['valueShape'];
  value: JsonValue;
  onChange(value: JsonValue): void;
}

const DEFAULT_STATUS: EditorStatus = {
  tone: 'idle',
  message: 'Field groups are portable schemas. Changes autosave with the canonical project.',
};

function nextIdentifier(base: string, existing: ReadonlySet<string>): string {
  if (!existing.has(base)) return base;
  let index = 2;
  while (existing.has(`${base}-${index}`)) index += 1;
  return `${base}-${index}`;
}

function fieldTypeBaseId(type: string): string {
  const segment = type.split('/').at(-1) ?? 'field';
  return segment.replace(/[^a-z0-9-]/g, '-') || 'field';
}

function configWithValue(config: JsonObject, key: string, value: JsonValue | undefined): JsonObject {
  const next = structuredClone(config);
  if (value === undefined) delete next[key];
  else next[key] = value;
  return next;
}

function formatOptions(value: JsonValue | undefined): string {
  if (!Array.isArray(value)) return '';
  return value
    .filter(isJsonObject)
    .map((option) => {
      const label = typeof option.label === 'string' ? option.label : '';
      const optionValue = typeof option.value === 'string' ? option.value : '';
      return `${label}=${optionValue}`;
    })
    .join('\n');
}

function parseOptions(value: string): JsonValue[] {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separator = line.indexOf('=');
      const label = separator >= 0 ? line.slice(0, separator).trim() : line;
      const optionValue = separator >= 0 ? line.slice(separator + 1).trim() : line;
      return { label, value: optionValue };
    });
}

function TypeConfigEditor({ definition, config, onChange }: TypeConfigEditorProps) {
  const entries = Object.entries(definition.configSchema);
  if (entries.length === 0) {
    return (
      <div className="field-group-config-empty">
        <strong>No type-specific settings</strong>
        <span>This field uses the registry defaults for {definition.metadata.label}.</span>
      </div>
    );
  }

  return (
    <div className="field-group-config-grid">
      {entries.map(([key, descriptorValue]) => {
        const descriptor = typeof descriptorValue === 'string' ? descriptorValue : 'json';
        const currentValue = config[key];
        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, (character) => character.toUpperCase());

        if (descriptor.startsWith('array<')) {
          return (
            <label className="field-group-field field-group-field-wide" key={key}>
              <span>{label}</span>
              <textarea
                aria-label={`Field config ${label}`}
                rows={4}
                value={formatOptions(currentValue)}
                placeholder={'Label=value\nSecond option=second'}
                onChange={(event) => onChange(configWithValue(config, key, parseOptions(event.target.value)))}
              />
              <small>One option per line using Label=value.</small>
            </label>
          );
        }

        if (descriptor.startsWith('integer') || descriptor.startsWith('number')) {
          return (
            <label className="field-group-field" key={key}>
              <span>{label}</span>
              <input
                aria-label={`Field config ${label}`}
                type="number"
                step={descriptor.startsWith('integer') ? 1 : 'any'}
                value={typeof currentValue === 'number' ? String(currentValue) : ''}
                onChange={(event) => {
                  const value = event.target.value === '' ? undefined : Number(event.target.value);
                  onChange(configWithValue(config, key, value));
                }}
              />
            </label>
          );
        }

        if (descriptor.startsWith('string')) {
          return (
            <label className="field-group-field" key={key}>
              <span>{label}</span>
              <input
                aria-label={`Field config ${label}`}
                value={typeof currentValue === 'string' ? currentValue : ''}
                onChange={(event) =>
                  onChange(configWithValue(config, key, event.target.value || undefined))
                }
              />
            </label>
          );
        }

        return (
          <div className="field-group-config-empty" key={key}>
            <strong>{label}</strong>
            <span>Schema-driven JSON setting. A dedicated renderer can be registered later.</span>
          </div>
        );
      })}
    </div>
  );
}

function DefaultValueEditor({ shape, value, onChange }: DefaultValueEditorProps) {
  if (shape === 'string') {
    return (
      <label className="field-group-field">
        <span>Default value</span>
        <input
          aria-label="Field default value"
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => onChange(event.target.value || null)}
        />
      </label>
    );
  }

  if (shape === 'number') {
    return (
      <label className="field-group-field">
        <span>Default value</span>
        <input
          aria-label="Field default value"
          type="number"
          value={typeof value === 'number' ? String(value) : ''}
          onChange={(event) => onChange(event.target.value === '' ? null : Number(event.target.value))}
        />
      </label>
    );
  }

  if (shape === 'boolean') {
    return (
      <label className="field-group-field">
        <span>Default value</span>
        <select
          aria-label="Field default value"
          value={value === null ? 'null' : value === true ? 'true' : 'false'}
          onChange={(event) =>
            onChange(event.target.value === 'null' ? null : event.target.value === 'true')
          }
        >
          <option value="null">No default</option>
          <option value="true">True</option>
          <option value="false">False</option>
        </select>
      </label>
    );
  }

  return (
    <label className="field-group-field field-group-field-wide">
      <span>Default value · JSON</span>
      <textarea
        key={JSON.stringify(value)}
        aria-label="Field default value JSON"
        rows={3}
        defaultValue={JSON.stringify(value, null, 2)}
        onBlur={(event) => {
          try {
            const parsed = JSON.parse(event.target.value) as unknown;
            if (
              parsed === null ||
              typeof parsed === 'string' ||
              typeof parsed === 'boolean' ||
              typeof parsed === 'number' ||
              Array.isArray(parsed) ||
              isJsonObject(parsed)
            ) {
              onChange(parsed as JsonValue);
            }
          } catch {
            // Core validation remains authoritative; keep the last valid value.
          }
        }}
      />
      <small>Applied only after valid JSON is committed on blur.</small>
    </label>
  );
}

export function FieldGroupEditor() {
  const session = useProjectSession();
  const registry = useMemo(() => createDefaultFieldTypeRegistry(), []);
  const fieldGroups = useMemo(
    () => listFieldGroupDefinitions(session.project, registry),
    [registry, session.project],
  );
  const availableTypes = useMemo(
    () => registry.listLatest({ availability: 'available' }),
    [registry],
  );
  const modeledTypes = useMemo(
    () => registry.listLatest({ availability: 'modeled' }),
    [registry],
  );
  const [mode, setMode] = useState<EditorMode>('empty');
  const [draft, setDraft] = useState<FieldGroupDefinition | null>(null);
  const [selectedFieldIndex, setSelectedFieldIndex] = useState<number | null>(null);
  const [status, setStatus] = useState<EditorStatus>(DEFAULT_STATUS);
  const [deleteArmed, setDeleteArmed] = useState(false);
  const [typeSearch, setTypeSearch] = useState('');

  const validation = draft ? validateFieldGroupDefinition(draft, registry) : null;
  const issuesByPath = useMemo(
    () => new Map(validation && !validation.ok ? validation.issues.map((issue) => [issue.path, issue.message]) : []),
    [validation],
  );
  const selectedField = draft && selectedFieldIndex !== null
    ? draft.fields[selectedFieldIndex] ?? null
    : null;
  const selectedType = selectedField
    ? (() => {
        try {
          return registry.resolve(selectedField.type, selectedField.typeVersion);
        } catch {
          return null;
        }
      })()
    : null;
  const filteredTypes = useMemo(() => {
    const query = typeSearch.trim().toLowerCase();
    if (!query) return availableTypes;
    return availableTypes.filter((definition) => [
      definition.metadata.label,
      definition.metadata.category,
      definition.metadata.description,
      ...(definition.metadata.keywords ?? []),
    ].join(' ').toLowerCase().includes(query));
  }, [availableTypes, typeSearch]);

  const beginCreate = () => {
    const ids = new Set(fieldGroups.map((group) => group.id));
    const id = nextIdentifier('field-group', ids);
    setMode('create');
    setDraft(createDefaultFieldGroupDefinition(id, 'New Field Group'));
    setSelectedFieldIndex(null);
    setDeleteArmed(false);
    setStatus({ tone: 'idle', message: 'Add fields from the registry library, then configure them in context.' });
  };

  const selectGroup = (group: FieldGroupDefinition) => {
    setMode('edit');
    setDraft(structuredClone(group));
    setSelectedFieldIndex(group.fields.length > 0 ? 0 : null);
    setDeleteArmed(false);
    setStatus({ tone: 'idle', message: `Editing ${group.label}.` });
  };

  const patchDraft = <K extends keyof FieldGroupDefinition>(key: K, value: FieldGroupDefinition[K]) => {
    if (!draft) return;
    setDraft({ ...draft, [key]: value });
    setDeleteArmed(false);
  };

  const patchField = (index: number, updater: (field: CustomFieldDefinition) => CustomFieldDefinition) => {
    if (!draft || !draft.fields[index]) return;
    const fields = [...draft.fields];
    fields[index] = updater(fields[index]!);
    setDraft({ ...draft, fields });
    setDeleteArmed(false);
  };

  const addField = (definition: FieldTypeDefinition) => {
    if (!draft) return;
    const existingIds = new Set(draft.fields.map((field) => field.id));
    const id = nextIdentifier(fieldTypeBaseId(definition.type), existingIds);
    const field = createDefaultCustomFieldDefinition(
      registry,
      definition.type,
      id,
      definition.metadata.label,
    );
    const index = draft.fields.length;
    setDraft({ ...draft, fields: [...draft.fields, field] });
    setSelectedFieldIndex(index);
    setDeleteArmed(false);
    setStatus({ tone: 'idle', message: `${definition.metadata.label} field added to the draft group.` });
  };

  const moveField = (index: number, direction: -1 | 1) => {
    if (!draft) return;
    const target = index + direction;
    if (target < 0 || target >= draft.fields.length) return;
    const fields = [...draft.fields];
    const [field] = fields.splice(index, 1);
    if (!field) return;
    fields.splice(target, 0, field);
    setDraft({ ...draft, fields });
    setSelectedFieldIndex(target);
    setDeleteArmed(false);
  };

  const removeField = (index: number) => {
    if (!draft || !draft.fields[index]) return;
    const fields = draft.fields.filter((_, fieldIndex) => fieldIndex !== index);
    setDraft({ ...draft, fields });
    setSelectedFieldIndex(fields.length === 0 ? null : Math.min(index, fields.length - 1));
    setDeleteArmed(false);
  };

  const handleGroupText =
    (key: 'id' | 'label' | 'description') =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      patchDraft(key, event.target.value);
    };

  const saveDraft = () => {
    if (!draft || !validation?.ok) return;
    const result = mode === 'create'
      ? session.createFieldGroup(draft)
      : session.updateFieldGroup(draft.id, draft);
    if (!result.ok) {
      setStatus({ tone: 'error', message: result.message });
      return;
    }
    setDraft(structuredClone(result.value));
    setMode('edit');
    setSelectedFieldIndex((current) =>
      result.value.fields.length === 0 ? null : Math.min(current ?? 0, result.value.fields.length - 1),
    );
    setDeleteArmed(false);
    setStatus({
      tone: 'success',
      message: mode === 'create'
        ? `Created ${result.value.label}.`
        : result.changed
          ? `Saved ${result.value.label}.`
          : `No changes to save for ${result.value.label}.`,
    });
  };

  const deleteDraft = () => {
    if (!draft || mode !== 'edit') return;
    if (!deleteArmed) {
      setDeleteArmed(true);
      setStatus({ tone: 'idle', message: `Confirm deletion of ${draft.label}.` });
      return;
    }
    const result = session.removeFieldGroup(draft.id);
    if (!result.ok) {
      setDeleteArmed(false);
      setStatus({ tone: 'error', message: result.message });
      return;
    }
    setMode('empty');
    setDraft(null);
    setSelectedFieldIndex(null);
    setDeleteArmed(false);
    setStatus({ tone: 'success', message: `Deleted ${result.value.label}.` });
  };

  return (
    <section className="field-group-editor" aria-label="Field Groups">
      <header className="field-group-editor-header">
        <div>
          <span className="field-group-editor-eyebrow">Dynamic content · MF-040</span>
          <h3>Custom Field Groups</h3>
          <p>Compose reusable portable schemas from the versioned field type registry.</p>
        </div>
        <div className="field-group-editor-summary" aria-label="Field group summary">
          <strong>{fieldGroups.length}</strong>
          <span>{fieldGroups.length === 1 ? 'field group' : 'field groups'}</span>
          <button type="button" onClick={beginCreate}>New field group</button>
        </div>
      </header>

      <div className="field-group-editor-grid">
        <aside className="field-group-list" aria-label="Field group list">
          <div className="field-group-list-heading">
            <span>Schemas</span>
            <code>{fieldGroups.length}</code>
          </div>
          {fieldGroups.length === 0 ? (
            <div className="field-group-empty-list">
              <strong>No field groups yet</strong>
              <span>Create a schema, add registry fields, then arrange their stored order.</span>
            </div>
          ) : (
            <div className="field-group-list-items">
              {fieldGroups.map((group) => {
                const selected = mode === 'edit' && draft?.id === group.id;
                return (
                  <button
                    key={group.id}
                    type="button"
                    className="field-group-list-item"
                    data-selected={selected ? 'true' : 'false'}
                    aria-pressed={selected}
                    onClick={() => selectGroup(group)}
                  >
                    <span className="field-group-list-item-main">
                      <strong>{group.label}</strong>
                      <code>{group.id}</code>
                    </span>
                    <span className="field-group-list-item-meta">
                      <span>{group.presentation === 'tabs' ? 'Tabs' : 'Group'}</span>
                      <span>{group.fields.length} {group.fields.length === 1 ? 'field' : 'fields'}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        <div className="field-group-detail">
          {!draft ? (
            <div className="field-group-detail-empty">
              <span aria-hidden="true">ƒ</span>
              <strong>Select a group or create a new schema</strong>
              <p>The field library, ordered schema and contextual inspector stay together without modal CRUD.</p>
              <button type="button" onClick={beginCreate}>Create field group</button>
            </div>
          ) : (
            <form
              className="field-group-form"
              onSubmit={(event) => {
                event.preventDefault();
                saveDraft();
              }}
            >
              <div className="field-group-form-toolbar">
                <div>
                  <span>{mode === 'create' ? 'New field group' : 'Field group settings'}</span>
                  <strong>{draft.label || draft.id}</strong>
                </div>
                <div className="field-group-form-actions">
                  {mode === 'edit' ? (
                    <button
                      type="button"
                      className="field-group-delete"
                      data-armed={deleteArmed ? 'true' : 'false'}
                      onClick={deleteDraft}
                    >
                      {deleteArmed ? 'Confirm delete' : 'Delete'}
                    </button>
                  ) : null}
                  <button type="submit" className="field-group-save" disabled={!validation?.ok}>
                    {mode === 'create' ? 'Create field group' : 'Save changes'}
                  </button>
                </div>
              </div>

              <section className="field-group-form-section">
                <div className="field-group-form-section-heading">
                  <strong>Schema identity</strong>
                  <span>Portable, stable identifiers plus group/tab presentation.</span>
                </div>
                <div className="field-group-field-grid">
                  <label className="field-group-field">
                    <span>ID</span>
                    <input
                      aria-label="Field group ID"
                      value={draft.id}
                      disabled={mode === 'edit'}
                      onChange={handleGroupText('id')}
                      aria-invalid={issuesByPath.has('id')}
                    />
                    {issuesByPath.get('id') ? <small role="alert">{issuesByPath.get('id')}</small> : null}
                  </label>
                  <label className="field-group-field">
                    <span>Label</span>
                    <input
                      aria-label="Field group label"
                      value={draft.label}
                      onChange={handleGroupText('label')}
                      aria-invalid={issuesByPath.has('label')}
                    />
                    {issuesByPath.get('label') ? <small role="alert">{issuesByPath.get('label')}</small> : null}
                  </label>
                  <label className="field-group-field">
                    <span>Presentation</span>
                    <select
                      aria-label="Field group presentation"
                      value={draft.presentation}
                      onChange={(event) => patchDraft('presentation', event.target.value === 'tabs' ? 'tabs' : 'group')}
                    >
                      <option value="group">Group panel</option>
                      <option value="tabs">Tab group</option>
                    </select>
                  </label>
                  <label className="field-group-field field-group-field-wide">
                    <span>Description</span>
                    <textarea
                      aria-label="Field group description"
                      rows={2}
                      value={draft.description}
                      onChange={handleGroupText('description')}
                      aria-invalid={issuesByPath.has('description')}
                    />
                    {issuesByPath.get('description') ? <small role="alert">{issuesByPath.get('description')}</small> : null}
                  </label>
                </div>
              </section>

              <section className="field-group-form-section field-group-builder-section">
                <div className="field-group-form-section-heading">
                  <strong>Field builder</strong>
                  <span>Registry library → ordered schema → contextual inspector.</span>
                </div>
                <div className="field-group-builder">
                  <aside className="field-type-library" aria-label="Field type library">
                    <div className="field-type-library-heading">
                      <div>
                        <strong>Field library</strong>
                        <span>{availableTypes.length} available · {modeledTypes.length} modeled</span>
                      </div>
                      <input
                        aria-label="Search field types"
                        type="search"
                        value={typeSearch}
                        placeholder="Search types"
                        onChange={(event) => setTypeSearch(event.target.value)}
                      />
                    </div>
                    <div className="field-type-library-list">
                      {filteredTypes.map((definition) => (
                        <button
                          key={`${definition.type}@${definition.version}`}
                          type="button"
                          className="field-type-library-item"
                          onClick={() => addField(definition)}
                          aria-label={`Add ${definition.metadata.label} field`}
                        >
                          <span className="field-type-icon" aria-hidden="true">+</span>
                          <span>
                            <strong>{definition.metadata.label}</strong>
                            <small>{definition.metadata.category}</small>
                          </span>
                        </button>
                      ))}
                      {filteredTypes.length === 0 ? (
                        <div className="field-type-library-empty">No available field types match this search.</div>
                      ) : null}
                    </div>
                    <div className="field-type-modeled-note">
                      <strong>{modeledTypes.length} advanced types stay modeled</strong>
                      <span>Relations, repeaters, groups, calculated and conditional behavior unlock in MF-042/MF-043.</span>
                    </div>
                  </aside>

                  <div className="field-order-panel" aria-label="Ordered fields">
                    <div className="field-order-heading">
                      <span>Stored order</span>
                      <code>{draft.fields.length}</code>
                    </div>
                    {draft.fields.length === 0 ? (
                      <div className="field-order-empty">
                        <strong>No fields in this group</strong>
                        <span>Add an available type from the library. Empty groups are valid portable schemas.</span>
                      </div>
                    ) : (
                      <ol className="field-order-list">
                        {draft.fields.map((field, index) => {
                          let typeDefinition: FieldTypeDefinition | null = null;
                          try {
                            typeDefinition = registry.resolve(field.type, field.typeVersion);
                          } catch {
                            typeDefinition = null;
                          }
                          return (
                            <li key={`${field.id}-${index}`}>
                              <button
                                type="button"
                                className="field-order-select"
                                data-selected={selectedFieldIndex === index ? 'true' : 'false'}
                                aria-pressed={selectedFieldIndex === index}
                                onClick={() => setSelectedFieldIndex(index)}
                              >
                                <span className="field-order-index">{index + 1}</span>
                                <span className="field-order-main">
                                  <strong>{field.label || field.id}</strong>
                                  <small>{typeDefinition?.metadata.label ?? field.type} · {field.name}</small>
                                </span>
                                {field.required ? <span className="field-required-badge">Required</span> : null}
                              </button>
                              <div className="field-order-actions">
                                <button
                                  type="button"
                                  aria-label={`Move ${field.label || field.id} up`}
                                  disabled={index === 0}
                                  onClick={() => moveField(index, -1)}
                                >↑</button>
                                <button
                                  type="button"
                                  aria-label={`Move ${field.label || field.id} down`}
                                  disabled={index === draft.fields.length - 1}
                                  onClick={() => moveField(index, 1)}
                                >↓</button>
                                <button
                                  type="button"
                                  aria-label={`Remove ${field.label || field.id}`}
                                  onClick={() => removeField(index)}
                                >×</button>
                              </div>
                            </li>
                          );
                        })}
                      </ol>
                    )}
                  </div>

                  <aside className="field-inspector" aria-label="Field inspector">
                    {!selectedField || selectedFieldIndex === null || !selectedType ? (
                      <div className="field-inspector-empty">
                        <strong>Select a field</strong>
                        <span>Configure identity, defaults and registry-defined settings here.</span>
                      </div>
                    ) : (
                      <div className="field-inspector-content">
                        <div className="field-inspector-heading">
                          <div>
                            <span>Field inspector</span>
                            <strong>{selectedType.metadata.label}</strong>
                          </div>
                          <code>{selectedField.type}@{selectedField.typeVersion}</code>
                        </div>
                        <div className="field-group-field-grid field-group-field-grid-single">
                          <label className="field-group-field">
                            <span>Label</span>
                            <input
                              aria-label="Field label"
                              value={selectedField.label}
                              onChange={(event) => patchField(selectedFieldIndex, (field) => ({ ...field, label: event.target.value }))}
                              aria-invalid={issuesByPath.has(`fields.${selectedFieldIndex}.label`)}
                            />
                            {issuesByPath.get(`fields.${selectedFieldIndex}.label`) ? (
                              <small role="alert">{issuesByPath.get(`fields.${selectedFieldIndex}.label`)}</small>
                            ) : null}
                          </label>
                          <label className="field-group-field">
                            <span>ID</span>
                            <input
                              aria-label="Field ID"
                              value={selectedField.id}
                              onChange={(event) => patchField(selectedFieldIndex, (field) => ({ ...field, id: event.target.value }))}
                              aria-invalid={issuesByPath.has(`fields.${selectedFieldIndex}.id`)}
                            />
                            {issuesByPath.get(`fields.${selectedFieldIndex}.id`) ? (
                              <small role="alert">{issuesByPath.get(`fields.${selectedFieldIndex}.id`)}</small>
                            ) : null}
                          </label>
                          <label className="field-group-field">
                            <span>Storage name</span>
                            <input
                              aria-label="Field name"
                              value={selectedField.name}
                              onChange={(event) => patchField(selectedFieldIndex, (field) => ({ ...field, name: event.target.value }))}
                              aria-invalid={issuesByPath.has(`fields.${selectedFieldIndex}.name`)}
                            />
                            {issuesByPath.get(`fields.${selectedFieldIndex}.name`) ? (
                              <small role="alert">{issuesByPath.get(`fields.${selectedFieldIndex}.name`)}</small>
                            ) : null}
                          </label>
                          <label className="field-group-field field-group-field-wide">
                            <span>Description</span>
                            <textarea
                              aria-label="Field description"
                              rows={2}
                              value={selectedField.description}
                              onChange={(event) => patchField(selectedFieldIndex, (field) => ({ ...field, description: event.target.value }))}
                            />
                          </label>
                          {selectedType.features.placeholder === 'supported' ? (
                            <label className="field-group-field field-group-field-wide">
                              <span>Placeholder</span>
                              <input
                                aria-label="Field placeholder"
                                value={selectedField.placeholder ?? ''}
                                onChange={(event) => patchField(selectedFieldIndex, (field) => ({ ...field, placeholder: event.target.value || null }))}
                              />
                            </label>
                          ) : null}
                          <label className="field-group-check field-group-field-wide">
                            <input
                              aria-label="Required field"
                              type="checkbox"
                              checked={selectedField.required}
                              onChange={(event) => patchField(selectedFieldIndex, (field) => ({ ...field, required: event.target.checked }))}
                            />
                            <span>
                              <strong>Required</strong>
                              <small>Records must provide a value once record validation arrives in MF-041.</small>
                            </span>
                          </label>
                          <DefaultValueEditor
                            shape={selectedType.valueShape}
                            value={selectedField.defaultValue}
                            onChange={(value) => patchField(selectedFieldIndex, (field) => ({ ...field, defaultValue: value }))}
                          />
                        </div>
                        <div className="field-inspector-subsection">
                          <div className="field-inspector-subheading">
                            <strong>Type settings</strong>
                            <span>Generated from the registry config schema.</span>
                          </div>
                          <TypeConfigEditor
                            definition={selectedType}
                            config={selectedField.config}
                            onChange={(config) => patchField(selectedFieldIndex, (field) => ({ ...field, config }))}
                          />
                          {[...issuesByPath.entries()]
                            .filter(([path]) => path.startsWith(`fields.${selectedFieldIndex}.config`))
                            .map(([path, message]) => (
                              <small className="field-group-inline-error" role="alert" key={path}>{message}</small>
                            ))}
                        </div>
                        <div className="field-modeled-capabilities" aria-label="Modeled field capabilities">
                          <strong>Portable, not active yet</strong>
                          <span>Conditions: {selectedField.conditions.length}</span>
                          <span>Role visibility rules: {selectedField.roleVisibility.length}</span>
                          <small>These arrays are versioned in the schema, but their runtime editors/engines remain deferred.</small>
                        </div>
                      </div>
                    )}
                  </aside>
                </div>
              </section>
            </form>
          )}
          <div className="field-group-status" data-tone={status.tone} role="status" aria-live="polite">
            {status.message}
          </div>
        </div>
      </div>
    </section>
  );
}
