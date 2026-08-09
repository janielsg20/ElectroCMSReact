import { useMemo, useState } from 'react';
import {
  RELATION_CARDINALITIES,
  createDefaultRelationDefinition,
  listContentTypeDefinitions,
  listRelationDefinitions,
  validateRelationDefinition,
  type RelationCardinality,
  type RelationDefinition,
} from '../../core/content';
import { Icon } from '../components/Icon';
import { useProjectSession } from '../project/project-session-context';

interface RelationsCrudPanelProps {
  query: string;
}

function nextRelationId(existingIds: ReadonlySet<string>, sourceId: string, targetId: string): string {
  const base = `${sourceId}-to-${targetId}`;
  if (!existingIds.has(base)) return base;
  let index = 2;
  while (existingIds.has(`${base}-${index}`)) index += 1;
  return `${base}-${index}`;
}

export function RelationsCrudPanel({ query }: RelationsCrudPanelProps) {
  const session = useProjectSession();
  const contentTypes = useMemo(() => listContentTypeDefinitions(session.project), [session.project]);
  const relations = useMemo(() => listRelationDefinitions(session.project), [session.project]);
  const normalized = query.trim().toLowerCase();
  const visible = relations.filter((relation) => !normalized || `${relation.label} ${relation.id} ${relation.sourceContentTypeId} ${relation.targetContentTypeId}`.toLowerCase().includes(normalized));

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<RelationDefinition | null>(null);
  const [message, setMessage] = useState<{ tone: 'error' | 'success' | 'info'; text: string } | null>(null);
  const [deleteArmed, setDeleteArmed] = useState(false);

  const selected = selectedId ? relations.find((relation) => relation.id === selectedId) ?? null : null;
  const validation = draft ? validateRelationDefinition(draft) : null;
  const issues = validation && !validation.ok ? validation.issues : [];

  const beginCreate = () => {
    const source = contentTypes[0];
    const target = contentTypes[1] ?? source;
    if (!source || !target) {
      setMessage({ tone: 'error', text: 'Create at least one Content Type before defining a Relation.' });
      return;
    }
    const id = nextRelationId(new Set(relations.map((relation) => relation.id)), source.id, target.id);
    const next = createDefaultRelationDefinition(source.id, target.id, id);
    next.label = `${source.singularLabel} → ${target.singularLabel}`;
    setCreating(true);
    setSelectedId(null);
    setDraft(next);
    setDeleteArmed(false);
    setMessage({ tone: 'info', text: 'Define both endpoints and their cardinality.' });
  };

  const selectRelation = (relation: RelationDefinition) => {
    setCreating(false);
    setSelectedId(relation.id);
    setDraft(structuredClone(relation));
    setDeleteArmed(false);
    setMessage(null);
  };

  const updateDraft = <K extends keyof RelationDefinition>(key: K, value: RelationDefinition[K]) => {
    setDraft((current) => current ? { ...current, [key]: value } : current);
    setDeleteArmed(false);
    setMessage(null);
  };

  const save = () => {
    if (!draft || !validation?.ok) return;
    const result = creating ? session.createRelation(draft) : selected ? session.updateRelation(selected.id, draft) : null;
    if (!result) return;
    if (!result.ok) {
      setMessage({ tone: 'error', text: result.message });
      return;
    }
    setCreating(false);
    setSelectedId(result.value.id);
    setDraft(structuredClone(result.value));
    setDeleteArmed(false);
    setMessage({ tone: 'success', text: result.changed ? (selected ? 'Relation saved.' : 'Relation created.') : 'No changes to save.' });
  };

  const remove = () => {
    if (!selected) return;
    if (!deleteArmed) {
      setDeleteArmed(true);
      setMessage({ tone: 'info', text: `Confirm deletion of ${selected.label}.` });
      return;
    }
    const result = session.removeRelation(selected.id);
    if (!result.ok) {
      setDeleteArmed(false);
      setMessage({ tone: 'error', text: result.message });
      return;
    }
    setCreating(false);
    setSelectedId(null);
    setDraft(null);
    setDeleteArmed(false);
    setMessage({ tone: 'success', text: `Deleted ${selected.label}.` });
  };

  const feedback = message ? (
    <div
      role={message.tone === 'error' ? 'alert' : 'status'}
      className={`rounded-[var(--ec-radius-md)] border px-3 py-2 text-[10px] ${message.tone === 'error' ? 'border-[var(--color-ec-danger-600)] text-[var(--color-ec-danger-600)]' : message.tone === 'success' ? 'border-[var(--color-ec-success-600)] text-[var(--color-ec-success-600)]' : 'border-[var(--color-ec-border)] text-[var(--color-ec-text-muted)]'}`}
    >
      {message.text}
    </div>
  ) : null;

  return (
    <div className="grid min-h-0 flex-1 gap-3 xl:grid-cols-[minmax(0,1fr)_540px]">
      <div className="min-h-0 overflow-y-auto">
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-[10px] font-semibold text-[var(--color-ec-text-muted)]">{relations.length} relation{relations.length === 1 ? '' : 's'}</span>
          <button type="button" className="ec-control ec-focus-ring inline-flex h-8 items-center gap-1.5 px-2.5 text-[11px] font-semibold disabled:cursor-not-allowed disabled:opacity-50" disabled={contentTypes.length === 0} onClick={beginCreate}>
            <Icon name="plus" size={12} />New relation
          </button>
        </div>

        {visible.length ? (
          <div className="overflow-hidden rounded-[var(--ec-radius-lg)] border border-[var(--color-ec-border)] bg-[var(--color-ec-surface)] shadow-[var(--ec-shadow-panel)]">
            <div className="grid min-h-9 grid-cols-[minmax(160px,1fr)_minmax(130px,.9fr)_minmax(130px,.9fr)] items-center gap-3 border-b border-[var(--color-ec-border)] bg-[var(--color-ec-surface-subtle)] px-3 text-[8px] font-bold uppercase tracking-[.1em] text-[var(--color-ec-text-muted)]">
              <span>Relation</span><span>Source</span><span>Target</span>
            </div>
            {visible.map((relation) => {
              const source = contentTypes.find((item) => item.id === relation.sourceContentTypeId);
              const target = contentTypes.find((item) => item.id === relation.targetContentTypeId);
              return (
                <button
                  key={relation.id}
                  type="button"
                  className="grid min-h-12 w-full grid-cols-[minmax(160px,1fr)_minmax(130px,.9fr)_minmax(130px,.9fr)] items-center gap-3 border-b border-[var(--color-ec-border)] px-3 text-left last:border-0 hover:bg-[var(--color-ec-surface-subtle)] data-[active=true]:bg-[var(--color-ec-accent-soft)]"
                  data-active={!creating && selected?.id === relation.id ? 'true' : 'false'}
                  aria-label={`${relation.label} ${relation.id} ${relation.sourceContentTypeId} ${relation.targetContentTypeId}`}
                  onClick={() => selectRelation(relation)}
                >
                  <span className="min-w-0"><strong className="block truncate text-[10px] text-[var(--color-ec-text)]">{relation.label}</strong><small className="font-mono text-[8px] text-[var(--color-ec-text-muted)]">{relation.id}</small></span>
                  <span className="truncate text-[9px] text-[var(--color-ec-text-muted)]">{source?.singularLabel ?? relation.sourceContentTypeId} · {relation.sourceCardinality}</span>
                  <span className="truncate text-[9px] text-[var(--color-ec-text-muted)]">{target?.singularLabel ?? relation.targetContentTypeId} · {relation.targetCardinality}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="grid min-h-64 place-items-center rounded-[var(--ec-radius-lg)] border border-dashed border-[var(--color-ec-border)] bg-[var(--color-ec-surface-subtle)] text-center">
            <div><Icon name="link" size={22} /><strong className="mt-3 block text-[12px] text-[var(--color-ec-text)]">{relations.length ? 'No relations match' : 'No relations yet'}</strong><p className="mt-1 text-[10px] text-[var(--color-ec-text-muted)]">Connect canonical Content Types with explicit cardinality.</p></div>
          </div>
        )}
      </div>

      <aside className="min-h-0 overflow-y-auto rounded-[var(--ec-radius-lg)] border border-[var(--color-ec-border)] bg-[var(--color-ec-surface)] shadow-[var(--ec-shadow-panel)]" aria-label="Relation editor">
        <header className="border-b border-[var(--color-ec-border)] px-3 py-3">
          <span className="text-[9px] font-bold uppercase tracking-[.12em] text-[var(--color-ec-accent)]">{creating ? 'Create' : selected ? 'Edit' : 'Relations'}</span>
          <strong className="mt-1 block text-[13px] text-[var(--color-ec-text)]">{draft ? draft.label || draft.id : 'Select or create a relation'}</strong>
        </header>
        {message && !draft ? <div className="p-3 pb-0">{feedback}</div> : null}
        {draft ? (
          <div className="space-y-4 p-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="text-[10px] font-semibold text-[var(--color-ec-text-muted)]"><span className="mb-1 block">ID</span><input className="ec-control h-8 w-full px-2 font-mono text-[10px]" aria-label="Relation ID" value={draft.id} disabled={!creating} onChange={(event) => updateDraft('id', event.target.value)} /></label>
              <label className="text-[10px] font-semibold text-[var(--color-ec-text-muted)]"><span className="mb-1 block">Label</span><input className="ec-control h-8 w-full px-2 text-[10px]" aria-label="Relation label" value={draft.label} onChange={(event) => updateDraft('label', event.target.value)} /></label>
              <label className="sm:col-span-2 text-[10px] font-semibold text-[var(--color-ec-text-muted)]"><span className="mb-1 block">Description</span><textarea className="ec-control min-h-16 w-full resize-y px-2.5 py-2 text-[10px]" aria-label="Relation description" value={draft.description} onChange={(event) => updateDraft('description', event.target.value)} /></label>
              <label className="text-[10px] font-semibold text-[var(--color-ec-text-muted)]"><span className="mb-1 block">Source content type</span><select className="ec-control h-8 w-full px-2 text-[10px]" aria-label="Relation source content type" value={draft.sourceContentTypeId} onChange={(event) => updateDraft('sourceContentTypeId', event.target.value)}>{contentTypes.map((item) => <option key={item.id} value={item.id}>{item.singularLabel} · {item.id}</option>)}</select></label>
              <label className="text-[10px] font-semibold text-[var(--color-ec-text-muted)]"><span className="mb-1 block">Source cardinality</span><select className="ec-control h-8 w-full px-2 text-[10px]" aria-label="Relation source cardinality" value={draft.sourceCardinality} onChange={(event) => updateDraft('sourceCardinality', event.target.value as RelationCardinality)}>{RELATION_CARDINALITIES.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
              <label className="text-[10px] font-semibold text-[var(--color-ec-text-muted)]"><span className="mb-1 block">Target content type</span><select className="ec-control h-8 w-full px-2 text-[10px]" aria-label="Relation target content type" value={draft.targetContentTypeId} onChange={(event) => updateDraft('targetContentTypeId', event.target.value)}>{contentTypes.map((item) => <option key={item.id} value={item.id}>{item.singularLabel} · {item.id}</option>)}</select></label>
              <label className="text-[10px] font-semibold text-[var(--color-ec-text-muted)]"><span className="mb-1 block">Target cardinality</span><select className="ec-control h-8 w-full px-2 text-[10px]" aria-label="Relation target cardinality" value={draft.targetCardinality} onChange={(event) => updateDraft('targetCardinality', event.target.value as RelationCardinality)}>{RELATION_CARDINALITIES.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
              <label className="sm:col-span-2 flex min-h-10 items-center gap-2 rounded-[var(--ec-radius-sm)] border border-[var(--color-ec-border)] px-2.5 text-[10px] font-semibold text-[var(--color-ec-text)]"><input aria-label="Relation bidirectional" type="checkbox" checked={draft.bidirectional} onChange={(event) => updateDraft('bidirectional', event.target.checked)} /><span><strong className="block">Bidirectional metadata</strong><small className="font-normal text-[var(--color-ec-text-muted)]">Expose compatible relation metadata from both endpoints.</small></span></label>
            </div>

            {issues.length ? <div role="alert" className="rounded-[var(--ec-radius-md)] border border-[var(--color-ec-danger-600)] p-3 text-[9px] text-[var(--color-ec-danger-600)]"><strong className="block">Resolve {issues.length} relation issue{issues.length === 1 ? '' : 's'}.</strong><ul className="mt-1 list-disc space-y-1 pl-4">{issues.map((issue, index) => <li key={`${issue.path}-${index}`}>{issue.message}</li>)}</ul></div> : null}
            {feedback}
            <div className="flex flex-wrap gap-2 border-t border-[var(--color-ec-border)] pt-3">
              <button type="button" className="ec-focus-ring inline-flex h-9 items-center justify-center rounded-[var(--ec-radius-md)] bg-[var(--color-ec-accent)] px-3 text-[11px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50" disabled={!validation?.ok} onClick={save}>{creating ? 'Create relation' : 'Save changes'}</button>
              {creating ? <button type="button" className="ec-control ec-focus-ring h-9 px-3 text-[11px] font-semibold" onClick={() => { setCreating(false); setDraft(null); setMessage(null); }}>Cancel</button> : null}
              {!creating && selected ? <button type="button" className="ec-control ec-focus-ring ml-auto h-9 px-3 text-[11px] font-semibold text-[var(--color-ec-danger-600)]" onClick={remove}>{deleteArmed ? 'Confirm delete' : 'Delete'}</button> : null}
            </div>
          </div>
        ) : <div className="p-4 text-[10px] leading-5 text-[var(--color-ec-text-muted)]">Relations are stored in the canonical project and consumed by Relation fields.</div>}
      </aside>
    </div>
  );
}
