import { useMemo, useState } from 'react';
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
import type { JsonObject, JsonValue } from '../../core/domain';
import { Icon } from '../components/Icon';
import { useProjectSession } from '../project/project-session-context';

interface RecordsCrudPanelProps {
  query: string;
}

function nextRecordId(contentTypeId: string, existingIds: ReadonlySet<string>): string {
  const base = `${contentTypeId}-record`;
  if (!existingIds.has(base)) return base;
  let index = 2;
  while (existingIds.has(`${base}-${index}`)) index += 1;
  return `${base}-${index}`;
}

function createDraft(project: Parameters<typeof createDefaultContentRecordDefinition>[0], contentTypeId: string): ContentRecordDefinition {
  const id = nextRecordId(contentTypeId, new Set(Object.keys(project.records)));
  return createDefaultContentRecordDefinition(project, contentTypeId, id);
}

function groupValues(record: ContentRecordDefinition, groupId: string): JsonObject {
  return record.fieldValues[groupId] ?? {};
}

function updateGroupValue(
  record: ContentRecordDefinition,
  groupId: string,
  fieldName: string,
  value: JsonValue,
): ContentRecordDefinition {
  return {
    ...record,
    fieldValues: {
      ...record.fieldValues,
      [groupId]: {
        ...groupValues(record, groupId),
        [fieldName]: structuredClone(value),
      },
    },
  };
}

function RecordFieldEditor({
  group,
  field,
  draft,
  onChange,
}: {
  group: FieldGroupDefinition;
  field: CustomFieldDefinition;
  draft: ContentRecordDefinition;
  onChange(next: ContentRecordDefinition): void;
}) {
  const registry = useMemo(() => createDefaultFieldTypeRegistry(), []);
  const definition = registry.resolve(field.type, field.typeVersion);
  const stored = groupValues(draft, group.id)[field.name];
  const value = stored === undefined ? field.defaultValue : stored;
  const label = `${field.label}${field.required ? ' *' : ''}`;

  if (definition.valueShape === 'string') {
    const multiline = field.type === 'core/textarea' || field.type === 'core/rich-text';
    return (
      <label className="block text-[10px] font-semibold text-[var(--color-ec-text-muted)]">
        <span className="mb-1 flex items-center justify-between gap-2"><span>{label}</span><small className="font-mono font-normal opacity-70">{field.name}</small></span>
        {multiline ? (
          <textarea
            className="ec-control min-h-20 w-full resize-y px-2.5 py-2 text-[10px]"
            aria-label={field.label}
            placeholder={field.placeholder ?? undefined}
            value={typeof value === 'string' ? value : ''}
            onChange={(event) => onChange(updateGroupValue(draft, group.id, field.name, event.target.value))}
          />
        ) : (
          <input
            className="ec-control h-8 w-full px-2 text-[10px]"
            aria-label={field.label}
            placeholder={field.placeholder ?? undefined}
            value={typeof value === 'string' ? value : ''}
            onChange={(event) => onChange(updateGroupValue(draft, group.id, field.name, event.target.value))}
          />
        )}
        {field.description ? <small className="mt-1 block font-normal leading-4">{field.description}</small> : null}
      </label>
    );
  }

  if (definition.valueShape === 'number') {
    return (
      <label className="block text-[10px] font-semibold text-[var(--color-ec-text-muted)]">
        <span className="mb-1 flex items-center justify-between gap-2"><span>{label}</span><small className="font-mono font-normal opacity-70">{field.name}</small></span>
        <input
          className="ec-control h-8 w-full px-2 text-[10px]"
          aria-label={field.label}
          type="number"
          step="any"
          value={typeof value === 'number' ? String(value) : ''}
          onChange={(event) => onChange(updateGroupValue(draft, group.id, field.name, event.target.value === '' ? null : Number(event.target.value)))}
        />
      </label>
    );
  }

  if (definition.valueShape === 'boolean') {
    return (
      <label className="flex min-h-9 items-center gap-2 rounded-[var(--ec-radius-sm)] border border-[var(--color-ec-border)] px-2.5 text-[10px] font-semibold text-[var(--color-ec-text)]">
        <input
          type="checkbox"
          aria-label={field.label}
          checked={value === true}
          onChange={(event) => onChange(updateGroupValue(draft, group.id, field.name, event.target.checked))}
        />
        <span>{label}</span>
        <small className="ml-auto font-mono font-normal text-[var(--color-ec-text-muted)]">{field.name}</small>
      </label>
    );
  }

  return (
    <label className="block text-[10px] font-semibold text-[var(--color-ec-text-muted)]">
      <span className="mb-1 flex items-center justify-between gap-2"><span>{label} · JSON</span><small className="font-mono font-normal opacity-70">{field.name}</small></span>
      <textarea
        key={JSON.stringify(value)}
        className="ec-control min-h-20 w-full resize-y px-2.5 py-2 font-mono text-[9px]"
        aria-label={field.label}
        defaultValue={JSON.stringify(value, null, 2)}
        onBlur={(event) => {
          try {
            onChange(updateGroupValue(draft, group.id, field.name, JSON.parse(event.target.value) as JsonValue));
          } catch {
            // Keep last valid portable value; canonical validation remains authoritative.
          }
        }}
      />
    </label>
  );
}

export function RecordsCrudPanel({ query }: RecordsCrudPanelProps) {
  const session = useProjectSession();
  const registry = useMemo(() => createDefaultFieldTypeRegistry(), []);
  const contentTypes = useMemo(() => listContentTypeDefinitions(session.project), [session.project]);
  const fieldGroups = useMemo(() => listFieldGroupDefinitions(session.project, registry), [registry, session.project]);
  const [contentTypeFilter, setContentTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContentRecordStatus | ''>('');
  const records = useMemo(
    () => listContentRecords(session.project, {
      ...(contentTypeFilter ? { contentTypeId: contentTypeFilter } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(query.trim() ? { search: query } : {}),
    }, registry),
    [contentTypeFilter, query, registry, session.project, statusFilter],
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<ContentRecordDefinition | null>(null);
  const [message, setMessage] = useState<{ tone: 'error' | 'success'; text: string } | null>(null);
  const [deleteArmed, setDeleteArmed] = useState(false);

  const selected = selectedId ? listContentRecords(session.project, {}, registry).find((record) => record.id === selectedId) ?? null : null;
  const contentType = draft ? contentTypes.find((definition) => definition.id === draft.contentTypeId) ?? null : null;
  const validation = draft ? validateContentRecordDefinition(draft, session.project, registry) : null;
  const validationIssues = validation && !validation.ok ? validation.issues : [];

  const beginCreate = () => {
    const first = contentTypes[0];
    if (!first) return;
    setCreating(true);
    setSelectedId(null);
    setDraft(createDraft(session.project, first.id));
    setMessage(null);
    setDeleteArmed(false);
  };

  const selectRecord = (record: ContentRecordDefinition) => {
    setCreating(false);
    setSelectedId(record.id);
    setDraft(structuredClone(record));
    setMessage(null);
    setDeleteArmed(false);
  };

  const updateDraft = <K extends keyof ContentRecordDefinition>(key: K, value: ContentRecordDefinition[K]) => {
    setDraft((current) => current ? { ...current, [key]: value } : current);
    setMessage(null);
  };

  const changeContentType = (contentTypeId: string) => {
    if (!creating) return;
    setDraft(createDraft(session.project, contentTypeId));
    setMessage(null);
  };

  const toggleFieldGroup = (group: FieldGroupDefinition, checked: boolean) => {
    setDraft((current) => {
      if (!current) return current;
      if (checked) {
        if (current.fieldGroupIds.includes(group.id)) return current;
        return {
          ...current,
          fieldGroupIds: [...current.fieldGroupIds, group.id],
          fieldValues: { ...current.fieldValues, [group.id]: current.fieldValues[group.id] ?? {} },
        };
      }
      const fieldValues = { ...current.fieldValues };
      delete fieldValues[group.id];
      return { ...current, fieldGroupIds: current.fieldGroupIds.filter((id) => id !== group.id), fieldValues };
    });
    setMessage(null);
  };

  const save = () => {
    if (!draft) return;
    const result = creating
      ? session.createContentRecord(draft)
      : selected
        ? session.updateContentRecord(selected.id, draft)
        : null;
    if (!result) return;
    if (!result.ok) {
      setMessage({ tone: 'error', text: result.message });
      return;
    }
    setCreating(false);
    setSelectedId(result.value.id);
    setDraft(structuredClone(result.value));
    setMessage({ tone: 'success', text: result.changed ? 'Record saved.' : 'No changes to save.' });
  };

  const remove = () => {
    if (!selected) return;
    if (!deleteArmed) {
      setDeleteArmed(true);
      setMessage(null);
      return;
    }
    const result = session.removeContentRecord(selected.id);
    if (!result.ok) {
      setDeleteArmed(false);
      setMessage({ tone: 'error', text: result.message });
      return;
    }
    setDeleteArmed(false);
    setSelectedId(null);
    setDraft(null);
    setMessage({ tone: 'success', text: `Deleted ${selected.title || selected.slug}.` });
  };

  const feedback = message ? (
    <div role={message.tone === 'error' ? 'alert' : 'status'} className={`rounded-[var(--ec-radius-md)] border px-3 py-2 text-[10px] ${message.tone === 'error' ? 'border-[var(--color-ec-danger-600)] text-[var(--color-ec-danger-600)]' : 'border-[var(--color-ec-success-600)] text-[var(--color-ec-success-600)]'}`}>{message.text}</div>
  ) : null;

  return (
    <div className="grid min-h-0 flex-1 gap-3 xl:grid-cols-[minmax(0,1fr)_560px]">
      <div className="min-h-0 overflow-y-auto">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <select className="ec-control h-8 min-w-36 px-2 text-[10px]" aria-label="Filter records by content type" value={contentTypeFilter} onChange={(event) => setContentTypeFilter(event.target.value)}>
            <option value="">All content types</option>
            {contentTypes.map((definition) => <option key={definition.id} value={definition.id}>{definition.label}</option>)}
          </select>
          <select className="ec-control h-8 min-w-32 px-2 text-[10px]" aria-label="Filter records by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as ContentRecordStatus | '')}>
            <option value="">All statuses</option>
            {CONTENT_RECORD_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <span className="text-[10px] font-semibold text-[var(--color-ec-text-muted)]">{records.length} record{records.length === 1 ? '' : 's'}</span>
          <button type="button" className="ec-control ec-focus-ring ml-auto inline-flex h-8 items-center gap-1.5 px-2.5 text-[11px] font-semibold disabled:cursor-not-allowed disabled:opacity-50" disabled={contentTypes.length === 0} onClick={beginCreate}><Icon name="plus" size={12} />New record</button>
        </div>

        {records.length ? (
          <div className="overflow-hidden rounded-[var(--ec-radius-lg)] border border-[var(--color-ec-border)] bg-[var(--color-ec-surface)] shadow-[var(--ec-shadow-panel)]">
            <div className="grid min-h-9 grid-cols-[minmax(160px,1.2fr)_minmax(110px,.8fr)_90px_110px] items-center gap-3 border-b border-[var(--color-ec-border)] bg-[var(--color-ec-surface-subtle)] px-3 text-[8px] font-bold uppercase tracking-[.1em] text-[var(--color-ec-text-muted)]"><span>Record</span><span>Content type</span><span>Status</span><span>Updated</span></div>
            {records.map((record) => {
              const typeLabel = contentTypes.find((definition) => definition.id === record.contentTypeId)?.label ?? record.contentTypeId;
              return (
                <button key={record.id} type="button" className="grid min-h-12 w-full grid-cols-[minmax(160px,1.2fr)_minmax(110px,.8fr)_90px_110px] items-center gap-3 border-b border-[var(--color-ec-border)] px-3 text-left last:border-0 hover:bg-[var(--color-ec-surface-subtle)] data-[active=true]:bg-[var(--color-ec-accent-soft)]" data-active={!creating && selected?.id === record.id ? 'true' : 'false'} aria-label={`${record.title || record.slug} ${record.slug} ${record.status}`} onClick={() => selectRecord(record)}>
                  <span className="min-w-0"><strong className="block truncate text-[10px] text-[var(--color-ec-text)]">{record.title || record.slug}</strong><small className="font-mono text-[8px] text-[var(--color-ec-text-muted)]">{record.id}</small></span>
                  <span className="truncate text-[9px] text-[var(--color-ec-text-muted)]">{typeLabel}</span>
                  <span className="text-[9px] font-semibold capitalize text-[var(--color-ec-text-muted)]">{record.status}</span>
                  <time className="text-[8px] text-[var(--color-ec-text-muted)]">{new Date(record.updatedAt).toLocaleDateString()}</time>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="grid min-h-64 place-items-center rounded-[var(--ec-radius-lg)] border border-dashed border-[var(--color-ec-border)] bg-[var(--color-ec-surface-subtle)] text-center">
            <div><Icon name="list" size={22} /><strong className="mt-3 block text-[12px] text-[var(--color-ec-text)]">{Object.keys(session.project.records).length ? 'No records match' : 'No records yet'}</strong><p className="mt-1 text-[10px] text-[var(--color-ec-text-muted)]">{contentTypes.length ? 'Create a canonical record or change the active filters.' : 'Create a Content Type before adding records.'}</p></div>
          </div>
        )}
      </div>

      <aside className="min-h-0 overflow-y-auto rounded-[var(--ec-radius-lg)] border border-[var(--color-ec-border)] bg-[var(--color-ec-surface)] shadow-[var(--ec-shadow-panel)]" aria-label="Record editor">
        <header className="border-b border-[var(--color-ec-border)] px-3 py-3"><span className="text-[9px] font-bold uppercase tracking-[.12em] text-[var(--color-ec-accent)]">{creating ? 'Create' : selected ? 'Edit' : 'Records'}</span><strong className="mt-1 block text-[13px] text-[var(--color-ec-text)]">{draft ? draft.title || draft.slug : 'Select or create a record'}</strong></header>
        {message && !draft ? <div className="p-3 pb-0">{feedback}</div> : null}
        {draft ? (
          <div className="space-y-4 p-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="text-[10px] font-semibold text-[var(--color-ec-text-muted)]"><span className="mb-1 block">ID</span><input className="ec-control h-8 w-full px-2 text-[10px]" aria-label="Record ID" value={draft.id} disabled={!creating} onChange={(event) => updateDraft('id', event.target.value)} /></label>
              <label className="text-[10px] font-semibold text-[var(--color-ec-text-muted)]"><span className="mb-1 block">Content type</span><select className="ec-control h-8 w-full px-2 text-[10px]" aria-label="Record content type" value={draft.contentTypeId} disabled={!creating} onChange={(event) => changeContentType(event.target.value)}>{contentTypes.map((definition) => <option key={definition.id} value={definition.id}>{definition.label}</option>)}</select></label>
              {contentType?.supports.title ? <label className="sm:col-span-2 text-[10px] font-semibold text-[var(--color-ec-text-muted)]"><span className="mb-1 block">Title</span><input className="ec-control h-8 w-full px-2 text-[10px]" aria-label="Record title" value={draft.title} onChange={(event) => updateDraft('title', event.target.value)} /></label> : null}
              <label className="text-[10px] font-semibold text-[var(--color-ec-text-muted)]"><span className="mb-1 block">Slug</span><input className="ec-control h-8 w-full px-2 text-[10px]" aria-label="Record slug" value={draft.slug} onChange={(event) => updateDraft('slug', event.target.value)} /></label>
              <label className="text-[10px] font-semibold text-[var(--color-ec-text-muted)]"><span className="mb-1 block">Status</span><select className="ec-control h-8 w-full px-2 text-[10px]" aria-label="Record status" value={draft.status} onChange={(event) => updateDraft('status', event.target.value as ContentRecordStatus)}>{CONTENT_RECORD_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}</select></label>
              {contentType?.supports.excerpt ? <label className="sm:col-span-2 text-[10px] font-semibold text-[var(--color-ec-text-muted)]"><span className="mb-1 block">Excerpt</span><textarea className="ec-control min-h-16 w-full resize-y px-2.5 py-2 text-[10px]" aria-label="Record excerpt" value={draft.excerpt} onChange={(event) => updateDraft('excerpt', event.target.value)} /></label> : null}
              {contentType?.supports.editor ? <label className="sm:col-span-2 text-[10px] font-semibold text-[var(--color-ec-text-muted)]"><span className="mb-1 block">Content</span><textarea className="ec-control min-h-28 w-full resize-y px-2.5 py-2 text-[10px]" aria-label="Record content" value={draft.content} onChange={(event) => updateDraft('content', event.target.value)} /></label> : null}
            </div>

            <fieldset className="rounded-[var(--ec-radius-md)] border border-[var(--color-ec-border)] p-3">
              <legend className="px-1 text-[9px] font-bold uppercase tracking-[.1em] text-[var(--color-ec-text-muted)]">Field Groups</legend>
              {fieldGroups.length ? <div className="grid gap-2 sm:grid-cols-2">{fieldGroups.map((group) => <label key={group.id} className="flex min-h-9 items-center gap-2 rounded-[var(--ec-radius-sm)] border border-[var(--color-ec-border)] px-2.5 text-[10px] text-[var(--color-ec-text)]"><input type="checkbox" aria-label={`Record field group ${group.label}`} checked={draft.fieldGroupIds.includes(group.id)} onChange={(event) => toggleFieldGroup(group, event.target.checked)} /><span className="min-w-0"><strong className="block truncate">{group.label}</strong><small className="font-mono text-[8px] text-[var(--color-ec-text-muted)]">{group.fields.length} fields</small></span></label>)}</div> : <p className="text-[9px] text-[var(--color-ec-text-muted)]">No reusable Field Groups are defined yet.</p>}
            </fieldset>

            {draft.fieldGroupIds.map((groupId) => {
              const group = fieldGroups.find((candidate) => candidate.id === groupId);
              if (!group) return null;
              return (
                <section key={group.id} className="rounded-[var(--ec-radius-md)] border border-[var(--color-ec-border)] p-3" aria-label={`Record values ${group.label}`}>
                  <header className="mb-3 flex items-center justify-between gap-2"><div><strong className="block text-[10px] text-[var(--color-ec-text)]">{group.label}</strong><span className="text-[8px] text-[var(--color-ec-text-muted)]">{group.id}</span></div><span className="text-[8px] font-semibold uppercase tracking-[.08em] text-[var(--color-ec-text-muted)]">{group.presentation}</span></header>
                  <div className="grid gap-3 sm:grid-cols-2">{group.fields.map((field) => <RecordFieldEditor key={field.id} group={group} field={field} draft={draft} onChange={setDraft} />)}</div>
                </section>
              );
            })}

            {validationIssues.length ? (
              <div role="alert" className="rounded-[var(--ec-radius-md)] border border-[var(--color-ec-danger-600)] p-3 text-[9px] text-[var(--color-ec-danger-600)]"><strong className="block">Resolve {validationIssues.length} validation issue{validationIssues.length === 1 ? '' : 's'}.</strong><ul className="mt-1 list-disc space-y-1 pl-4">{validationIssues.slice(0, 5).map((issue, index) => <li key={`${issue.path}-${index}`}>{issue.message}</li>)}</ul></div>
            ) : null}
            {feedback}

            <div className="flex flex-wrap gap-2 border-t border-[var(--color-ec-border)] pt-3">
              <button type="button" className="ec-focus-ring inline-flex h-9 items-center justify-center rounded-[var(--ec-radius-md)] bg-[var(--color-ec-accent)] px-3 text-[11px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50" disabled={!validation?.ok} onClick={save}>{creating ? 'Create record' : 'Save changes'}</button>
              {creating ? <button type="button" className="ec-control ec-focus-ring h-9 px-3 text-[11px] font-semibold" onClick={() => { setCreating(false); setDraft(null); setMessage(null); }}>Cancel</button> : null}
              {!creating && selected ? <button type="button" className="ec-control ec-focus-ring ml-auto h-9 px-3 text-[11px] font-semibold text-[var(--color-ec-danger-600)]" onClick={remove}>{deleteArmed ? 'Confirm delete' : 'Delete'}</button> : null}
            </div>
          </div>
        ) : <div className="p-4 text-[10px] leading-5 text-[var(--color-ec-text-muted)]">Select a record from the list or create a new one.</div>}
      </aside>
    </div>
  );
}
