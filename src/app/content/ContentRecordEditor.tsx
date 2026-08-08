import { useMemo, useState, type ChangeEvent } from 'react';
import {
  CONTENT_RECORD_STATUSES,
  createDefaultContentRecordDefinition,
  listContentRecords,
  validateContentRecordDefinition,
  type ContentRecordDefinition,
  type ContentRecordStatus,
} from '../../core/content/content-record';
import { createDefaultFieldTypeRegistry } from '../../core/content/builtin-field-types';
import { listContentTypeDefinitions, type ContentTypeDefinition } from '../../core/content/content-type';
import {
  listFieldGroupDefinitions,
  type CustomFieldDefinition,
  type FieldGroupDefinition,
} from '../../core/content/field-group';
import { isJsonObject, type JsonObject, type JsonValue } from '../../core/domain';
import { useProjectSession } from '../project/project-session-context';
import './content-record-editor.css';

type EditorMode = 'empty' | 'create' | 'edit';
type StatusTone = 'idle' | 'success' | 'error';

interface EditorStatus {
  tone: StatusTone;
  message: string;
}

interface FieldValueControlProps {
  field: CustomFieldDefinition;
  value: JsonValue;
  invalid: boolean;
  onChange(value: JsonValue): void;
  onJsonError(message: string): void;
}

const DEFAULT_STATUS: EditorStatus = {
  tone: 'idle',
  message: 'Records use the canonical project store and autosave through the shared project session.',
};

function nextRecordId(contentTypeId: string, existingIds: ReadonlySet<string>): string {
  const base = `${contentTypeId.replace(/s$/, '') || 'record'}-record`;
  if (!existingIds.has(base)) return base;
  let index = 2;
  while (existingIds.has(`${base}-${index}`)) index += 1;
  return `${base}-${index}`;
}

function slugFromId(id: string): string {
  return id
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'record';
}

function fieldValueOrDefault(
  record: ContentRecordDefinition,
  group: FieldGroupDefinition,
  field: CustomFieldDefinition,
): JsonValue {
  const groupValues = record.fieldValues[group.id];
  const value = groupValues?.[field.name];
  return value === undefined ? structuredClone(field.defaultValue) : structuredClone(value);
}

function formatJson(value: JsonValue): string {
  return JSON.stringify(value, null, 2);
}

function fieldOptions(field: CustomFieldDefinition): Array<{ label: string; value: string }> {
  const options = field.config.options;
  if (!Array.isArray(options)) return [];
  return options.flatMap((option) => {
    if (!isJsonObject(option)) return [];
    if (typeof option.label !== 'string' || typeof option.value !== 'string') return [];
    return [{ label: option.label, value: option.value }];
  });
}

function FieldValueControl({
  field,
  value,
  invalid,
  onChange,
  onJsonError,
}: FieldValueControlProps) {
  const options = fieldOptions(field);

  if (field.type === 'core/select' || field.type === 'core/radio') {
    return (
      <select
        aria-label={`${field.label} value`}
        value={typeof value === 'string' ? value : ''}
        aria-invalid={invalid}
        onChange={(event) => onChange(event.target.value || null)}
      >
        <option value="">Select…</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    );
  }

  if (field.type === 'core/checkbox' || field.type === 'core/switch') {
    return (
      <label className="content-record-boolean-control">
        <input
          aria-label={`${field.label} value`}
          type="checkbox"
          checked={value === true}
          aria-invalid={invalid}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span>{value === true ? 'Enabled' : 'Disabled'}</span>
      </label>
    );
  }

  if (field.type === 'core/number' || field.type === 'core/currency') {
    return (
      <input
        aria-label={`${field.label} value`}
        type="number"
        step="any"
        value={typeof value === 'number' ? String(value) : ''}
        aria-invalid={invalid}
        onChange={(event) => onChange(event.target.value === '' ? null : Number(event.target.value))}
      />
    );
  }

  if (field.type === 'core/textarea' || field.type === 'core/rich-text') {
    return (
      <textarea
        aria-label={`${field.label} value`}
        rows={field.type === 'core/rich-text' ? 6 : 3}
        value={typeof value === 'string' ? value : ''}
        aria-invalid={invalid}
        onChange={(event) => onChange(event.target.value || null)}
      />
    );
  }

  if (
    field.type === 'core/text' ||
    field.type === 'core/email' ||
    field.type === 'core/phone' ||
    field.type === 'core/url' ||
    field.type === 'core/date' ||
    field.type === 'core/time' ||
    field.type === 'core/datetime' ||
    field.type === 'core/color'
  ) {
    const inputType = field.type === 'core/email'
      ? 'email'
      : field.type === 'core/phone'
        ? 'tel'
        : field.type === 'core/url'
          ? 'url'
          : field.type === 'core/date'
            ? 'date'
            : field.type === 'core/time'
              ? 'time'
              : field.type === 'core/datetime'
                ? 'datetime-local'
                : 'text';
    return (
      <input
        aria-label={`${field.label} value`}
        type={inputType}
        value={typeof value === 'string' ? value : ''}
        placeholder={field.placeholder ?? undefined}
        aria-invalid={invalid}
        onChange={(event) => onChange(event.target.value || null)}
      />
    );
  }

  return (
    <textarea
      key={`${field.id}:${formatJson(value)}`}
      aria-label={`${field.label} JSON value`}
      rows={5}
      defaultValue={formatJson(value)}
      aria-invalid={invalid}
      onBlur={(event) => {
        try {
          const parsed = JSON.parse(event.target.value) as unknown;
          if (
            parsed === null ||
            typeof parsed === 'string' ||
            typeof parsed === 'number' ||
            typeof parsed === 'boolean' ||
            Array.isArray(parsed) ||
            isJsonObject(parsed)
          ) {
            onChange(parsed as JsonValue);
            return;
          }
          onJsonError(`${field.label} must contain portable JSON.`);
        } catch {
          onJsonError(`${field.label} contains invalid JSON.`);
        }
      }}
    />
  );
}

function recordLabel(record: ContentRecordDefinition, contentTypes: readonly ContentTypeDefinition[]): string {
  if (record.title.trim()) return record.title;
  const type = contentTypes.find((definition) => definition.id === record.contentTypeId);
  return `${type?.singularLabel ?? 'Record'} · ${record.id}`;
}

export function ContentRecordEditor() {
  const session = useProjectSession();
  const registry = useMemo(() => createDefaultFieldTypeRegistry(), []);
  const contentTypes = useMemo(
    () => listContentTypeDefinitions(session.project),
    [session.project],
  );
  const fieldGroups = useMemo(
    () => listFieldGroupDefinitions(session.project, registry),
    [registry, session.project],
  );
  const allRecords = useMemo(
    () => listContentRecords(session.project, {}, registry),
    [registry, session.project],
  );

  const [mode, setMode] = useState<EditorMode>('empty');
  const [draft, setDraft] = useState<ContentRecordDefinition | null>(null);
  const [status, setStatus] = useState<EditorStatus>(DEFAULT_STATUS);
  const [deleteArmed, setDeleteArmed] = useState(false);
  const [search, setSearch] = useState('');
  const [contentTypeFilter, setContentTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | ContentRecordStatus>('all');

  const filteredRecords = useMemo(
    () => listContentRecords(
      session.project,
      {
        ...(contentTypeFilter === 'all' ? {} : { contentTypeId: contentTypeFilter }),
        ...(statusFilter === 'all' ? {} : { status: statusFilter }),
        ...(search.trim() ? { search } : {}),
      },
      registry,
    ),
    [contentTypeFilter, registry, search, session.project, statusFilter],
  );

  const validation = draft ? validateContentRecordDefinition(draft, session.project, registry) : null;
  const validationIssues = validation && !validation.ok ? validation.issues : [];
  const currentType = draft
    ? contentTypes.find((definition) => definition.id === draft.contentTypeId) ?? null
    : null;

  const beginCreate = () => {
    const contentType = contentTypes[0];
    if (!contentType) {
      setStatus({ tone: 'error', message: 'Create a Content Type before creating records.' });
      return;
    }
    const existingIds = new Set(allRecords.map((record) => record.id));
    const id = nextRecordId(contentType.id, existingIds);
    setDraft(createDefaultContentRecordDefinition(session.project, contentType.id, id));
    setMode('create');
    setDeleteArmed(false);
    setStatus({ tone: 'idle', message: 'New record draft. Choose its content type, data fields and status.' });
  };

  const selectRecord = (record: ContentRecordDefinition) => {
    setDraft(structuredClone(record));
    setMode('edit');
    setDeleteArmed(false);
    setStatus({ tone: 'idle', message: `Editing ${recordLabel(record, contentTypes)}.` });
  };

  const patchDraft = <K extends keyof ContentRecordDefinition>(key: K, value: ContentRecordDefinition[K]) => {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
    setDeleteArmed(false);
  };

  const changeCreateContentType = (contentTypeId: string) => {
    if (!draft || mode !== 'create') return;
    const nextType = contentTypes.find((definition) => definition.id === contentTypeId);
    if (!nextType) return;
    const existingIds = new Set(allRecords.map((record) => record.id));
    const id = nextRecordId(contentTypeId, existingIds);
    setDraft({
      ...createDefaultContentRecordDefinition(session.project, contentTypeId, id, draft.createdAt),
      status: draft.status,
    });
    setDeleteArmed(false);
  };

  const toggleFieldGroup = (group: FieldGroupDefinition, checked: boolean) => {
    setDraft((current) => {
      if (!current) return current;
      const nextIds = checked
        ? [...current.fieldGroupIds, group.id]
        : current.fieldGroupIds.filter((id) => id !== group.id);
      const nextValues: Record<string, JsonObject> = { ...current.fieldValues };
      if (checked) {
        const existing = nextValues[group.id] ?? {};
        const groupValues: JsonObject = {};
        for (const field of group.fields) {
          groupValues[field.name] = field.name in existing
            ? structuredClone(existing[field.name] as JsonValue)
            : structuredClone(field.defaultValue);
        }
        nextValues[group.id] = groupValues;
      } else {
        delete nextValues[group.id];
      }
      return { ...current, fieldGroupIds: nextIds, fieldValues: nextValues };
    });
    setDeleteArmed(false);
  };

  const patchFieldValue = (group: FieldGroupDefinition, field: CustomFieldDefinition, value: JsonValue) => {
    setDraft((current) => {
      if (!current) return current;
      const currentGroup = current.fieldValues[group.id] ?? {};
      return {
        ...current,
        fieldValues: {
          ...current.fieldValues,
          [group.id]: { ...currentGroup, [field.name]: structuredClone(value) },
        },
      };
    });
    setDeleteArmed(false);
  };

  const saveDraft = () => {
    if (!draft || !validation?.ok) return;
    const result = mode === 'create'
      ? session.createContentRecord(draft)
      : session.updateContentRecord(draft.id, draft);
    if (!result.ok) {
      setStatus({ tone: 'error', message: result.message });
      return;
    }
    setDraft(structuredClone(result.value));
    setMode('edit');
    setDeleteArmed(false);
    setStatus({
      tone: 'success',
      message: mode === 'create'
        ? `Created ${recordLabel(result.value, contentTypes)}.`
        : result.changed
          ? `Saved ${recordLabel(result.value, contentTypes)}.`
          : `No changes to save for ${recordLabel(result.value, contentTypes)}.`,
    });
  };

  const deleteDraft = () => {
    if (!draft || mode !== 'edit') return;
    if (!deleteArmed) {
      setDeleteArmed(true);
      setStatus({ tone: 'idle', message: `Confirm deletion of ${recordLabel(draft, contentTypes)}.` });
      return;
    }
    const result = session.removeContentRecord(draft.id);
    if (!result.ok) {
      setDeleteArmed(false);
      setStatus({ tone: 'error', message: result.message });
      return;
    }
    const label = recordLabel(result.value, contentTypes);
    setMode('empty');
    setDraft(null);
    setDeleteArmed(false);
    setStatus({ tone: 'success', message: `Deleted ${label}.` });
  };

  const handleText =
    (key: 'id' | 'title' | 'slug' | 'excerpt' | 'content') =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      patchDraft(key, event.target.value);
    };

  return (
    <section className="content-record-editor" aria-label="Records">
      <header className="content-record-editor-header">
        <div>
          <span className="content-record-editor-eyebrow">Dynamic content · MF-041</span>
          <h3>Records</h3>
          <p>Create and manage real local content with reusable Field Groups and registry-validated values.</p>
        </div>
        <div className="content-record-editor-summary">
          <span><strong>{allRecords.length}</strong> records</span>
          <span><strong>{allRecords.filter((record) => record.status === 'published').length}</strong> published</span>
          <button type="button" onClick={beginCreate} disabled={contentTypes.length === 0}>New record</button>
        </div>
      </header>

      <div className="content-record-editor-grid">
        <aside className="content-record-list" aria-label="Record list">
          <div className="content-record-list-tools">
            <input
              type="search"
              aria-label="Search records"
              value={search}
              placeholder="Search title or slug"
              onChange={(event) => setSearch(event.target.value)}
            />
            <div className="content-record-filter-row">
              <select
                aria-label="Filter records by content type"
                value={contentTypeFilter}
                onChange={(event) => setContentTypeFilter(event.target.value)}
              >
                <option value="all">All content types</option>
                {contentTypes.map((definition) => (
                  <option key={definition.id} value={definition.id}>{definition.label}</option>
                ))}
              </select>
              <select
                aria-label="Filter records by status"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as 'all' | ContentRecordStatus)}
              >
                <option value="all">All statuses</option>
                {CONTENT_RECORD_STATUSES.map((recordStatus) => (
                  <option key={recordStatus} value={recordStatus}>{recordStatus}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="content-record-list-heading">
            <span>Content</span>
            <code>{filteredRecords.length}</code>
          </div>

          {contentTypes.length === 0 ? (
            <div className="content-record-empty-list">
              <strong>No Content Types available</strong>
              <span>Create a Content Type first. Records always belong to an existing canonical model.</span>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="content-record-empty-list">
              <strong>{allRecords.length === 0 ? 'No records yet' : 'No matching records'}</strong>
              <span>{allRecords.length === 0 ? 'Create the first record for one of your Content Types.' : 'Adjust search or filters.'}</span>
            </div>
          ) : (
            <div className="content-record-list-items">
              {filteredRecords.map((record) => {
                const contentType = contentTypes.find((definition) => definition.id === record.contentTypeId);
                const selected = mode === 'edit' && draft?.id === record.id;
                return (
                  <button
                    key={record.id}
                    type="button"
                    className="content-record-list-item"
                    data-selected={selected ? 'true' : 'false'}
                    aria-pressed={selected}
                    onClick={() => selectRecord(record)}
                  >
                    <span className="content-record-list-main">
                      <strong>{recordLabel(record, contentTypes)}</strong>
                      <code>{record.slug}</code>
                    </span>
                    <span className="content-record-list-meta">
                      <span>{contentType?.singularLabel ?? record.contentTypeId}</span>
                      <span className="content-record-status-pill" data-status={record.status}>{record.status}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        <div className="content-record-detail">
          {!draft ? (
            <div className="content-record-detail-empty">
              <span aria-hidden="true">R</span>
              <strong>Select a record or create new content</strong>
              <p>Records stay in the canonical project and can combine one or more reusable Field Groups.</p>
              <button type="button" onClick={beginCreate} disabled={contentTypes.length === 0}>Create record</button>
            </div>
          ) : (
            <form
              className="content-record-form"
              onSubmit={(event) => {
                event.preventDefault();
                saveDraft();
              }}
            >
              <div className="content-record-form-toolbar">
                <div>
                  <span>{mode === 'create' ? 'New record' : currentType?.singularLabel ?? 'Record'}</span>
                  <strong>{recordLabel(draft, contentTypes)}</strong>
                </div>
                <div className="content-record-form-actions">
                  {mode === 'edit' ? (
                    <button
                      type="button"
                      className="content-record-delete"
                      data-armed={deleteArmed ? 'true' : 'false'}
                      onClick={deleteDraft}
                    >
                      {deleteArmed ? 'Confirm delete' : 'Delete'}
                    </button>
                  ) : null}
                  <button type="submit" className="content-record-save" disabled={!validation?.ok}>
                    {mode === 'create' ? 'Create record' : 'Save changes'}
                  </button>
                </div>
              </div>

              <div className="content-record-form-layout">
                <main className="content-record-form-main">
                  <section className="content-record-section">
                    <div className="content-record-section-heading">
                      <strong>Record identity</strong>
                      <span>Canonical type, ID, URL slug and publication state.</span>
                    </div>
                    <div className="content-record-fields-grid">
                      <label className="content-record-field">
                        <span>Content Type</span>
                        <select
                          aria-label="Record content type"
                          value={draft.contentTypeId}
                          disabled={mode === 'edit'}
                          onChange={(event) => changeCreateContentType(event.target.value)}
                        >
                          {contentTypes.map((definition) => (
                            <option key={definition.id} value={definition.id}>{definition.label}</option>
                          ))}
                        </select>
                      </label>
                      <label className="content-record-field">
                        <span>Status</span>
                        <select
                          aria-label="Record status"
                          value={draft.status}
                          onChange={(event) => patchDraft('status', event.target.value as ContentRecordStatus)}
                        >
                          {CONTENT_RECORD_STATUSES.map((recordStatus) => (
                            <option key={recordStatus} value={recordStatus}>{recordStatus}</option>
                          ))}
                        </select>
                      </label>
                      <label className="content-record-field">
                        <span>ID</span>
                        <input
                          aria-label="Record ID"
                          value={draft.id}
                          disabled={mode === 'edit'}
                          onChange={(event) => {
                            patchDraft('id', event.target.value);
                            if (mode === 'create') patchDraft('slug', slugFromId(event.target.value));
                          }}
                        />
                      </label>
                      <label className="content-record-field">
                        <span>Slug</span>
                        <input aria-label="Record slug" value={draft.slug} onChange={handleText('slug')} />
                      </label>
                    </div>
                  </section>

                  {currentType?.supports.title ? (
                    <section className="content-record-section">
                      <div className="content-record-section-heading">
                        <strong>Primary content</strong>
                        <span>Fields enabled by the selected Content Type.</span>
                      </div>
                      <div className="content-record-fields-grid">
                        <label className="content-record-field content-record-field-wide">
                          <span>Title</span>
                          <input aria-label="Record title" value={draft.title} onChange={handleText('title')} />
                        </label>
                        {currentType.supports.excerpt ? (
                          <label className="content-record-field content-record-field-wide">
                            <span>Excerpt</span>
                            <textarea aria-label="Record excerpt" rows={3} value={draft.excerpt} onChange={handleText('excerpt')} />
                          </label>
                        ) : null}
                        {currentType.supports.editor ? (
                          <label className="content-record-field content-record-field-wide">
                            <span>Content</span>
                            <textarea aria-label="Record content" rows={9} value={draft.content} onChange={handleText('content')} />
                          </label>
                        ) : null}
                      </div>
                    </section>
                  ) : currentType?.supports.editor || currentType?.supports.excerpt ? (
                    <section className="content-record-section">
                      <div className="content-record-section-heading">
                        <strong>Primary content</strong>
                        <span>Fields enabled by the selected Content Type.</span>
                      </div>
                      <div className="content-record-fields-grid">
                        {currentType.supports.excerpt ? (
                          <label className="content-record-field content-record-field-wide">
                            <span>Excerpt</span>
                            <textarea aria-label="Record excerpt" rows={3} value={draft.excerpt} onChange={handleText('excerpt')} />
                          </label>
                        ) : null}
                        {currentType.supports.editor ? (
                          <label className="content-record-field content-record-field-wide">
                            <span>Content</span>
                            <textarea aria-label="Record content" rows={9} value={draft.content} onChange={handleText('content')} />
                          </label>
                        ) : null}
                      </div>
                    </section>
                  ) : null}

                  <section className="content-record-section">
                    <div className="content-record-section-heading">
                      <strong>Custom fields</strong>
                      <span>{draft.fieldGroupIds.length} selected Field Group{draft.fieldGroupIds.length === 1 ? '' : 's'}.</span>
                    </div>
                    {draft.fieldGroupIds.length === 0 ? (
                      <div className="content-record-custom-empty">
                        <strong>No Field Groups selected</strong>
                        <span>Choose reusable schemas in the right panel to add structured fields to this record.</span>
                      </div>
                    ) : (
                      <div className="content-record-groups">
                        {draft.fieldGroupIds.map((groupId) => {
                          const group = fieldGroups.find((candidate) => candidate.id === groupId);
                          if (!group) return null;
                          return (
                            <fieldset className="content-record-group" key={group.id}>
                              <legend>
                                <strong>{group.label}</strong>
                                <span>{group.fields.length} {group.fields.length === 1 ? 'field' : 'fields'}</span>
                              </legend>
                              <div className="content-record-custom-fields">
                                {group.fields.map((field) => {
                                  const path = `fieldValues.${group.id}.${field.name}`;
                                  const fieldIssues = validationIssues.filter((issue) => issue.path === path || issue.path.startsWith(`${path}.`));
                                  const value = fieldValueOrDefault(draft, group, field);
                                  return (
                                    <label className="content-record-field content-record-field-wide" key={field.id}>
                                      <span>
                                        {field.label}
                                        {field.required ? <em>Required</em> : null}
                                      </span>
                                      <FieldValueControl
                                        field={field}
                                        value={value}
                                        invalid={fieldIssues.length > 0}
                                        onChange={(nextValue) => patchFieldValue(group, field, nextValue)}
                                        onJsonError={(message) => setStatus({ tone: 'error', message })}
                                      />
                                      {field.description ? <small>{field.description}</small> : null}
                                      {fieldIssues.map((issue) => <small role="alert" key={`${issue.path}:${issue.message}`}>{issue.message}</small>)}
                                    </label>
                                  );
                                })}
                              </div>
                            </fieldset>
                          );
                        })}
                      </div>
                    )}
                  </section>
                </main>

                <aside className="content-record-schema-panel" aria-label="Record Field Groups">
                  <div className="content-record-schema-heading">
                    <strong>Field Groups</strong>
                    <span>Compose this record from reusable schemas.</span>
                  </div>
                  {fieldGroups.length === 0 ? (
                    <div className="content-record-schema-empty">
                      <strong>No Field Groups</strong>
                      <span>Create reusable custom-field schemas in the Field Groups tab.</span>
                    </div>
                  ) : (
                    <div className="content-record-schema-list">
                      {fieldGroups.map((group) => {
                        const selected = draft.fieldGroupIds.includes(group.id);
                        return (
                          <label className="content-record-schema-item" key={group.id} data-selected={selected ? 'true' : 'false'}>
                            <input
                              type="checkbox"
                              aria-label={`Use ${group.label} field group`}
                              checked={selected}
                              onChange={(event) => toggleFieldGroup(group, event.target.checked)}
                            />
                            <span>
                              <strong>{group.label}</strong>
                              <small>{group.fields.length} fields · {group.presentation}</small>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                  <div className="content-record-model-note">
                    <strong>MF-041 boundary</strong>
                    <span>Relations, taxonomy/user fields, repeaters and conditional runtime stay disabled until MF-042/MF-043.</span>
                  </div>
                  <div className="content-record-meta">
                    <span>Created</span><code>{new Date(draft.createdAt).toLocaleString()}</code>
                    <span>Updated</span><code>{new Date(draft.updatedAt).toLocaleString()}</code>
                  </div>
                </aside>
              </div>
            </form>
          )}

          <div className="content-record-status" data-tone={status.tone} role="status" aria-live="polite">
            {status.message}
          </div>
        </div>
      </div>
    </section>
  );
}
