import { useMemo, useState, type ChangeEvent } from 'react';
import {
  CONTENT_RECORD_STATUSES,
  createDefaultContentRecordDefinition,
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
import './records-editor.css';

type EditorMode = 'empty' | 'create' | 'edit';
type StatusTone = 'idle' | 'success' | 'error';

interface EditorStatus {
  tone: StatusTone;
  message: string;
}

const DEFAULT_STATUS: EditorStatus = {
  tone: 'idle',
  message: 'Records use the canonical project store and validate custom values against the Field Type Registry.',
};

function nextRecordId(existingIds: ReadonlySet<string>, contentTypeId: string): string {
  const base = `${contentTypeId}-record`;
  if (!existingIds.has(base)) return base;
  let index = 2;
  while (existingIds.has(`${base}-${index}`)) index += 1;
  return `${base}-${index}`;
}

function defaultGroupValues(group: FieldGroupDefinition): JsonObject {
  return Object.fromEntries(
    group.fields.map((field) => [field.name, structuredClone(field.defaultValue)]),
  ) as JsonObject;
}

function displayValue(value: JsonValue | undefined): string {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  return JSON.stringify(value);
}

function FieldValueControl({
  field,
  value,
  onChange,
}: {
  field: CustomFieldDefinition;
  value: JsonValue | undefined;
  onChange(value: JsonValue): void;
}) {
  const type = field.type;
  const inputId = `record-field-${field.id}`;

  if (type === 'core/textarea' || type === 'core/rich-text') {
    return (
      <textarea
        id={inputId}
        aria-label={field.label}
        rows={type === 'core/rich-text' ? 6 : 3}
        placeholder={field.placeholder ?? undefined}
        value={displayValue(value)}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  if (type === 'core/number' || type === 'core/currency') {
    const min = typeof field.config.min === 'number' ? field.config.min : undefined;
    const max = typeof field.config.max === 'number' ? field.config.max : undefined;
    const step = typeof field.config.step === 'number' ? field.config.step : 'any';
    return (
      <input
        id={inputId}
        aria-label={field.label}
        type="number"
        {...(min === undefined ? {} : { min })}
        {...(max === undefined ? {} : { max })}
        step={step}
        value={typeof value === 'number' ? value : ''}
        onChange={(event) => onChange(event.target.value === '' ? null : Number(event.target.value))}
      />
    );
  }

  if (type === 'core/checkbox' || type === 'core/switch') {
    return (
      <label className="record-boolean-control" htmlFor={inputId}>
        <input
          id={inputId}
          aria-label={field.label}
          type="checkbox"
          checked={value === true}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span>{value === true ? 'Enabled' : 'Disabled'}</span>
      </label>
    );
  }

  if (type === 'core/select' || type === 'core/radio') {
    const options = Array.isArray(field.config.options)
      ? field.config.options.filter(
          (option): option is JsonObject => isJsonObject(option) && typeof option.value === 'string' && typeof option.label === 'string',
        )
      : [];
    return (
      <select
        id={inputId}
        aria-label={field.label}
        value={typeof value === 'string' ? value : ''}
        onChange={(event) => onChange(event.target.value || null)}
      >
        <option value="">Select…</option>
        {options.map((option) => (
          <option key={String(option.value)} value={String(option.value)}>{String(option.label)}</option>
        ))}
      </select>
    );
  }

  if (type === 'core/gallery') {
    return (
      <input
        id={inputId}
        aria-label={field.label}
        type="text"
        placeholder="asset-1, asset-2"
        value={Array.isArray(value) ? value.join(', ') : ''}
        onChange={(event) => {
          const ids = event.target.value.split(',').map((item) => item.trim()).filter(Boolean);
          onChange(ids);
        }}
      />
    );
  }

  if (type === 'core/map') {
    const point = isJsonObject(value) ? value : {};
    const lat = typeof point.lat === 'number' ? point.lat : '';
    const lng = typeof point.lng === 'number' ? point.lng : '';
    const updatePoint = (key: 'lat' | 'lng', raw: string) => {
      const next: JsonObject = { ...point };
      if (raw === '') delete next[key];
      else next[key] = Number(raw);
      onChange(Object.keys(next).length === 0 ? null : next);
    };
    return (
      <div className="record-map-control">
        <input
          aria-label={`${field.label} latitude`}
          type="number"
          min={-90}
          max={90}
          step="any"
          placeholder="Latitude"
          value={lat}
          onChange={(event) => updatePoint('lat', event.target.value)}
        />
        <input
          aria-label={`${field.label} longitude`}
          type="number"
          min={-180}
          max={180}
          step="any"
          placeholder="Longitude"
          value={lng}
          onChange={(event) => updatePoint('lng', event.target.value)}
        />
      </div>
    );
  }

  const htmlType = type === 'core/email'
    ? 'email'
    : type === 'core/url'
      ? 'url'
      : type === 'core/date'
        ? 'date'
        : type === 'core/time'
          ? 'time'
          : type === 'core/datetime'
            ? 'datetime-local'
            : type === 'core/color'
              ? 'color'
              : 'text';

  return (
    <input
      id={inputId}
      aria-label={field.label}
      type={htmlType}
      placeholder={field.placeholder ?? (type === 'core/image' || type === 'core/file' ? 'Local media asset id' : undefined)}
      value={displayValue(value)}
      onChange={(event) => onChange(event.target.value || null)}
    />
  );
}

export function RecordsEditor() {
  const session = useProjectSession();
  const contentTypes = useMemo(() => listContentTypeDefinitions(session.project), [session.project]);
  const fieldGroups = useMemo(() => listFieldGroupDefinitions(session.project), [session.project]);
  const allRecords = useMemo(() => listContentRecords(session.project), [session.project]);
  const [mode, setMode] = useState<EditorMode>('empty');
  const [draft, setDraft] = useState<ContentRecordDefinition | null>(null);
  const [search, setSearch] = useState('');
  const [contentTypeFilter, setContentTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | ContentRecordStatus>('all');
  const [status, setStatus] = useState<EditorStatus>(DEFAULT_STATUS);
  const [deleteArmed, setDeleteArmed] = useState(false);

  const records = useMemo(
    () => listContentRecords(session.project, {
      ...(contentTypeFilter === 'all' ? {} : { contentTypeId: contentTypeFilter }),
      ...(statusFilter === 'all' ? {} : { status: statusFilter }),
      ...(search.trim() ? { search } : {}),
    }),
    [contentTypeFilter, search, session.project, statusFilter],
  );

  const validation = draft ? validateContentRecordDefinition(draft, session.project) : null;
  const issueByPath = new Map(
    validation && !validation.ok ? validation.issues.map((issue) => [issue.path, issue.message]) : [],
  );
  const activeContentType = draft
    ? contentTypes.find((contentType) => contentType.id === draft.contentTypeId) ?? null
    : null;
  const selectedGroups = draft
    ? draft.fieldGroupIds
        .map((id) => fieldGroups.find((group) => group.id === id))
        .filter((group): group is FieldGroupDefinition => Boolean(group))
    : [];

  const beginCreate = () => {
    const preferred = contentTypeFilter !== 'all'
      ? contentTypes.find((contentType) => contentType.id === contentTypeFilter)
      : contentTypes[0];
    if (!preferred) {
      setStatus({ tone: 'error', message: 'Create a Content Type before creating records.' });
      return;
    }
    const id = nextRecordId(new Set(allRecords.map((record) => record.id)), preferred.id);
    setDraft(createDefaultContentRecordDefinition(session.project, preferred.id, id));
    setMode('create');
    setDeleteArmed(false);
    setStatus({ tone: 'idle', message: `Creating a ${preferred.singularLabel} record.` });
  };

  const selectRecord = (record: ContentRecordDefinition) => {
    setDraft(structuredClone(record));
    setMode('edit');
    setDeleteArmed(false);
    setStatus({ tone: 'idle', message: `Editing ${record.title || record.id}.` });
  };

  const patchDraft = <K extends keyof ContentRecordDefinition>(key: K, value: ContentRecordDefinition[K]) => {
    setDraft((current) => current ? { ...current, [key]: value } : current);
    setDeleteArmed(false);
  };

  const changeCreateContentType = (contentTypeId: string) => {
    if (mode !== 'create') return;
    const id = draft?.id ?? nextRecordId(new Set(allRecords.map((record) => record.id)), contentTypeId);
    const fresh = createDefaultContentRecordDefinition(session.project, contentTypeId, id);
    setDraft(fresh);
    setDeleteArmed(false);
  };

  const toggleFieldGroup = (group: FieldGroupDefinition, checked: boolean) => {
    setDraft((current) => {
      if (!current) return current;
      if (checked && !current.fieldGroupIds.includes(group.id)) {
        return {
          ...current,
          fieldGroupIds: [...current.fieldGroupIds, group.id],
          fieldValues: { ...current.fieldValues, [group.id]: defaultGroupValues(group) },
        };
      }
      if (!checked) {
        const fieldValues = { ...current.fieldValues };
        delete fieldValues[group.id];
        return {
          ...current,
          fieldGroupIds: current.fieldGroupIds.filter((id) => id !== group.id),
          fieldValues,
        };
      }
      return current;
    });
    setDeleteArmed(false);
  };

  const patchFieldValue = (groupId: string, fieldName: string, value: JsonValue) => {
    setDraft((current) => {
      if (!current) return current;
      return {
        ...current,
        fieldValues: {
          ...current.fieldValues,
          [groupId]: {
            ...(current.fieldValues[groupId] ?? {}),
            [fieldName]: structuredClone(value),
          },
        },
      };
    });
    setDeleteArmed(false);
  };

  const saveDraft = () => {
    if (!draft || !validation?.ok) return;
    const candidate = mode === 'create'
      ? draft
      : { ...draft, updatedAt: new Date().toISOString() };
    const result = mode === 'create'
      ? session.createContentRecord(candidate)
      : session.updateContentRecord(candidate.id, candidate);
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
        ? `Created ${result.value.title || result.value.id}.`
        : result.changed
          ? `Saved ${result.value.title || result.value.id}.`
          : `No changes to save for ${result.value.title || result.value.id}.`,
    });
  };

  const deleteDraft = () => {
    if (!draft || mode !== 'edit') return;
    if (!deleteArmed) {
      setDeleteArmed(true);
      setStatus({ tone: 'idle', message: `Confirm deletion of ${draft.title || draft.id}.` });
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
    setStatus({ tone: 'success', message: `Deleted ${result.value.title || result.value.id}.` });
  };

  return (
    <section className="records-editor" aria-label="Records">
      <header className="records-editor-header">
        <div>
          <span className="records-editor-eyebrow">Dynamic content · MF-041</span>
          <h3>Content Records</h3>
          <p>Create and edit local content records against real CPT and Custom Field schemas.</p>
        </div>
        <div className="records-editor-summary">
          <strong>{allRecords.length}</strong>
          <span>{allRecords.length === 1 ? 'record' : 'records'}</span>
          <button type="button" onClick={beginCreate} disabled={contentTypes.length === 0}>New record</button>
        </div>
      </header>

      <div className="records-filters" aria-label="Record filters">
        <label>
          <span>Search</span>
          <input aria-label="Search records" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Title or slug" />
        </label>
        <label>
          <span>Content Type</span>
          <select aria-label="Filter records by content type" value={contentTypeFilter} onChange={(event) => setContentTypeFilter(event.target.value)}>
            <option value="all">All content types</option>
            {contentTypes.map((contentType) => <option key={contentType.id} value={contentType.id}>{contentType.label}</option>)}
          </select>
        </label>
        <label>
          <span>Status</span>
          <select aria-label="Filter records by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'all' | ContentRecordStatus)}>
            <option value="all">All statuses</option>
            {CONTENT_RECORD_STATUSES.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
      </div>

      <div className="records-editor-grid">
        <aside className="records-list" aria-label="Record list">
          <div className="records-list-heading"><span>Records</span><code>{records.length}</code></div>
          {records.length === 0 ? (
            <div className="records-empty-list"><strong>No records match</strong><span>Create content or adjust the current filters.</span></div>
          ) : (
            <div className="records-list-items">
              {records.map((record) => {
                const contentType = contentTypes.find((candidate) => candidate.id === record.contentTypeId);
                const selected = mode === 'edit' && draft?.id === record.id;
                return (
                  <button key={record.id} type="button" className="record-list-item" data-selected={selected ? 'true' : 'false'} aria-pressed={selected} onClick={() => selectRecord(record)}>
                    <span className="record-list-main"><strong>{record.title || record.id}</strong><code>/{record.slug}</code></span>
                    <span className="record-list-meta"><span>{contentType?.singularLabel ?? record.contentTypeId}</span><span data-status={record.status}>{record.status}</span></span>
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
              <p>The editor resolves its schema from the selected CPT and field groups.</p>
              <button type="button" onClick={beginCreate} disabled={contentTypes.length === 0}>Create record</button>
            </div>
          ) : (
            <form className="record-form" onSubmit={(event) => { event.preventDefault(); saveDraft(); }}>
              <div className="record-form-toolbar">
                <div><span>{mode === 'create' ? 'New record' : 'Record editor'}</span><strong>{draft.title || draft.id}</strong></div>
                <div className="record-form-actions">
                  {mode === 'edit' ? <button type="button" className="record-delete" data-armed={deleteArmed ? 'true' : 'false'} onClick={deleteDraft}>{deleteArmed ? 'Confirm delete' : 'Delete'}</button> : null}
                  <button type="submit" className="record-save" disabled={!validation?.ok}>{mode === 'create' ? 'Create record' : 'Save changes'}</button>
                </div>
              </div>

              <section className="record-form-section">
                <div className="record-section-heading"><strong>Identity & workflow</strong><span>Stable record identity, route slug and editorial status.</span></div>
                <div className="record-field-grid">
                  <label className="record-field"><span>ID</span><input aria-label="Record ID" value={draft.id} disabled={mode === 'edit'} onChange={(event) => patchDraft('id', event.target.value)} aria-invalid={issueByPath.has('id')} /><small>{issueByPath.get('id') ?? 'Immutable after creation'}</small></label>
                  <label className="record-field"><span>Content Type</span><select aria-label="Record content type" value={draft.contentTypeId} disabled={mode === 'edit'} onChange={(event) => changeCreateContentType(event.target.value)}>{contentTypes.map((contentType) => <option key={contentType.id} value={contentType.id}>{contentType.label}</option>)}</select><small>Schema context is fixed after creation.</small></label>
                  <label className="record-field"><span>Status</span><select aria-label="Record status" value={draft.status} onChange={(event) => patchDraft('status', event.target.value as ContentRecordStatus)}>{CONTENT_RECORD_STATUSES.map((value) => <option key={value} value={value}>{value}</option>)}</select><small>Draft, published or archived.</small></label>
                  <label className="record-field"><span>Slug</span><input aria-label="Record slug" value={draft.slug} onChange={(event) => patchDraft('slug', event.target.value)} aria-invalid={issueByPath.has('slug')} /><small>{issueByPath.get('slug') ?? 'Unique within its Content Type'}</small></label>
                </div>
              </section>

              <section className="record-form-section">
                <div className="record-section-heading"><strong>Core content</strong><span>Visibility follows the supports enabled by the selected Content Type.</span></div>
                <div className="record-field-grid">
                  {activeContentType?.supports.title ? <label className="record-field record-field--wide"><span>Title</span><input aria-label="Record title" value={draft.title} onChange={(event) => patchDraft('title', event.target.value)} aria-invalid={issueByPath.has('title')} /><small>{issueByPath.get('title') ?? 'Primary content title'}</small></label> : null}
                  {activeContentType?.supports.editor ? <label className="record-field record-field--wide"><span>Content</span><textarea aria-label="Record content" rows={6} value={draft.content} onChange={(event) => patchDraft('content', event.target.value)} /><small>Main content body</small></label> : null}
                  {activeContentType?.supports.excerpt ? <label className="record-field record-field--wide"><span>Excerpt</span><textarea aria-label="Record excerpt" rows={3} value={draft.excerpt} onChange={(event) => patchDraft('excerpt', event.target.value)} /><small>Short summary</small></label> : null}
                  {activeContentType?.supports.featuredImage ? <div className="record-scope-note">Featured image is supported by this CPT. Media binding remains owned by the Media Library phase; MF-041 does not fake a file picker.</div> : null}
                </div>
              </section>

              <section className="record-form-section">
                <div className="record-section-heading"><strong>Field Groups</strong><span>Select reusable schemas that apply to this record context.</span></div>
                {fieldGroups.length === 0 ? <div className="record-scope-note">No Custom Field Groups exist yet. Records can still use core content fields.</div> : (
                  <div className="record-group-selector" aria-label="Record field groups">
                    {fieldGroups.map((group) => <label key={group.id}><input type="checkbox" checked={draft.fieldGroupIds.includes(group.id)} onChange={(event) => toggleFieldGroup(group, event.target.checked)} /><span><strong>{group.label}</strong><small>{group.fields.length} {group.fields.length === 1 ? 'field' : 'fields'} · {group.presentation}</small></span></label>)}
                  </div>
                )}
              </section>

              {selectedGroups.map((group) => (
                <section className="record-form-section" key={group.id}>
                  <div className="record-section-heading"><strong>{group.label}</strong><span>{group.description || `${group.fields.length} custom fields`}</span></div>
                  {group.fields.length === 0 ? <div className="record-scope-note">This field group has no fields yet.</div> : (
                    <div className="record-custom-fields">
                      {group.fields.map((field) => {
                        const path = `fieldValues.${group.id}.${field.name}`;
                        const value = draft.fieldValues[group.id]?.[field.name];
                        return <label className="record-field" key={field.id}><span>{field.label}{field.required ? ' *' : ''}</span><FieldValueControl field={field} value={value} onChange={(next) => patchFieldValue(group.id, field.name, next)} /><small data-error={issueByPath.has(path) ? 'true' : 'false'}>{issueByPath.get(path) ?? field.description ?? `${field.type}@${field.typeVersion}`}</small></label>;
                      })}
                    </div>
                  )}
                </section>
              ))}

              {validation && !validation.ok ? <div className="record-validation-summary" role="alert"><strong>Resolve {validation.issues.length} validation {validation.issues.length === 1 ? 'issue' : 'issues'} before saving.</strong></div> : null}
            </form>
          )}
        </div>
      </div>

      <div className="records-editor-status" data-tone={status.tone} aria-live="polite"><span>{status.message}</span><code>{session.saveState}</code></div>
    </section>
  );
}
