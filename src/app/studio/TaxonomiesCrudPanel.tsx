import { useMemo, useState } from 'react';
import {
  createDefaultTaxonomyDefinition,
  listContentTypeDefinitions,
  listTaxonomyDefinitions,
  type TaxonomyDefinition,
} from '../../core/content';
import { Icon } from '../components/Icon';
import { useProjectSession } from '../project/project-session-context';

interface TaxonomiesCrudPanelProps {
  query: string;
}

function createDraft(contentTypeIds: readonly string[]): TaxonomyDefinition {
  return {
    ...createDefaultTaxonomyDefinition('taxonomy', 'Taxonomy', contentTypeIds.slice(0, 1)),
    singularLabel: 'Taxonomy',
  };
}

function toggleValue(values: readonly string[], value: string, checked: boolean): string[] {
  return checked ? Array.from(new Set([...values, value])) : values.filter((candidate) => candidate !== value);
}

export function TaxonomiesCrudPanel({ query }: TaxonomiesCrudPanelProps) {
  const session = useProjectSession();
  const definitions = useMemo(() => listTaxonomyDefinitions(session.project), [session.project]);
  const contentTypes = useMemo(() => listContentTypeDefinitions(session.project), [session.project]);
  const fieldGroups = useMemo(() => Object.keys(session.project.fieldGroups).sort((a, b) => a.localeCompare(b)), [session.project.fieldGroups]);
  const archiveTemplates = useMemo(
    () => session.project.documentOrder
      .map((id) => session.project.documents[id])
      .filter((document) => document?.kind === 'archive'),
    [session.project.documentOrder, session.project.documents],
  );
  const normalized = query.trim().toLowerCase();
  const visible = definitions.filter((definition) => !normalized || `${definition.label} ${definition.singularLabel} ${definition.id} ${definition.slug} ${definition.contentTypeIds.join(' ')}`.toLowerCase().includes(normalized));

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<TaxonomyDefinition>(() => createDraft(contentTypes.map((item) => item.id)));
  const [message, setMessage] = useState<{ tone: 'error' | 'success'; text: string } | null>(null);
  const [deleteArmed, setDeleteArmed] = useState(false);

  const selected = selectedId ? definitions.find((definition) => definition.id === selectedId) ?? null : null;
  const activeDraft = draft;

  const selectDefinition = (definition: TaxonomyDefinition) => {
    setSelectedId(definition.id);
    setCreating(false);
    setDraft(structuredClone(definition));
    setMessage(null);
    setDeleteArmed(false);
  };

  const beginCreate = () => {
    setCreating(true);
    setSelectedId(null);
    setDraft(createDraft(contentTypes.map((item) => item.id)));
    setMessage(null);
    setDeleteArmed(false);
  };

  const updateDraft = <K extends keyof TaxonomyDefinition>(key: K, value: TaxonomyDefinition[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setMessage(null);
  };

  const save = () => {
    const result = creating
      ? session.createTaxonomy(draft)
      : selected
        ? session.updateTaxonomy(selected.id, draft)
        : null;
    if (!result) return;
    if (!result.ok) {
      setMessage({ tone: 'error', text: result.message });
      return;
    }
    setCreating(false);
    setSelectedId(result.value.id);
    setDraft(structuredClone(result.value));
    setMessage({ tone: 'success', text: result.changed ? 'Taxonomy saved.' : 'No changes to save.' });
  };

  const remove = () => {
    if (!selected) return;
    if (!deleteArmed) {
      setDeleteArmed(true);
      setMessage(null);
      return;
    }
    const result = session.removeTaxonomy(selected.id);
    if (!result.ok) {
      setDeleteArmed(false);
      setMessage({ tone: 'error', text: result.message });
      return;
    }
    setDeleteArmed(false);
    setSelectedId(null);
    setDraft(createDraft(contentTypes.map((item) => item.id)));
    setMessage({ tone: 'success', text: `Deleted ${selected.label}.` });
  };

  const feedback = message ? (
    <div
      role={message.tone === 'error' ? 'alert' : 'status'}
      className={`rounded-[var(--ec-radius-md)] border px-3 py-2 text-[11px] ${message.tone === 'error' ? 'border-[var(--color-ec-danger-600)] text-[var(--color-ec-danger-600)]' : 'border-[var(--color-ec-success-600)] text-[var(--color-ec-success-600)]'}`}
    >
      {message.text}
    </div>
  ) : null;

  return (
    <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1fr)_410px]">
      <div className="min-h-0 overflow-y-auto">
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-[10px] font-semibold text-[var(--color-ec-text-muted)]">{definitions.length} taxonom{definitions.length === 1 ? 'y' : 'ies'}</span>
          <button type="button" className="ec-control ec-focus-ring inline-flex h-8 items-center gap-1.5 px-2.5 text-[11px] font-semibold" onClick={beginCreate}><Icon name="plus" size={12} />New taxonomy</button>
        </div>
        {visible.length ? (
          <div className="overflow-hidden rounded-[var(--ec-radius-lg)] border border-[var(--color-ec-border)] bg-[var(--color-ec-surface)] shadow-[var(--ec-shadow-panel)]">
            <div className="grid min-h-9 grid-cols-[minmax(160px,1.2fr)_minmax(120px,.8fr)_110px] items-center gap-3 border-b border-[var(--color-ec-border)] bg-[var(--color-ec-surface-subtle)] px-3 text-[10px] font-bold uppercase tracking-[.1em] text-[var(--color-ec-text-muted)]"><span>Name</span><span>Slug</span><span>Structure</span></div>
            {visible.map((definition) => (
              <button key={definition.id} type="button" className="grid min-h-12 w-full grid-cols-[minmax(160px,1.2fr)_minmax(120px,.8fr)_110px] items-center gap-3 border-b border-[var(--color-ec-border)] px-3 text-left last:border-0 hover:bg-[var(--color-ec-surface-subtle)] data-[active=true]:bg-[var(--color-ec-accent-soft)]" data-active={!creating && selected?.id === definition.id ? 'true' : 'false'} onClick={() => selectDefinition(definition)}>
                <span className="min-w-0"><strong className="block truncate text-[11px] text-[var(--color-ec-text)]">{definition.label}</strong><small className="font-mono text-[10px] text-[var(--color-ec-text-muted)]">{definition.id}</small></span>
                <span className="truncate text-[10px] text-[var(--color-ec-text-muted)]">/{definition.slug}</span>
                <span className="text-[10px] font-semibold text-[var(--color-ec-text-muted)]">{definition.hierarchical ? 'Hierarchical' : 'Flat'}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="grid min-h-64 place-items-center rounded-[var(--ec-radius-lg)] border border-dashed border-[var(--color-ec-border)] bg-[var(--color-ec-surface-subtle)] text-center">
            <div><Icon name="filter" size={22} /><strong className="mt-3 block text-[12px] text-[var(--color-ec-text)]">{definitions.length ? 'No matching taxonomies' : 'No taxonomies yet'}</strong><p className="mt-1 text-[11px] text-[var(--color-ec-text-muted)]">{definitions.length ? 'Try another search.' : 'Create a taxonomy after defining at least one Content Type.'}</p></div>
          </div>
        )}
      </div>

      <aside className="min-h-0 overflow-y-auto rounded-[var(--ec-radius-lg)] border border-[var(--color-ec-border)] bg-[var(--color-ec-surface)] shadow-[var(--ec-shadow-panel)]" aria-label="Taxonomy editor">
        <header className="border-b border-[var(--color-ec-border)] px-3 py-3"><span className="text-[10px] font-bold uppercase tracking-[.12em] text-[var(--color-ec-accent)]">{creating ? 'Create' : selected ? 'Edit' : 'Taxonomy'}</span><strong className="mt-1 block text-[13px] text-[var(--color-ec-text)]">{creating ? 'New taxonomy' : selected?.label ?? 'Select or create a taxonomy'}</strong></header>
        {message && !creating && !selected ? <div className="p-3 pb-0">{feedback}</div> : null}
        {(creating || selected) ? (
          <div className="space-y-4 p-3">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <label className="text-[11px] font-semibold text-[var(--color-ec-text-muted)]"><span className="mb-1 block">ID</span><input className="ec-control h-9 w-full px-2.5 text-[11px]" aria-label="Taxonomy id" value={activeDraft.id} disabled={!creating} onChange={(event) => updateDraft('id', event.target.value)} /></label>
              <label className="text-[11px] font-semibold text-[var(--color-ec-text-muted)]"><span className="mb-1 block">Slug</span><input className="ec-control h-9 w-full px-2.5 text-[11px]" aria-label="Taxonomy slug" value={activeDraft.slug} onChange={(event) => updateDraft('slug', event.target.value)} /></label>
              <label className="text-[11px] font-semibold text-[var(--color-ec-text-muted)]"><span className="mb-1 block">Label</span><input className="ec-control h-9 w-full px-2.5 text-[11px]" aria-label="Taxonomy label" value={activeDraft.label} onChange={(event) => updateDraft('label', event.target.value)} /></label>
              <label className="text-[11px] font-semibold text-[var(--color-ec-text-muted)]"><span className="mb-1 block">Singular label</span><input className="ec-control h-9 w-full px-2.5 text-[11px]" aria-label="Taxonomy singular label" value={activeDraft.singularLabel} onChange={(event) => updateDraft('singularLabel', event.target.value)} /></label>
            </div>

            <label className="block text-[11px] font-semibold text-[var(--color-ec-text-muted)]"><span className="mb-1 block">Description</span><textarea className="ec-control min-h-20 w-full resize-y px-2.5 py-2 text-[11px]" aria-label="Taxonomy description" value={activeDraft.description} onChange={(event) => updateDraft('description', event.target.value)} /></label>

            <fieldset className="rounded-[var(--ec-radius-md)] border border-[var(--color-ec-border)] p-3"><legend className="px-1 text-[10px] font-bold uppercase tracking-[.1em] text-[var(--color-ec-text-muted)]">Structure</legend><label className="flex items-center gap-2 text-[11px] text-[var(--color-ec-text)]"><input type="checkbox" aria-label="Taxonomy hierarchical" checked={activeDraft.hierarchical} onChange={(event) => updateDraft('hierarchical', event.target.checked)} />Hierarchical terms</label></fieldset>

            <fieldset className="rounded-[var(--ec-radius-md)] border border-[var(--color-ec-border)] p-3">
              <legend className="px-1 text-[10px] font-bold uppercase tracking-[.1em] text-[var(--color-ec-text-muted)]">Content Types</legend>
              {contentTypes.length ? <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">{contentTypes.map((contentType) => <label key={contentType.id} className="flex items-center gap-2 text-[11px] text-[var(--color-ec-text)]"><input type="checkbox" aria-label={`Target content type ${contentType.label}`} checked={activeDraft.contentTypeIds.includes(contentType.id)} onChange={(event) => updateDraft('contentTypeIds', toggleValue(activeDraft.contentTypeIds, contentType.id, event.target.checked))} />{contentType.label}</label>)}</div> : <p className="text-[10px] leading-4 text-[var(--color-ec-danger-600)]">Create a Content Type before saving a taxonomy.</p>}
            </fieldset>

            {fieldGroups.length ? <fieldset className="rounded-[var(--ec-radius-md)] border border-[var(--color-ec-border)] p-3"><legend className="px-1 text-[10px] font-bold uppercase tracking-[.1em] text-[var(--color-ec-text-muted)]">Optional field groups</legend><div className="grid gap-2">{fieldGroups.map((id) => <label key={id} className="flex items-center gap-2 text-[11px] text-[var(--color-ec-text)]"><input type="checkbox" aria-label={`Taxonomy field group ${id}`} checked={activeDraft.fieldGroupIds.includes(id)} onChange={(event) => updateDraft('fieldGroupIds', toggleValue(activeDraft.fieldGroupIds, id, event.target.checked))} /><span className="font-mono">{id}</span></label>)}</div></fieldset> : null}

            <label className="block text-[11px] font-semibold text-[var(--color-ec-text-muted)]"><span className="mb-1 block">Archive template</span><select className="ec-control h-9 w-full px-2.5 text-[11px]" aria-label="Taxonomy archive template" value={activeDraft.archiveTemplateId ?? ''} onChange={(event) => updateDraft('archiveTemplateId', event.target.value || null)}><option value="">None</option>{archiveTemplates.map((document) => document ? <option key={document.id} value={document.id}>{document.name}</option> : null)}</select></label>

            {message ? feedback : null}

            <div className="flex flex-wrap gap-2 border-t border-[var(--color-ec-border)] pt-3">
              <button type="button" className="ec-focus-ring inline-flex h-9 items-center justify-center rounded-[var(--ec-radius-md)] bg-[var(--color-ec-accent)] px-3 text-[11px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50" disabled={contentTypes.length === 0} onClick={save}>{creating ? 'Create taxonomy' : 'Save changes'}</button>
              {creating ? <button type="button" className="ec-control ec-focus-ring h-9 px-3 text-[11px] font-semibold" onClick={() => { setCreating(false); setSelectedId(null); setMessage(null); }}>Cancel</button> : null}
              {!creating && selected ? <button type="button" className="ec-control ec-focus-ring ml-auto h-9 px-3 text-[11px] font-semibold text-[var(--color-ec-danger-600)]" onClick={remove}>{deleteArmed ? 'Confirm delete' : 'Delete'}</button> : null}
            </div>
          </div>
        ) : <div className="p-4 text-[11px] leading-5 text-[var(--color-ec-text-muted)]">Select a taxonomy from the list or create a new one.</div>}
      </aside>
    </div>
  );
}
