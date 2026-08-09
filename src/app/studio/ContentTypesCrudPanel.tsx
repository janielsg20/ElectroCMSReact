import { useMemo, useState } from 'react';
import {
  createDefaultContentTypeDefinition,
  listContentTypeDefinitions,
  type ContentTypeDefinition,
} from '../../core/content';
import { Icon } from '../components/Icon';
import { useProjectSession } from '../project/project-session-context';

interface ContentTypesCrudPanelProps {
  query: string;
}

function createDraft(): ContentTypeDefinition {
  return {
    ...createDefaultContentTypeDefinition('content-type', 'Content Type'),
    singularLabel: 'Content Type',
  };
}

export function ContentTypesCrudPanel({ query }: ContentTypesCrudPanelProps) {
  const session = useProjectSession();
  const definitions = useMemo(() => listContentTypeDefinitions(session.project), [session.project]);
  const normalized = query.trim().toLowerCase();
  const visible = definitions.filter((definition) => !normalized || `${definition.label} ${definition.singularLabel} ${definition.id} ${definition.slug}`.toLowerCase().includes(normalized));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<ContentTypeDefinition>(() => createDraft());
  const [message, setMessage] = useState<{ tone: 'error' | 'success'; text: string } | null>(null);
  const [deleteArmed, setDeleteArmed] = useState(false);

  const selected = selectedId ? definitions.find((definition) => definition.id === selectedId) ?? null : null;
  const editing = creating ? draft : selected ?? draft;

  const selectDefinition = (definition: ContentTypeDefinition) => {
    setSelectedId(definition.id);
    setCreating(false);
    setDraft(structuredClone(definition));
    setMessage(null);
    setDeleteArmed(false);
  };

  const beginCreate = () => {
    setCreating(true);
    setSelectedId(null);
    setDraft(createDraft());
    setMessage(null);
    setDeleteArmed(false);
  };

  const updateDraft = <K extends keyof ContentTypeDefinition>(key: K, value: ContentTypeDefinition[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setMessage(null);
  };

  const updateSupport = (key: keyof ContentTypeDefinition['supports'], value: boolean) => {
    setDraft((current) => ({ ...current, supports: { ...current.supports, [key]: value } }));
    setMessage(null);
  };

  const save = () => {
    const result = creating
      ? session.createContentType(draft)
      : selected
        ? session.updateContentType(selected.id, draft)
        : null;
    if (!result) return;
    if (!result.ok) {
      setMessage({ tone: 'error', text: result.message });
      return;
    }
    setCreating(false);
    setSelectedId(result.value.id);
    setDraft(structuredClone(result.value));
    setMessage({ tone: 'success', text: result.changed ? 'Content type saved.' : 'No changes to save.' });
  };

  const remove = () => {
    if (!selected) return;
    if (!deleteArmed) {
      setDeleteArmed(true);
      setMessage(null);
      return;
    }
    const result = session.removeContentType(selected.id);
    if (!result.ok) {
      setDeleteArmed(false);
      setMessage({ tone: 'error', text: result.message });
      return;
    }
    setDeleteArmed(false);
    setSelectedId(null);
    setDraft(createDraft());
    setMessage({ tone: 'success', text: `Deleted ${selected.label}.` });
  };

  const activeDraft = creating || selected ? draft : editing;
  const feedback = message ? (
    <div
      role={message.tone === 'error' ? 'alert' : 'status'}
      className={`rounded-[var(--ec-radius-md)] border px-3 py-2 text-[11px] ${message.tone === 'error' ? 'border-[var(--color-ec-danger-600)] text-[var(--color-ec-danger-600)]' : 'border-[var(--color-ec-success-600)] text-[var(--color-ec-success-600)]'}`}
    >
      {message.text}
    </div>
  ) : null;

  return (
    <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1fr)_390px]">
      <div className="min-h-0 overflow-y-auto">
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-[10px] font-semibold text-[var(--color-ec-text-muted)]">{definitions.length} content type{definitions.length === 1 ? '' : 's'}</span>
          <button type="button" className="ec-control ec-focus-ring inline-flex h-8 items-center gap-1.5 px-2.5 text-[11px] font-semibold" onClick={beginCreate}><Icon name="plus" size={12} />New content type</button>
        </div>
        {visible.length ? (
          <div className="overflow-hidden rounded-[var(--ec-radius-lg)] border border-[var(--color-ec-border)] bg-[var(--color-ec-surface)] shadow-[var(--ec-shadow-panel)]">
            <div className="grid min-h-9 grid-cols-[minmax(160px,1.25fr)_minmax(110px,.8fr)_90px] items-center gap-3 border-b border-[var(--color-ec-border)] bg-[var(--color-ec-surface-subtle)] px-3 text-[10px] font-bold uppercase tracking-[.1em] text-[var(--color-ec-text-muted)]"><span>Name</span><span>Slug</span><span>Visibility</span></div>
            {visible.map((definition) => (
              <button key={definition.id} type="button" className="grid min-h-12 w-full grid-cols-[minmax(160px,1.25fr)_minmax(110px,.8fr)_90px] items-center gap-3 border-b border-[var(--color-ec-border)] px-3 text-left last:border-0 hover:bg-[var(--color-ec-surface-subtle)] data-[active=true]:bg-[var(--color-ec-accent-soft)]" data-active={!creating && selected?.id === definition.id ? 'true' : 'false'} onClick={() => selectDefinition(definition)}>
                <span className="min-w-0"><strong className="block truncate text-[11px] text-[var(--color-ec-text)]">{definition.label}</strong><small className="font-mono text-[10px] text-[var(--color-ec-text-muted)]">{definition.id}</small></span>
                <span className="truncate text-[10px] text-[var(--color-ec-text-muted)]">/{definition.slug}</span>
                <span className="text-[10px] font-semibold text-[var(--color-ec-text-muted)]">{definition.public ? 'Public' : 'Private'}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="grid min-h-64 place-items-center rounded-[var(--ec-radius-lg)] border border-dashed border-[var(--color-ec-border)] bg-[var(--color-ec-surface-subtle)] text-center"><div><Icon name="database" size={22} /><strong className="mt-3 block text-[12px] text-[var(--color-ec-text)]">{definitions.length ? 'No matching content types' : 'No content types yet'}</strong><p className="mt-1 text-[11px] text-[var(--color-ec-text-muted)]">{definitions.length ? 'Try another search.' : 'Create the first canonical content type for this project.'}</p></div></div>
        )}
      </div>

      <aside className="min-h-0 overflow-y-auto rounded-[var(--ec-radius-lg)] border border-[var(--color-ec-border)] bg-[var(--color-ec-surface)] shadow-[var(--ec-shadow-panel)]" aria-label="Content type editor">
        <header className="border-b border-[var(--color-ec-border)] px-3 py-3"><span className="text-[10px] font-bold uppercase tracking-[.12em] text-[var(--color-ec-accent)]">{creating ? 'Create' : selected ? 'Edit' : 'Content type'}</span><strong className="mt-1 block text-[13px] text-[var(--color-ec-text)]">{creating ? 'New content type' : selected?.label ?? 'Select or create a content type'}</strong></header>
        {message && !creating && !selected ? <div className="p-3 pb-0">{feedback}</div> : null}
        {(creating || selected) ? (
          <div className="space-y-4 p-3">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <label className="text-[11px] font-semibold text-[var(--color-ec-text-muted)]"><span className="mb-1 block">ID</span><input className="ec-control h-9 w-full px-2.5 text-[11px]" aria-label="Content type id" value={activeDraft.id} disabled={!creating} onChange={(event) => updateDraft('id', event.target.value)} /></label>
              <label className="text-[11px] font-semibold text-[var(--color-ec-text-muted)]"><span className="mb-1 block">Slug</span><input className="ec-control h-9 w-full px-2.5 text-[11px]" aria-label="Content type slug" value={activeDraft.slug} onChange={(event) => updateDraft('slug', event.target.value)} /></label>
              <label className="text-[11px] font-semibold text-[var(--color-ec-text-muted)]"><span className="mb-1 block">Label</span><input className="ec-control h-9 w-full px-2.5 text-[11px]" aria-label="Content type label" value={activeDraft.label} onChange={(event) => updateDraft('label', event.target.value)} /></label>
              <label className="text-[11px] font-semibold text-[var(--color-ec-text-muted)]"><span className="mb-1 block">Singular label</span><input className="ec-control h-9 w-full px-2.5 text-[11px]" aria-label="Content type singular label" value={activeDraft.singularLabel} onChange={(event) => updateDraft('singularLabel', event.target.value)} /></label>
            </div>
            <label className="block text-[11px] font-semibold text-[var(--color-ec-text-muted)]"><span className="mb-1 block">Description</span><textarea className="ec-control min-h-20 w-full resize-y px-2.5 py-2 text-[11px]" aria-label="Content type description" value={activeDraft.description} onChange={(event) => updateDraft('description', event.target.value)} /></label>

            <fieldset className="rounded-[var(--ec-radius-md)] border border-[var(--color-ec-border)] p-3"><legend className="px-1 text-[10px] font-bold uppercase tracking-[.1em] text-[var(--color-ec-text-muted)]">Behavior</legend><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2"><label className="flex items-center gap-2 text-[11px] text-[var(--color-ec-text)]"><input type="checkbox" checked={activeDraft.public} onChange={(event) => updateDraft('public', event.target.checked)} />Public</label><label className="flex items-center gap-2 text-[11px] text-[var(--color-ec-text)]"><input type="checkbox" checked={activeDraft.hierarchical} onChange={(event) => updateDraft('hierarchical', event.target.checked)} />Hierarchical</label></div></fieldset>

            <fieldset className="rounded-[var(--ec-radius-md)] border border-[var(--color-ec-border)] p-3"><legend className="px-1 text-[10px] font-bold uppercase tracking-[.1em] text-[var(--color-ec-text-muted)]">Supports</legend><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">{([['title', 'Title'], ['editor', 'Editor'], ['excerpt', 'Excerpt'], ['featuredImage', 'Featured image']] as const).map(([key, label]) => <label key={key} className="flex items-center gap-2 text-[11px] text-[var(--color-ec-text)]"><input type="checkbox" checked={activeDraft.supports[key]} onChange={(event) => updateSupport(key, event.target.checked)} />{label}</label>)}</div></fieldset>

            {message ? feedback : null}

            <div className="flex flex-wrap gap-2 border-t border-[var(--color-ec-border)] pt-3">
              <button type="button" className="ec-focus-ring inline-flex h-9 items-center justify-center rounded-[var(--ec-radius-md)] bg-[var(--color-ec-accent)] px-3 text-[11px] font-semibold text-white" onClick={save}>{creating ? 'Create content type' : 'Save changes'}</button>
              {creating ? <button type="button" className="ec-control ec-focus-ring h-9 px-3 text-[11px] font-semibold" onClick={() => { setCreating(false); setSelectedId(null); setMessage(null); }}>Cancel</button> : null}
              {!creating && selected ? <button type="button" className="ec-control ec-focus-ring ml-auto h-9 px-3 text-[11px] font-semibold text-[var(--color-ec-danger-600)]" onClick={remove}>{deleteArmed ? 'Confirm delete' : 'Delete'}</button> : null}
            </div>
          </div>
        ) : <div className="p-4 text-[11px] leading-5 text-[var(--color-ec-text-muted)]">Select a content type from the list or create a new one.</div>}
      </aside>
    </div>
  );
}
