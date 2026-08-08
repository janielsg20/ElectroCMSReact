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
import { useProjectSession } from '../project/project-session-context';
import './relation-editor.css';

type EditorMode = 'empty' | 'create' | 'edit';
type StatusTone = 'idle' | 'success' | 'error';

interface EditorStatus {
  tone: StatusTone;
  message: string;
}

const DEFAULT_STATUS: EditorStatus = {
  tone: 'idle',
  message: 'Relations are stored in the canonical project and can be consumed by Relation fields.',
};

function nextRelationId(existing: ReadonlySet<string>, sourceId: string, targetId: string): string {
  const base = `${sourceId}-to-${targetId}`;
  if (!existing.has(base)) return base;
  let index = 2;
  while (existing.has(`${base}-${index}`)) index += 1;
  return `${base}-${index}`;
}

export function RelationEditor() {
  const session = useProjectSession();
  const contentTypes = useMemo(() => listContentTypeDefinitions(session.project), [session.project]);
  const relations = useMemo(() => listRelationDefinitions(session.project), [session.project]);
  const [mode, setMode] = useState<EditorMode>('empty');
  const [draft, setDraft] = useState<RelationDefinition | null>(null);
  const [status, setStatus] = useState<EditorStatus>(DEFAULT_STATUS);
  const [deleteArmed, setDeleteArmed] = useState(false);

  const validation = draft ? validateRelationDefinition(draft) : null;
  const issueByPath = new Map(
    validation && !validation.ok ? validation.issues.map((issue) => [issue.path, issue.message]) : [],
  );

  const beginCreate = () => {
    const source = contentTypes[0];
    const target = contentTypes[1] ?? source;
    if (!source || !target) {
      setStatus({ tone: 'error', message: 'Create at least one Content Type before defining a relation.' });
      return;
    }
    const id = nextRelationId(new Set(relations.map((relation) => relation.id)), source.id, target.id);
    const next = createDefaultRelationDefinition(source.id, target.id, id);
    next.label = `${source.singularLabel} → ${target.singularLabel}`;
    setDraft(next);
    setMode('create');
    setDeleteArmed(false);
    setStatus({ tone: 'idle', message: 'Define the endpoints and cardinality for this relation.' });
  };

  const selectRelation = (relation: RelationDefinition) => {
    setDraft(structuredClone(relation));
    setMode('edit');
    setDeleteArmed(false);
    setStatus({ tone: 'idle', message: `Editing ${relation.label}.` });
  };

  const patch = <K extends keyof RelationDefinition>(key: K, value: RelationDefinition[K]) => {
    setDraft((current) => current ? { ...current, [key]: value } : current);
    setDeleteArmed(false);
  };

  const save = () => {
    if (!draft || !validation?.ok) return;
    const result = mode === 'create'
      ? session.createRelation(draft)
      : session.updateRelation(draft.id, draft);
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
        ? `Created ${result.value.label}.`
        : result.changed
          ? `Saved ${result.value.label}.`
          : `No changes to save for ${result.value.label}.`,
    });
  };

  const remove = () => {
    if (!draft || mode !== 'edit') return;
    if (!deleteArmed) {
      setDeleteArmed(true);
      setStatus({ tone: 'idle', message: `Confirm deletion of ${draft.label}.` });
      return;
    }
    const result = session.removeRelation(draft.id);
    if (!result.ok) {
      setDeleteArmed(false);
      setStatus({ tone: 'error', message: result.message });
      return;
    }
    setMode('empty');
    setDraft(null);
    setDeleteArmed(false);
    setStatus({ tone: 'success', message: `Deleted ${result.value.label}.` });
  };

  return (
    <section className="relation-editor" aria-label="Relations">
      <header className="relation-editor-header">
        <div>
          <span className="relation-editor-eyebrow">Dynamic content · MF-043</span>
          <h3>Relations</h3>
          <p>Model typed links between Content Types with explicit cardinality and safe reference integrity.</p>
        </div>
        <div className="relation-editor-summary">
          <strong>{relations.length}</strong>
          <span>{relations.length === 1 ? 'relation' : 'relations'}</span>
          <button type="button" onClick={beginCreate} disabled={contentTypes.length === 0}>New relation</button>
        </div>
      </header>

      <div className="relation-editor-grid">
        <aside className="relation-list" aria-label="Relation list">
          <div className="relation-list-heading"><span>Relations</span><code>{relations.length}</code></div>
          {relations.length === 0 ? (
            <div className="relation-empty"><strong>No relations yet</strong><span>Create a relation to connect records across Content Types.</span></div>
          ) : (
            <div className="relation-list-items">
              {relations.map((relation) => {
                const source = contentTypes.find((item) => item.id === relation.sourceContentTypeId);
                const target = contentTypes.find((item) => item.id === relation.targetContentTypeId);
                const selected = mode === 'edit' && draft?.id === relation.id;
                return (
                  <button
                    key={relation.id}
                    type="button"
                    className="relation-list-item"
                    aria-pressed={selected}
                    data-selected={selected ? 'true' : 'false'}
                    onClick={() => selectRelation(relation)}
                  >
                    <span><strong>{relation.label}</strong><code>{relation.id}</code></span>
                    <small>{source?.singularLabel ?? relation.sourceContentTypeId} {relation.sourceCardinality} → {target?.singularLabel ?? relation.targetContentTypeId} {relation.targetCardinality}</small>
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        <section className="relation-detail" aria-label="Relation inspector">
          {!draft ? (
            <div className="relation-empty relation-empty-detail">
              <strong>Select or create a relation</strong>
              <span>Relations remain portable JSON in CanonicalProject.relations.</span>
            </div>
          ) : (
            <>
              <div className="relation-detail-heading">
                <div><span>{mode === 'create' ? 'New relation' : 'Relation'}</span><h4>{draft.label || draft.id}</h4></div>
                <code>v{draft.version}</code>
              </div>

              <div className="relation-form-grid">
                <label className="relation-field"><span>ID</span><input aria-label="Relation ID" value={draft.id} disabled={mode === 'edit'} onChange={(event) => patch('id', event.target.value)} /><small>{issueByPath.get('id') ?? 'Stable kebab-case identity.'}</small></label>
                <label className="relation-field"><span>Label</span><input aria-label="Relation label" value={draft.label} onChange={(event) => patch('label', event.target.value)} /><small>{issueByPath.get('label') ?? 'Human-readable relation name.'}</small></label>
                <label className="relation-field relation-field-wide"><span>Description</span><textarea aria-label="Relation description" rows={3} value={draft.description} onChange={(event) => patch('description', event.target.value)} /><small>{issueByPath.get('description') ?? 'Optional modeling context.'}</small></label>

                <label className="relation-field"><span>Source Content Type</span><select aria-label="Relation source content type" value={draft.sourceContentTypeId} onChange={(event) => patch('sourceContentTypeId', event.target.value)}>{contentTypes.map((item) => <option key={item.id} value={item.id}>{item.singularLabel} · {item.id}</option>)}</select><small>{issueByPath.get('sourceContentTypeId') ?? 'Record type owning the source side.'}</small></label>
                <label className="relation-field"><span>Source cardinality</span><select aria-label="Relation source cardinality" value={draft.sourceCardinality} onChange={(event) => patch('sourceCardinality', event.target.value as RelationCardinality)}>{RELATION_CARDINALITIES.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
                <label className="relation-field"><span>Target Content Type</span><select aria-label="Relation target content type" value={draft.targetContentTypeId} onChange={(event) => patch('targetContentTypeId', event.target.value)}>{contentTypes.map((item) => <option key={item.id} value={item.id}>{item.singularLabel} · {item.id}</option>)}</select><small>{issueByPath.get('targetContentTypeId') ?? 'Record type referenced by the source side.'}</small></label>
                <label className="relation-field"><span>Target cardinality</span><select aria-label="Relation target cardinality" value={draft.targetCardinality} onChange={(event) => patch('targetCardinality', event.target.value as RelationCardinality)}>{RELATION_CARDINALITIES.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>

                <label className="relation-toggle relation-field-wide"><input aria-label="Relation bidirectional" type="checkbox" checked={draft.bidirectional} onChange={(event) => patch('bidirectional', event.target.checked)} /><span><strong>Bidirectional metadata</strong><small>Expose this model from both endpoints where compatible fields are authored.</small></span></label>
              </div>

              <div className="relation-actions">
                <span className="relation-status" data-tone={status.tone} role="status">{status.message}</span>
                <div>
                  {mode === 'edit' ? <button type="button" className={deleteArmed ? 'danger' : ''} onClick={remove}>{deleteArmed ? 'Confirm delete' : 'Delete'}</button> : null}
                  <button type="button" className="primary" disabled={!validation?.ok} onClick={save}>{mode === 'create' ? 'Create relation' : 'Save changes'}</button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </section>
  );
}
