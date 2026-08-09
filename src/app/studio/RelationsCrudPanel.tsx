import { useMemo, useState } from 'react';
import {
  createDefaultRelationDefinition,
  listContentTypeDefinitions,
  listRelationDefinitions,
  type RelationCardinality,
  type RelationDefinition,
} from '../../core/content';
import { Icon } from '../components/Icon';
import { useProjectSession } from '../project/project-session-context';

interface RelationsCrudPanelProps {
  query: string;
}

function createDraft(contentTypeIds: readonly string[]): RelationDefinition {
  const source = contentTypeIds[0] ?? 'source';
  const target = contentTypeIds[1] ?? contentTypeIds[0] ?? 'target';
  return createDefaultRelationDefinition(source, target);
}

export function RelationsCrudPanel({ query }: RelationsCrudPanelProps) {
  const session = useProjectSession();
  const definitions = useMemo(() => listRelationDefinitions(session.project), [session.project]);
  const contentTypes = useMemo(() => listContentTypeDefinitions(session.project), [session.project]);
  const normalized = query.trim().toLowerCase();
  const visible = definitions.filter((definition) => !normalized || `${definition.label} ${definition.id} ${definition.sourceContentTypeId} ${definition.targetContentTypeId}`.toLowerCase().includes(normalized));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<RelationDefinition>(() => createDraft(contentTypes.map((item) => item.id)));
  const [message, setMessage] = useState<{ tone: 'error' | 'success'; text: string } | null>(null);
  const [deleteArmed, setDeleteArmed] = useState(false);
  const selected = selectedId ? definitions.find((definition) => definition.id === selectedId) ?? null : null;

  const selectDefinition = (definition: RelationDefinition) => {
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
  const updateDraft = <K extends keyof RelationDefinition>(key: K, value: RelationDefinition[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setMessage(null);
  };
  const save = () => {
    const result = creating ? session.createRelation(draft) : selected ? session.updateRelation(selected.id, draft) : null;
    if (!result) return;
    if (!result.ok) {
      setMessage({ tone: 'error', text: result.message });
      return;
    }
    setCreating(false);
    setSelectedId(result.value.id);
    setDraft(structuredClone(result.value));
    setMessage({ tone: 'success', text: result.changed ? 'Relation saved.' : 'No changes to save.' });
  };
  const remove = () => {
    if (!selected) return;
    if (!deleteArmed) {
      setDeleteArmed(true);
      setMessage(null);
      return;
    }
    const result = session.removeRelation(selected.id);
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

  const feedback = message ? <div role={message.tone === 'error' ? 'alert' : 'status'} className={`rounded-[var(--ec-radius-md)] border px-3 py-2 text-[10px] ${message.tone === 'error' ? 'border-[var(--color-ec-danger-600)] text-[var(--color-ec-danger-600)]' : 'border-[var(--color-ec-success-600)] text-[var(--color-ec-success-600)]'}`}>{message.text}</div> : null;

  return (
    <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1fr)_440px]">
      <div className="min-h-0 overflow-y-auto">
        <div className="mb-2 flex items-center justify-between gap-3"><span className="text-[10px] font-semibold text-[var(--color-ec-text-muted)]">{definitions.length} relation{definitions.length === 1 ? '' : 's'}</span><button type="button" className="ec-control ec-focus-ring inline-flex h-8 items-center gap-1.5 px-2.5 text-[11px] font-semibold disabled:opacity-50" disabled={contentTypes.length < 1} onClick={beginCreate}><Icon name="plus" size={12} />New relation</button></div>
        {visible.length ? (
          <div className="overflow-hidden rounded-[var(--ec-radius-lg)] border border-[var(--color-ec-border)] bg-[var(--color-ec-surface)] shadow-[var(--ec-shadow-panel)]">
            <div className="grid min-h-9 grid-cols-[minmax(160px,1fr)_minmax(120px,.8fr)_minmax(120px,.8fr)] items-center gap-3 border-b border-[var(--color-ec-border)] bg-[var(--color-ec-surface-subtle)] px-3 text-[8px] font-bold uppercase tracking-[.1em] text-[var(--color-ec-text-muted)]"><span>Relation</span><span>Source</span><span>Target</span></div>
            {visible.map((definition) => <button key={definition.id} type="button" className="grid min-h-12 w-full grid-cols-[minmax(160px,1fr)_minmax(120px,.8fr)_minmax(120px,.8fr)] items-center gap-3 border-b border-[var(--color-ec-border)] px-3 text-left last:border-0 hover:bg-[var(--color-ec-surface-subtle)] data-[active=true]:bg-[var(--color-ec-accent-soft)]" data-active={!creating && selected?.id === definition.id ? 'true' : 'false'} onClick={() => selectDefinition(definition)}><span className="min-w-0"><strong className="block truncate text-[10px] text-[var(--color-ec-text)]">{definition.label}</strong><small className="font-mono text-[8px] text-[var(--color-ec-text-muted)]">{definition.id}</small></span><span className="text-[9px] text-[var(--color-ec-text-muted)]">{definition.sourceContentTypeId} · {definition.sourceCardinality}</span><span className="text-[9px] text-[var(--color-ec-text-muted)]">{definition.targetContentTypeId} · {definition.targetCardinality}</span></button>)}
          </div>
        ) : <div className="grid min-h-64 place-items-center rounded-[var(--ec-radius-lg)] border border-dashed border-[var(--color-ec-border)] bg-[var(--color-ec-surface-subtle)] text-center"><div><Icon name="link" size={22} /><strong className="mt-3 block text-[12px] text-[var(--color-ec-text)]">{definitions.length ? 'No matching relations' : 'No relations yet'}</strong><p className="mt-1 text-[10px] text-[var(--color-ec-text-muted)]">Define canonical Content Types before wiring record relationships.</p></div></div>}
      </div>

      <aside className="min-h-0 overflow-y-auto rounded-[var(--ec-radius-lg)] border border-[var(--color-ec-border)] bg-[var(--color-ec-surface)] shadow-[var(--ec-shadow-panel)]" aria-label="Relation editor">
        <header className="border-b border-[var(--color-ec-border)] px-3 py-3"><span className="text-[9px] font-bold uppercase tracking-[.12em] text-[var(--color-ec-accent)]">{creating ? 'Create' : selected ? 'Edit' : 'Relation'}</span><strong className="mt-1 block text-[13px] text-[var(--color-ec-text)]">{creating ? 'New relation' : selected?.label ?? 'Select or create a relation'}</strong></header>
        {message && !creating && !selected ? <div className="p-3 pb-0">{feedback}</div> : null}
        {(creating || selected) ? (
          <div className="space-y-4 p-3">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <label className="text-[10px] font-semibold text-[var(--color-ec-text-muted)]"><span className="mb-1 block">ID</span><input className="ec-control h-9 w-full px-2.5 text-[10px]" aria-label="Relation id" value={draft.id} disabled={!creating} onChange={(event) => updateDraft('id', event.target.value)} /></label>
              <label className="text-[10px] font-semibold text-[var(--color-ec-text-muted)]"><span className="mb-1 block">Label</span><input className="ec-control h-9 w-full px-2.5 text-[10px]" aria-label="Relation label" value={draft.label} onChange={(event) => updateDraft('label', event.target.value)} /></label>
              <label className="text-[10px] font-semibold text-[var(--color-ec-text-muted)]"><span className="mb-1 block">Source Content Type</span><select className="ec-control h-9 w-full px-2.5 text-[10px]" aria-label="Relation source content type" value={draft.sourceContentTypeId} onChange={(event) => updateDraft('sourceContentTypeId', event.target.value)}>{contentTypes.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
              <label className="text-[10px] font-semibold text-[var(--color-ec-text-muted)]"><span className="mb-1 block">Source cardinality</span><select className="ec-control h-9 w-full px-2.5 text-[10px]" aria-label="Relation source cardinality" value={draft.sourceCardinality} onChange={(event) => updateDraft('sourceCardinality', event.target.value as RelationCardinality)}><option value="one">One</option><option value="many">Many</option></select></label>
              <label className="text-[10px] font-semibold text-[var(--color-ec-text-muted)]"><span className="mb-1 block">Target Content Type</span><select className="ec-control h-9 w-full px-2.5 text-[10px]" aria-label="Relation target content type" value={draft.targetContentTypeId} onChange={(event) => updateDraft('targetContentTypeId', event.target.value)}>{contentTypes.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
              <label className="text-[10px] font-semibold text-[var(--color-ec-text-muted)]"><span className="mb-1 block">Target cardinality</span><select className="ec-control h-9 w-full px-2.5 text-[10px]" aria-label="Relation target cardinality" value={draft.targetCardinality} onChange={(event) => updateDraft('targetCardinality', event.target.value as RelationCardinality)}><option value="one">One</option><option value="many">Many</option></select></label>
            </div>
            <label className="block text-[10px] font-semibold text-[var(--color-ec-text-muted)]"><span className="mb-1 block">Description</span><textarea className="ec-control min-h-20 w-full resize-y px-2.5 py-2 text-[10px]" aria-label="Relation description" value={draft.description} onChange={(event) => updateDraft('description', event.target.value)} /></label>
            <label className="flex min-h-9 items-center gap-2 rounded-[var(--ec-radius-md)] border border-[var(--color-ec-border)] px-3 text-[10px] text-[var(--color-ec-text)]"><input type="checkbox" aria-label="Relation bidirectional" checked={draft.bidirectional} onChange={(event) => updateDraft('bidirectional', event.target.checked)} />Bidirectional relation</label>
            {feedback}
            <div className="flex flex-wrap gap-2 border-t border-[var(--color-ec-border)] pt-3"><button type="button" className="ec-focus-ring inline-flex h-9 items-center justify-center rounded-[var(--ec-radius-md)] bg-[var(--color-ec-accent)] px-3 text-[11px] font-semibold text-white disabled:opacity-50" disabled={contentTypes.length === 0} onClick={save}>{creating ? 'Create relation' : 'Save changes'}</button>{creating ? <button type="button" className="ec-control ec-focus-ring h-9 px-3 text-[11px] font-semibold" onClick={() => { setCreating(false); setSelectedId(null); setMessage(null); }}>Cancel</button> : null}{!creating && selected ? <button type="button" className="ec-control ec-focus-ring ml-auto h-9 px-3 text-[11px] font-semibold text-[var(--color-ec-danger-600)]" onClick={remove}>{deleteArmed ? 'Confirm delete' : 'Delete'}</button> : null}</div>
          </div>
        ) : <div className="p-4 text-[10px] leading-5 text-[var(--color-ec-text-muted)]">Select a relation from the list or create a new one.</div>}
      </aside>
    </div>
  );
}
