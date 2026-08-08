import { useMemo, useState, type ChangeEvent } from 'react';
import {
  CONTENT_RECORD_STATUSES,
  createDefaultContentRecordDefinition,
  createDefaultFieldTypeRegistry,
  listContentRecords,
  listContentTypeDefinitions,
  listFieldGroupDefinitions,
  validateContentRecordDefinition,
  type ContentRecordDefinition,
  type ContentRecordStatus,
  type CustomFieldDefinition,
  type FieldGroupDefinition,
} from '../../core/content';
import { isJsonObject, type JsonObject, type JsonValue } from '../../core/domain';
import { useProjectSession } from '../project/project-session-context';
import './record-editor.css';

type EditorMode = 'empty' | 'create' | 'edit';
type StatusTone = 'idle' | 'success' | 'error';

interface EditorStatus {
  tone: StatusTone;
  message: string;
}

const registry = createDefaultFieldTypeRegistry();
const DEFAULT_STATUS: EditorStatus = {
  tone: 'idle',
  message: 'Records are stored locally in the canonical project and validated against their field schemas.',
};

function nextRecordId(existing: ReadonlySet<string>): string {
  if (!existing.has('record')) return 'record';
  let index = 2;
  while (existing.has(`record-${index}`)) index += 1;
  return `record-${index}`;
}

function fieldGroupDefaults(group: FieldGroupDefinition): JsonObject {
  return Object.fromEntries(
    group.fields.map((field) => [field.name, structuredClone(field.defaultValue)]),
  ) as JsonObject;
}

function fieldOptions(field: CustomFieldDefinition): { label: string; value: string }[] {
  const raw = field.config.options;
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((option) => {
    if (!isJsonObject(option) || typeof option.label !== 'string' || typeof option.value !== 'string') {
      return [];
    }
    return [{ label: option.label, value: option.value }];
  });
}

function jsonText(value: JsonValue): string {
  return value === null ? '' : JSON.stringify(value, null, 2);
}

interface RecordFieldControlProps {
  groupId: string;
  field: CustomFieldDefinition;
  value: JsonValue;
  issue?: string;
  onChange(value: JsonValue): void;
}

function RecordFieldControl({ groupId, field, value, issue, onChange }: RecordFieldControlProps) {
  const definition = registry.resolve(field.type, field.typeVersion);
  const label = `${field.label}${field.required ? ' *' : ''}`;
  const inputId = `record-field-${groupId}-${field.name}`;
  const descriptionId = `${inputId}-description`;
  const options = fieldOptions(field);
  const describedBy = field.description || issue ? descriptionId : undefined;

  if (field.type === 'core/textarea' || field.type === 'core/rich-text') {
    return (
      <label className="record-field record-field-wide" htmlFor={inputId}>
        <span>{label}</span>
        <textarea
          id={inputId}
          aria-invalid={Boolean(issue)}
          aria-describedby={describedBy}
          rows={field.type === 'core/rich-text' ? 7 : 4}
          placeholder={field.placeholder ?? undefined}
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => onChange(event.target.value || null)}
        />
        {field.description || issue ? <small id={descriptionId}>{issue ?? field.description}</small> : null}
      </label>
    );
  }

  if (field.type === 'core/select' || field.type === 'core/radio') {
    return (
      <fieldset className="record-field record-field-choice" aria-invalid={Boolean(issue)}>
        <legend>{label}</legend>
        {field.type === 'core/select' ? (
          <select
            id={inputId}
            aria-label={field.label}
            value={typeof value === 'string' ? value : ''}
            onChange={(event) => onChange(event.target.value || null)}
          >
            <option value="">Select…</option>
            {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        ) : (
          <div className="record-radio-options">
            {options.map((option) => (
              <label key={option.value}>
                <input
                  type="radio"
                  name={inputId}
                  value={option.value}
                  checked={value === option.value}
                  onChange={() => onChange(option.value)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        )}
        {field.description || issue ? <small>{issue ?? field.description}</small> : null}
      </fieldset>
    );
  }

  if (definition.valueShape === 'boolean') {
    return (
      <label className="record-field record-field-toggle" htmlFor={inputId}>
        <input
          id={inputId}
          type="checkbox"
          checked={value === true}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span>
          <strong>{label}</strong>
          {field.description || issue ? <small>{issue ?? field.description}</small> : null}
        </span>
      </label>
    );
  }

  if (definition.valueShape === 'number') {
    const min = typeof field.config.min === 'number' ? field.config.min : undefined;
    const max = typeof field.config.max === 'number' ? field.config.max : undefined;
    const step = typeof field.config.step === 'number' ? field.config.step : 'any';
    return (
      <label className="record-field" htmlFor={inputId}>
        <span>{label}</span>
        <input
          id={inputId}
          type="number"
          min={min}
          max={max}
          step={step}
          aria-invalid={Boolean(issue)}
          aria-describedby={describedBy}
          value={typeof value === 'number' ? String(value) : ''}
          onChange={(event) => onChange(event.target.value === '' ? null : Number(event.target.value))}
        />
        {field.description || issue ? <small id={descriptionId}>{issue ?? field.description}</small> : null}
      </label>
    );
  }

  if (definition.valueShape === 'string') {
    const htmlType = field.type === 'core/email'
      ? 'email'
      : field.type === 'core/url'
        ? 'url'
        : field.type === 'core/phone'
          ? 'tel'
          : field.type === 'core/date'
            ? 'date'
            : field.type === 'core/time'
              ? 'time'
              : field.type === 'core/datetime'
                ? 'datetime-local'
                : field.type === 'core/color'
                  ? 'color'
                  : 'text';
    return (
      <label className="record-field" htmlFor={inputId}>
        <span>{label}</span>
        <input
          id={inputId}
          type={htmlType}
          aria-invalid={Boolean(issue)}
          aria-describedby={describedBy}
          placeholder={field.placeholder ?? undefined}
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => onChange(event.target.value || null)}
        />
        {field.description || issue ? <small id={descriptionId}>{issue ?? field.description}</small> : null}
      </label>
    );
  }

  return (
    <label className="record-field record-field-wide" htmlFor={inputId}>
      <span>{label} · JSON</span>
      <textarea
        key={jsonText(value)}
        id={inputId}
        rows={4}
        aria-invalid={Boolean(issue)}
        aria-describedby={describedBy}
        defaultValue={jsonText(value)}
        onBlur={(event) => {
          const text = event.target.value.trim();
          if (!text) {
            onChange(null);
            return;
          }
          try {
            onChange(JSON.parse(text) as JsonValue);
          } catch {
            // Preserve last valid canonical value. Core validation remains authoritative.
          }
        }}
      />
      <small id={descriptionId}>{issue ?? field.description || `${definition.metadata.label} uses portable JSON until its specialized editor is introduced.`}</small>
    </label>
  );
}

export function RecordEditor() {
  const session = useProjectSession();
  const contentTypes = useMemo(() => listContentTypeDefinitions(session.project), [session.project]);
  const fieldGroups = useMemo(() => listFieldGroupDefinitions(session.project, registry), [session.project]);
  const records = useMemo(() => listContentRecords(session.project, {}, registry), [session.project]);

  const [mode, setMode] = useState<EditorMode>('empty');
  const [draft, setDraft] = useState<ContentRecordDefinition | null>(null);
  const [status, setStatus] = useState<EditorStatus>(DEFAULT_STATUS);
  const [deleteArmed, setDeleteArmed] = useState(false);
  const [contentTypeFilter, setContentTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | ContentRecordStatus>('all');
  const [search, setSearch] = useState('');

  const visibleRecords = useMemo(() => listContentRecords(session.project, {
    ...(contentTypeFilter === 'all' ? {} : { contentTypeId: contentTypeFilter }),
    ...(statusFilter === 'all' ? {} : { status: statusFilter }),
    ...(search.trim() ? { search } : {}),
  }, registry), [contentTypeFilter, search, session.project, statusFilter]);

  const validation = draft ? validateContentRecordDefinition(draft, session.project, registry) : null;
  const issuesByPath = new Map(
    validation && !validation.ok ? validation.issues.map((issue) => [issue.path, issue.message]) : [],
  );
  const selectedContentType = draft
    ? contentTypes.find((contentType) => contentType.id === draft.contentTypeId) ?? null
    : null;
  const selectedGroups = draft
    ? draft.fieldGroupIds.flatMap((id) => fieldGroups.filter((group) => group.id === id))
    : [];

  const beginCreate = () => {
    if (contentTypes.length === 0) {
      setStatus({ tone: 'error', message: 'Create a Content Type before creating records.' });
      return;
    }
    const existing = new Set(Object.keys(session.project.records));
    const id = nextRecordId(existing);
    const initialContentType = contentTypeFilter !== 'all' && contentTypes.some((type) => type.id === contentTypeFilter)
      ? contentTypeFilter
      : contentTypes[0]!.id;
    setMode('create');
    setDraft(createDefaultContentRecordDefinition(session.project, initialContentType, id));
    setDeleteArmed(false);
    setStatus({ tone: 'idle', message: 'Create a record using the canonical content model and selected field schemas.' });
  };

  const selectRecord = (record: ContentRecordDefinition) => {
    setMode('edit');
    setDraft(structuredClone(record));
    setDeleteArmed(false);
    setStatus({ tone: 'idle', message: `Editing ${record.title || record.slug}.` });
  };

  const patchDraft = <K extends keyof ContentRecordDefinition>(key: K, value: ContentRecordDefinition[K]) => {
    setDraft((current) => current ? { ...current, [key]: value } : current);
    setDeleteArmed(false);
  };

  const changeCreateContentType = (contentTypeId: string) => {
    if (!draft || mode !== 'create') return;
    const reset = createDefaultContentRecordDefinition(session.project, contentTypeId, draft.id, draft.createdAt);
    setDraft({ ...reset, title: draft.title, slug: draft.slug });
  };

  const toggleFieldGroup = (group: FieldGroupDefinition, checked: boolean) => {
    setDraft((current) => {
      if (!current) return current;
      const ids = new Set(current.fieldGroupIds);
      const values = structuredClone(current.fieldValues);
      if (checked) {
        ids.add(group.id);
        values[group.id] ??= fieldGroupDefaults(group);
      } else {
        ids.delete(group.id);
        delete values[group.id];
      }
      return { ...current, fieldGroupIds: [...ids], fieldValues: values };
    });
    setDeleteArmed(false);
  };

  const updateFieldValue = (groupId: string, fieldName: string, value: JsonValue) => {
    setDraft((current) => {
      if (!current) return current;
      const fieldValues = structuredClone(current.fieldValues);
      fieldValues[groupId] = { ...(fieldValues[groupId] ?? {}), [fieldName]: value };
      return { ...current, fieldValues };
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
        ? `Created ${result.value.title || result.value.slug}.`
        : result.changed
          ? `Saved ${result.value.title || result.value.slug}.`
          : `No changes to save for ${result.value.title || result.value.slug}.`,
    });
  };

  const deleteDraft = () => {
    if (!draft || mode !== 'edit') return;
    if (!deleteArmed) {
      setDeleteArmed(true);
      setStatus({ tone: 'idle', message: `Confirm deletion of ${draft.title || draft.slug}.` });
      return;
    }
    const result = session.removeContentRecord(draft.id);
    if (!result.ok) {
      setDeleteArmed(false);
      setStatus({ tone: 'error', message: result.message });
      return;
    }
    setMode('empty');
    setDraft(null);
    setDeleteArmed(false);
    setStatus({ tone: 'success', message: `Deleted ${result.value.title || result.value.slug}.` });
  };

  const handleText =
    (key: 'id' | 'title' | 'slug' | 'excerpt' | 'content') =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => patchDraft(key, event.target.value);

  return (
    <section className="record-editor" aria-label="Records">
      <header className="record-editor-header">
        <div>
          <span className="record-editor-eyebrow">Dynamic content · MF-041</span>
          <h3>Records</h3>
          <p>Create and manage real local content with editorial status and schema-validated custom fields.</p>
        </div>
        <div className="record-editor-summary">
          <strong>{records.length}</strong><span>{records.length === 1 ? 'record' : 'records'}</span>
          <button type="button" onClick={beginCreate} disabled={contentTypes.length === 0}>New record</button>
        </div>
      </header>

      {contentTypes.length === 0 ? (
        <div className="record-prerequisite" role="status">
          <strong>Content Type required</strong>
          <span>Create a Content Type first. Records always belong to a canonical content model.</span>
        </div>
      ) : null}

      <div className="record-editor-grid">
        <aside className="record-list" aria-label="Record list">
          <div className="record-list-toolbar">
            <input aria-label="Search records" type="search" placeholder="Search records…" value={search} onChange={(event) => setSearch(event.target.value)} />
            <div className="record-filter-row">
              <select aria-label="Filter records by content type" value={contentTypeFilter} onChange={(event) => setContentTypeFilter(event.target.value)}>
                <option value="all">All content types</option>
                {contentTypes.map((contentType) => <option key={contentType.id} value={contentType.id}>{contentType.label}</option>)}
              </select>
              <select aria-label="Filter records by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'all' | ContentRecordStatus)}>
                <option value="all">All statuses</option>
                {CONTENT_RECORD_STATUSES.map((recordStatus) => <option key={recordStatus} value={recordStatus}>{recordStatus}</option>)}
              </select>
            </div>
          </div>
          <div className="record-list-heading"><span>Content</span><code>{visibleRecords.length}/{records.length}</code></div>
          {visibleRecords.length === 0 ? (
            <div className="record-empty-list"><strong>No matching records</strong><span>Create content or adjust the filters.</span></div>
          ) : (
            <div className="record-list-items">
              {visibleRecords.map((record) => {
                const contentType = contentTypes.find((item) => item.id === record.contentTypeId);
                const selected = mode === 'edit' && draft?.id === record.id;
                return (
                  <button key={record.id} type="button" className="record-list-item" data-selected={selected ? 'true' : 'false'} aria-pressed={selected} onClick={() => selectRecord(record)}>
                    <span className="record-list-item-main"><strong>{record.title || record.slug}</strong><code>/{record.slug}</code></span>
                    <span className="record-list-item-meta"><span>{contentType?.singularLabel ?? record.contentTypeId}</span><span data-status={record.status}>{record.status}</span></span>
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        <div className="record-detail">
          {!draft ? (
            <div className="record-detail-empty">
              <span aria-hidden="true">R</span>
              <strong>Select a record or create a new one</strong>
              <p>Core content, status and custom fields are edited in one contextual surface.</p>
              <button type="button" onClick={beginCreate} disabled={contentTypes.length === 0}>Create record</button>
            </div>
          ) : (
            <form className="record-form" onSubmit={(event) => { event.preventDefault(); saveDraft(); }}>
              <div className="record-form-toolbar">
                <div><span>{mode === 'create' ? 'New record' : 'Record editor'}</span><strong>{draft.title || draft.slug}</strong></div>
                <div className="record-form-actions">
                  {mode === 'edit' ? <button type="button" className="record-delete" data-armed={deleteArmed ? 'true' : 'false'} onClick={deleteDraft}>{deleteArmed ? 'Confirm delete' : 'Delete'}</button> : null}
                  <button type="submit" className="record-save" disabled={!validation?.ok}>{mode === 'create' ? 'Create record' : 'Save changes'}</button>
                </div>
              </div>

              <section className="record-form-section">
                <div className="record-form-section-heading"><strong>Identity & editorial state</strong><span>Stable record identity, route slug and publication state.</span></div>
                <div className="record-field-grid">
                  <label className="record-field"><span>Content Type</span><select aria-label="Record content type" value={draft.contentTypeId} disabled={mode === 'edit'} onChange={(event) => changeCreateContentType(event.target.value)}>{contentTypes.map((contentType) => <option key={contentType.id} value={contentType.id}>{contentType.label}</option>)}</select><small>{mode === 'edit' ? 'Content Type is fixed after creation in this editor.' : 'Select the model before adding field groups.'}</small></label>
                  <label className="record-field"><span>Status</span><select aria-label="Record status" value={draft.status} onChange={(event) => patchDraft('status', event.target.value as ContentRecordStatus)}>{CONTENT_RECORD_STATUSES.map((recordStatus) => <option key={recordStatus} value={recordStatus}>{recordStatus}</option>)}</select></label>
                  <label className="record-field"><span>ID</span><input aria-label="Record ID" value={draft.id} disabled={mode === 'edit'} onChange={handleText('id')} aria-invalid={issuesByPath.has('id')} /><small>{issuesByPath.get('id') ?? 'Immutable after creation · kebab-case'}</small></label>
                  <label className="record-field"><span>Slug</span><input aria-label="Record slug" value={draft.slug} onChange={handleText('slug')} aria-invalid={issuesByPath.has('slug')} /><small>{issuesByPath.get('slug') ?? 'Unique inside this Content Type'}</small></label>
                  {selectedContentType?.supports.title ? <label className="record-field record-field-wide"><span>Title</span><input aria-label="Record title" value={draft.title} onChange={handleText('title')} aria-invalid={issuesByPath.has('title')} /><small>{issuesByPath.get('title') ?? 'Primary editorial title'}</small></label> : null}
                  {selectedContentType?.supports.excerpt ? <label className="record-field record-field-wide"><span>Excerpt</span><textarea aria-label="Record excerpt" rows={3} value={draft.excerpt} onChange={handleText('excerpt')} aria-invalid={issuesByPath.has('excerpt')} /></label> : null}
                  {selectedContentType?.supports.editor ? <label className="record-field record-field-wide"><span>Content</span><textarea aria-label="Record content" rows={8} value={draft.content} onChange={handleText('content')} aria-invalid={issuesByPath.has('content')} /></label> : null}
                </div>
              </section>

              <section className="record-form-section">
                <div className="record-form-section-heading"><strong>Field groups</strong><span>Attach reusable schemas to this record. Advanced field runtimes remain reserved for later microphases.</span></div>
                {fieldGroups.length === 0 ? <div className="record-scope-note">No Field Groups exist yet. The record can still use its core Content Type fields.</div> : (
                  <div className="record-group-picker" aria-label="Record field groups">
                    {fieldGroups.map((group) => <label key={group.id}><input type="checkbox" checked={draft.fieldGroupIds.includes(group.id)} onChange={(event) => toggleFieldGroup(group, event.target.checked)} /><span><strong>{group.label}</strong><small>{group.fields.length} {group.fields.length === 1 ? 'field' : 'fields'} · {group.presentation}</small></span></label>)}
                  </div>
                )}
              </section>

              {selectedGroups.map((group) => (
                <section className="record-form-section record-custom-group" key={group.id} aria-label={`Custom fields ${group.label}`}>
                  <div className="record-form-section-heading"><strong>{group.label}</strong><span>{group.description || `${group.fields.length} schema-validated custom fields`}</span></div>
                  {group.fields.length === 0 ? <div className="record-scope-note">This group currently has no fields.</div> : (
                    <div className="record-field-grid">
                      {group.fields.map((field) => (
                        <RecordFieldControl
                          key={field.id}
                          groupId={group.id}
                          field={field}
                          value={draft.fieldValues[group.id]?.[field.name] ?? field.defaultValue}
                          {...(issuesByPath.get(`fieldValues.${group.id}.${field.name}`) ? { issue: issuesByPath.get(`fieldValues.${group.id}.${field.name}`)! } : {})}
                          onChange={(value) => updateFieldValue(group.id, field.name, value)}
                        />
                      ))}
                    </div>
                  )}
                </section>
              ))}

              {validation && !validation.ok ? <div className="record-validation-summary" role="alert"><strong>Resolve {validation.issues.length} validation {validation.issues.length === 1 ? 'issue' : 'issues'} before saving.</strong></div> : null}
            </form>
          )}
        </div>
      </div>

      <div className="record-editor-status" data-tone={status.tone} aria-live="polite"><span>{status.message}</span><code>{session.saveState}</code></div>
    </section>
  );
}
