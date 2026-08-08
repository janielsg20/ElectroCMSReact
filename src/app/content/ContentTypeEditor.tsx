import { useMemo, useState, type ChangeEvent } from 'react';
import {
  createDefaultContentTypeDefinition,
  listContentTypeDefinitions,
  validateContentTypeDefinition,
  type ContentTypeDefinition,
  type ContentTypeSupports,
} from '../../core/content';
import { useProjectSession } from '../project/project-session-context';
import './content-type-editor.css';

type EditorMode = 'empty' | 'create' | 'edit';

type StatusTone = 'idle' | 'success' | 'error';

interface EditorStatus {
  tone: StatusTone;
  message: string;
}

const DEFAULT_STATUS: EditorStatus = {
  tone: 'idle',
  message: 'Content types are stored in the canonical project and autosaved locally.',
};

function recordContentTypeId(record: Record<string, unknown>): string | null {
  const candidate = record.contentTypeId ?? record.contentType;
  return typeof candidate === 'string' ? candidate : null;
}

function nextContentTypeId(existingIds: ReadonlySet<string>): string {
  if (!existingIds.has('content-type')) return 'content-type';
  let index = 2;
  while (existingIds.has(`content-type-${index}`)) index += 1;
  return `content-type-${index}`;
}

function cloneDefinition(definition: ContentTypeDefinition): ContentTypeDefinition {
  return structuredClone(definition);
}

export function ContentTypeEditor() {
  const session = useProjectSession();
  const definitions = useMemo(
    () => listContentTypeDefinitions(session.project),
    [session.project],
  );
  const recordCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const record of Object.values(session.project.records)) {
      const id = recordContentTypeId(record);
      if (!id) continue;
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    return counts;
  }, [session.project.records]);

  const [mode, setMode] = useState<EditorMode>('empty');
  const [draft, setDraft] = useState<ContentTypeDefinition | null>(null);
  const [status, setStatus] = useState<EditorStatus>(DEFAULT_STATUS);
  const [deleteArmed, setDeleteArmed] = useState(false);

  const validation = draft ? validateContentTypeDefinition(draft) : null;
  const issuesByPath = new Map(
    validation && !validation.ok ? validation.issues.map((issue) => [issue.path, issue.message]) : [],
  );

  const beginCreate = () => {
    const ids = new Set(definitions.map((definition) => definition.id));
    const id = nextContentTypeId(ids);
    const next = createDefaultContentTypeDefinition(id, 'New Content Type');
    setMode('create');
    setDraft(next);
    setDeleteArmed(false);
    setStatus({ tone: 'idle', message: 'Configure the new type, then create it.' });
  };

  const selectDefinition = (definition: ContentTypeDefinition) => {
    setMode('edit');
    setDraft(cloneDefinition(definition));
    setDeleteArmed(false);
    setStatus({ tone: 'idle', message: `Editing ${definition.label}.` });
  };

  const patchDraft = <K extends keyof ContentTypeDefinition>(
    key: K,
    value: ContentTypeDefinition[K],
  ) => {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
    setDeleteArmed(false);
  };

  const patchSupport = (key: keyof ContentTypeSupports, value: boolean) => {
    setDraft((current) =>
      current
        ? {
            ...current,
            supports: {
              ...current.supports,
              [key]: value,
            },
          }
        : current,
    );
    setDeleteArmed(false);
  };

  const saveDraft = () => {
    if (!draft || !validation?.ok) return;
    const result = mode === 'create'
      ? session.createContentType(draft)
      : session.updateContentType(draft.id, draft);
    if (!result.ok) {
      setStatus({ tone: 'error', message: result.message });
      return;
    }
    setDraft(cloneDefinition(result.value));
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

  const deleteDraft = () => {
    if (!draft || mode !== 'edit') return;
    if (!deleteArmed) {
      setDeleteArmed(true);
      setStatus({
        tone: 'idle',
        message: `Confirm deletion of ${draft.label}. Existing records will block deletion.`,
      });
      return;
    }
    const result = session.removeContentType(draft.id);
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

  const handleText =
    (key: 'id' | 'label' | 'singularLabel' | 'slug' | 'description') =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      patchDraft(key, event.target.value);
    };

  return (
    <section className="content-type-editor" aria-label="Content Types">
      <header className="content-type-editor-header">
        <div>
          <span className="content-type-editor-eyebrow">Dynamic content · MF-037</span>
          <h2>Content Types</h2>
          <p>Define reusable content models before adding taxonomies, fields and records.</p>
        </div>
        <div className="content-type-editor-summary" aria-label="Content type summary">
          <strong>{definitions.length}</strong>
          <span>{definitions.length === 1 ? 'type' : 'types'}</span>
          <button type="button" onClick={beginCreate}>New content type</button>
        </div>
      </header>

      <div className="content-type-editor-grid">
        <aside className="content-type-list" aria-label="Content type list">
          <div className="content-type-list-heading">
            <span>Models</span>
            <code>{definitions.length}</code>
          </div>
          {definitions.length === 0 ? (
            <div className="content-type-empty-list">
              <strong>No content types yet</strong>
              <span>Create the first model to unlock structured content.</span>
            </div>
          ) : (
            <div className="content-type-list-items">
              {definitions.map((definition) => {
                const selected = mode === 'edit' && draft?.id === definition.id;
                const records = recordCounts.get(definition.id) ?? 0;
                return (
                  <button
                    className="content-type-list-item"
                    data-selected={selected ? 'true' : 'false'}
                    key={definition.id}
                    type="button"
                    onClick={() => selectDefinition(definition)}
                    aria-pressed={selected}
                  >
                    <span className="content-type-list-item-main">
                      <strong>{definition.label}</strong>
                      <code>/{definition.slug}</code>
                    </span>
                    <span className="content-type-list-item-meta">
                      <span>{definition.public ? 'Public' : 'Private'}</span>
                      <span>{records} {records === 1 ? 'record' : 'records'}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        <div className="content-type-detail">
          {!draft ? (
            <div className="content-type-detail-empty">
              <span aria-hidden="true">＋</span>
              <strong>Select a content type or create a new one</strong>
              <p>The editor keeps model configuration visible without leaving the Backend workspace.</p>
              <button type="button" onClick={beginCreate}>Create first type</button>
            </div>
          ) : (
            <form
              className="content-type-form"
              onSubmit={(event) => {
                event.preventDefault();
                saveDraft();
              }}
            >
              <div className="content-type-form-toolbar">
                <div>
                  <span>{mode === 'create' ? 'New model' : 'Model settings'}</span>
                  <strong>{draft.label || draft.id}</strong>
                </div>
                <div className="content-type-form-actions">
                  {mode === 'edit' ? (
                    <button
                      className="content-type-delete"
                      data-armed={deleteArmed ? 'true' : 'false'}
                      type="button"
                      onClick={deleteDraft}
                    >
                      {deleteArmed ? 'Confirm delete' : 'Delete'}
                    </button>
                  ) : null}
                  <button className="content-type-save" type="submit" disabled={!validation?.ok}>
                    {mode === 'create' ? 'Create content type' : 'Save changes'}
                  </button>
                </div>
              </div>

              <div className="content-type-form-section">
                <div className="content-type-form-section-heading">
                  <strong>Identity</strong>
                  <span>Stable identifiers and human-readable labels.</span>
                </div>
                <div className="content-type-field-grid">
                  <label className="content-type-field">
                    <span>ID</span>
                    <input
                      aria-label="Content type ID"
                      value={draft.id}
                      disabled={mode === 'edit'}
                      onChange={handleText('id')}
                      aria-invalid={issuesByPath.has('id')}
                    />
                    <small>{issuesByPath.get('id') ?? 'Immutable after creation · kebab-case'}</small>
                  </label>
                  <label className="content-type-field">
                    <span>URL slug</span>
                    <div className="content-type-slug-control">
                      <span aria-hidden="true">/</span>
                      <input
                        aria-label="Content type slug"
                        value={draft.slug}
                        onChange={handleText('slug')}
                        aria-invalid={issuesByPath.has('slug')}
                      />
                    </div>
                    <small>{issuesByPath.get('slug') ?? 'Unique across content types'}</small>
                  </label>
                  <label className="content-type-field">
                    <span>Plural label</span>
                    <input
                      aria-label="Content type plural label"
                      value={draft.label}
                      onChange={handleText('label')}
                      aria-invalid={issuesByPath.has('label')}
                    />
                    <small>{issuesByPath.get('label') ?? 'Used in lists and navigation'}</small>
                  </label>
                  <label className="content-type-field">
                    <span>Singular label</span>
                    <input
                      aria-label="Content type singular label"
                      value={draft.singularLabel}
                      onChange={handleText('singularLabel')}
                      aria-invalid={issuesByPath.has('singularLabel')}
                    />
                    <small>{issuesByPath.get('singularLabel') ?? 'Used for individual records'}</small>
                  </label>
                  <label className="content-type-field content-type-field--wide">
                    <span>Description</span>
                    <textarea
                      aria-label="Content type description"
                      rows={3}
                      value={draft.description}
                      onChange={handleText('description')}
                      aria-invalid={issuesByPath.has('description')}
                    />
                    <small>{issuesByPath.get('description') ?? 'Optional · up to 280 characters'}</small>
                  </label>
                </div>
              </div>

              <div className="content-type-form-section">
                <div className="content-type-form-section-heading">
                  <strong>Behavior</strong>
                  <span>Control exposure and hierarchy without changing the content schema.</span>
                </div>
                <div className="content-type-toggle-grid">
                  <label className="content-type-toggle">
                    <input
                      type="checkbox"
                      checked={draft.public}
                      onChange={(event) => patchDraft('public', event.target.checked)}
                    />
                    <span><strong>Public</strong><small>Available to frontend queries and routes.</small></span>
                  </label>
                  <label className="content-type-toggle">
                    <input
                      type="checkbox"
                      checked={draft.hierarchical}
                      onChange={(event) => patchDraft('hierarchical', event.target.checked)}
                    />
                    <span><strong>Hierarchical</strong><small>Allow parent/child record relationships.</small></span>
                  </label>
                </div>
              </div>

              <div className="content-type-form-section">
                <div className="content-type-form-section-heading">
                  <strong>Core supports</strong>
                  <span>Enable the built-in editing surfaces available to records of this type.</span>
                </div>
                <div className="content-type-support-grid">
                  {([
                    ['title', 'Title', 'Primary record title.'],
                    ['editor', 'Editor', 'Main rich content body.'],
                    ['excerpt', 'Excerpt', 'Short summary content.'],
                    ['featuredImage', 'Featured image', 'Primary media reference.'],
                  ] as const).map(([key, label, description]) => (
                    <label className="content-type-support" key={key}>
                      <input
                        type="checkbox"
                        checked={draft.supports[key]}
                        onChange={(event) => patchSupport(key, event.target.checked)}
                      />
                      <span><strong>{label}</strong><small>{description}</small></span>
                    </label>
                  ))}
                </div>
              </div>

              {validation && !validation.ok ? (
                <div className="content-type-validation-summary" role="alert">
                  <strong>Resolve {validation.issues.length} validation {validation.issues.length === 1 ? 'issue' : 'issues'} before saving.</strong>
                </div>
              ) : null}
            </form>
          )}
        </div>
      </div>

      <div
        className="content-type-editor-status"
        data-tone={status.tone}
        aria-live="polite"
      >
        <span>{status.message}</span>
        <code>{session.saveState}</code>
      </div>
    </section>
  );
}
