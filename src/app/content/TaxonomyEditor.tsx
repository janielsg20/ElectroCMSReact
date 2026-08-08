import { useMemo, useState, type ChangeEvent } from 'react';
import {
  createDefaultTaxonomyDefinition,
  listContentTypeDefinitions,
  listTaxonomyDefinitions,
  validateTaxonomyDefinition,
  type TaxonomyDefinition,
} from '../../core/content';
import { isJsonObject } from '../../core/domain';
import { useProjectSession } from '../project/project-session-context';
import './taxonomy-editor.css';

type EditorMode = 'empty' | 'create' | 'edit';
type StatusTone = 'idle' | 'success' | 'error';

interface EditorStatus {
  tone: StatusTone;
  message: string;
}

const DEFAULT_STATUS: EditorStatus = {
  tone: 'idle',
  message: 'Taxonomies classify one or more content types and autosave with the project.',
};

function nextTaxonomyId(existingIds: ReadonlySet<string>): string {
  if (!existingIds.has('taxonomy')) return 'taxonomy';
  let index = 2;
  while (existingIds.has(`taxonomy-${index}`)) index += 1;
  return `taxonomy-${index}`;
}

function fieldGroupLabel(id: string, value: unknown): string {
  if (!isJsonObject(value)) return id;
  return typeof value.label === 'string' && value.label.trim() ? value.label.trim() : id;
}

export function TaxonomyEditor() {
  const session = useProjectSession();
  const taxonomies = useMemo(() => listTaxonomyDefinitions(session.project), [session.project]);
  const contentTypes = useMemo(() => listContentTypeDefinitions(session.project), [session.project]);
  const archiveTemplates = useMemo(
    () => session.project.documentOrder
      .map((id) => session.project.documents[id])
      .filter((document) => document?.kind === 'archive'),
    [session.project.documentOrder, session.project.documents],
  );
  const fieldGroups = useMemo(
    () => Object.entries(session.project.fieldGroups)
      .map(([id, value]) => ({ id, label: fieldGroupLabel(id, value) }))
      .sort((a, b) => a.label.localeCompare(b.label)),
    [session.project.fieldGroups],
  );

  const [mode, setMode] = useState<EditorMode>('empty');
  const [draft, setDraft] = useState<TaxonomyDefinition | null>(null);
  const [status, setStatus] = useState<EditorStatus>(DEFAULT_STATUS);
  const [deleteArmed, setDeleteArmed] = useState(false);

  const validation = draft ? validateTaxonomyDefinition(draft) : null;
  const issuesByPath = new Map(
    validation && !validation.ok ? validation.issues.map((issue) => [issue.path, issue.message]) : [],
  );

  const beginCreate = () => {
    if (contentTypes.length === 0) {
      setStatus({ tone: 'error', message: 'Create at least one Content Type before creating a taxonomy.' });
      return;
    }
    const ids = new Set(taxonomies.map((taxonomy) => taxonomy.id));
    const id = nextTaxonomyId(ids);
    setMode('create');
    setDraft(createDefaultTaxonomyDefinition(id, 'New Taxonomy', [contentTypes[0]!.id]));
    setDeleteArmed(false);
    setStatus({ tone: 'idle', message: 'Configure classification behavior and target content types.' });
  };

  const selectTaxonomy = (taxonomy: TaxonomyDefinition) => {
    setMode('edit');
    setDraft(structuredClone(taxonomy));
    setDeleteArmed(false);
    setStatus({ tone: 'idle', message: `Editing ${taxonomy.label}.` });
  };

  const patchDraft = <K extends keyof TaxonomyDefinition>(key: K, value: TaxonomyDefinition[K]) => {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
    setDeleteArmed(false);
  };

  const toggleId = (key: 'contentTypeIds' | 'fieldGroupIds', id: string, checked: boolean) => {
    setDraft((current) => {
      if (!current) return current;
      const values = new Set(current[key]);
      if (checked) values.add(id);
      else values.delete(id);
      return { ...current, [key]: [...values] };
    });
    setDeleteArmed(false);
  };

  const handleText =
    (key: 'id' | 'label' | 'singularLabel' | 'slug' | 'description') =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      patchDraft(key, event.target.value);
    };

  const saveDraft = () => {
    if (!draft || !validation?.ok) return;
    const result = mode === 'create'
      ? session.createTaxonomy(draft)
      : session.updateTaxonomy(draft.id, draft);
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

  const deleteDraft = () => {
    if (!draft || mode !== 'edit') return;
    if (!deleteArmed) {
      setDeleteArmed(true);
      setStatus({ tone: 'idle', message: `Confirm deletion of ${draft.label}.` });
      return;
    }
    const result = session.removeTaxonomy(draft.id);
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
    <section className="taxonomy-editor" aria-label="Taxonomies">
      <header className="taxonomy-editor-header">
        <div>
          <span className="taxonomy-editor-eyebrow">Dynamic content · MF-038</span>
          <h3>Taxonomies</h3>
          <p>Create hierarchical categories or flat tags and attach them to one or more content types.</p>
        </div>
        <div className="taxonomy-editor-summary" aria-label="Taxonomy summary">
          <strong>{taxonomies.length}</strong>
          <span>{taxonomies.length === 1 ? 'taxonomy' : 'taxonomies'}</span>
          <button type="button" onClick={beginCreate} disabled={contentTypes.length === 0}>New taxonomy</button>
        </div>
      </header>

      {contentTypes.length === 0 ? (
        <div className="taxonomy-prerequisite" role="status">
          <strong>Content Type required</strong>
          <span>Taxonomies must be associated with at least one content type. Create one in the Content Types tab first.</span>
        </div>
      ) : null}

      <div className="taxonomy-editor-grid">
        <aside className="taxonomy-list" aria-label="Taxonomy list">
          <div className="taxonomy-list-heading">
            <span>Classification</span>
            <code>{taxonomies.length}</code>
          </div>
          {taxonomies.length === 0 ? (
            <div className="taxonomy-empty-list">
              <strong>No taxonomies yet</strong>
              <span>Use hierarchical taxonomies for categories and flat taxonomies for tag-like classification.</span>
            </div>
          ) : (
            <div className="taxonomy-list-items">
              {taxonomies.map((taxonomy) => {
                const selected = mode === 'edit' && draft?.id === taxonomy.id;
                return (
                  <button
                    key={taxonomy.id}
                    type="button"
                    className="taxonomy-list-item"
                    data-selected={selected ? 'true' : 'false'}
                    aria-pressed={selected}
                    onClick={() => selectTaxonomy(taxonomy)}
                  >
                    <span className="taxonomy-list-item-main">
                      <strong>{taxonomy.label}</strong>
                      <code>/{taxonomy.slug}</code>
                    </span>
                    <span className="taxonomy-list-item-meta">
                      <span>{taxonomy.hierarchical ? 'Hierarchical' : 'Flat'}</span>
                      <span>{taxonomy.contentTypeIds.length} {taxonomy.contentTypeIds.length === 1 ? 'target' : 'targets'}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        <div className="taxonomy-detail">
          {!draft ? (
            <div className="taxonomy-detail-empty">
              <span aria-hidden="true">#</span>
              <strong>Select a taxonomy or create a new one</strong>
              <p>Associations, hierarchy and template references stay visible in one contextual panel.</p>
              <button type="button" onClick={beginCreate} disabled={contentTypes.length === 0}>Create taxonomy</button>
            </div>
          ) : (
            <form
              className="taxonomy-form"
              onSubmit={(event) => {
                event.preventDefault();
                saveDraft();
              }}
            >
              <div className="taxonomy-form-toolbar">
                <div>
                  <span>{mode === 'create' ? 'New taxonomy' : 'Taxonomy settings'}</span>
                  <strong>{draft.label || draft.id}</strong>
                </div>
                <div className="taxonomy-form-actions">
                  {mode === 'edit' ? (
                    <button
                      type="button"
                      className="taxonomy-delete"
                      data-armed={deleteArmed ? 'true' : 'false'}
                      onClick={deleteDraft}
                    >
                      {deleteArmed ? 'Confirm delete' : 'Delete'}
                    </button>
                  ) : null}
                  <button type="submit" className="taxonomy-save" disabled={!validation?.ok}>
                    {mode === 'create' ? 'Create taxonomy' : 'Save changes'}
                  </button>
                </div>
              </div>

              <section className="taxonomy-form-section">
                <div className="taxonomy-form-section-heading">
                  <strong>Identity</strong>
                  <span>Stable identifiers and route-friendly labels.</span>
                </div>
                <div className="taxonomy-field-grid">
                  <label className="taxonomy-field">
                    <span>ID</span>
                    <input
                      aria-label="Taxonomy ID"
                      value={draft.id}
                      disabled={mode === 'edit'}
                      onChange={handleText('id')}
                      aria-invalid={issuesByPath.has('id')}
                    />
                    <small>{issuesByPath.get('id') ?? 'Immutable after creation · kebab-case'}</small>
                  </label>
                  <label className="taxonomy-field">
                    <span>URL slug</span>
                    <div className="taxonomy-slug-control">
                      <span aria-hidden="true">/</span>
                      <input
                        aria-label="Taxonomy slug"
                        value={draft.slug}
                        onChange={handleText('slug')}
                        aria-invalid={issuesByPath.has('slug')}
                      />
                    </div>
                    <small>{issuesByPath.get('slug') ?? 'Unique across taxonomies'}</small>
                  </label>
                  <label className="taxonomy-field">
                    <span>Plural label</span>
                    <input
                      aria-label="Taxonomy plural label"
                      value={draft.label}
                      onChange={handleText('label')}
                      aria-invalid={issuesByPath.has('label')}
                    />
                    <small>{issuesByPath.get('label') ?? 'Example: Categories'}</small>
                  </label>
                  <label className="taxonomy-field">
                    <span>Singular label</span>
                    <input
                      aria-label="Taxonomy singular label"
                      value={draft.singularLabel}
                      onChange={handleText('singularLabel')}
                      aria-invalid={issuesByPath.has('singularLabel')}
                    />
                    <small>{issuesByPath.get('singularLabel') ?? 'Example: Category'}</small>
                  </label>
                  <label className="taxonomy-field taxonomy-field--wide">
                    <span>Description</span>
                    <textarea
                      aria-label="Taxonomy description"
                      rows={3}
                      value={draft.description}
                      onChange={handleText('description')}
                      aria-invalid={issuesByPath.has('description')}
                    />
                    <small>{issuesByPath.get('description') ?? 'Optional · up to 280 characters'}</small>
                  </label>
                </div>
              </section>

              <section className="taxonomy-form-section">
                <div className="taxonomy-form-section-heading">
                  <strong>Classification behavior</strong>
                  <span>Choose category-like hierarchy or flat tag-like terms.</span>
                </div>
                <label className="taxonomy-toggle">
                  <input
                    type="checkbox"
                    checked={draft.hierarchical}
                    onChange={(event) => patchDraft('hierarchical', event.target.checked)}
                  />
                  <span>
                    <strong>Hierarchical taxonomy</strong>
                    <small>{draft.hierarchical ? 'Terms may have parent/child relationships.' : 'Terms behave as a flat tag collection.'}</small>
                  </span>
                </label>
              </section>

              <section className="taxonomy-form-section">
                <div className="taxonomy-form-section-heading">
                  <strong>Content Type associations</strong>
                  <span>Every taxonomy must target one or more content models.</span>
                </div>
                <div className="taxonomy-association-grid" aria-label="Taxonomy content type associations">
                  {contentTypes.map((contentType) => (
                    <label className="taxonomy-association" key={contentType.id}>
                      <input
                        type="checkbox"
                        checked={draft.contentTypeIds.includes(contentType.id)}
                        onChange={(event) => toggleId('contentTypeIds', contentType.id, event.target.checked)}
                      />
                      <span><strong>{contentType.label}</strong><small>{contentType.id}</small></span>
                    </label>
                  ))}
                </div>
                {issuesByPath.has('contentTypeIds') ? (
                  <small className="taxonomy-inline-error">{issuesByPath.get('contentTypeIds')}</small>
                ) : null}
              </section>

              <section className="taxonomy-form-section">
                <div className="taxonomy-form-section-heading">
                  <strong>Archive template</strong>
                  <span>Optionally bind this taxonomy to an existing archive document.</span>
                </div>
                <label className="taxonomy-field">
                  <span>Archive template</span>
                  <select
                    aria-label="Taxonomy archive template"
                    value={draft.archiveTemplateId ?? ''}
                    onChange={(event) => patchDraft('archiveTemplateId', event.target.value || null)}
                  >
                    <option value="">Use default archive rendering</option>
                    {archiveTemplates.map((template) => (
                      <option key={template!.id} value={template!.id}>{template!.name}</option>
                    ))}
                  </select>
                  <small>{archiveTemplates.length === 0 ? 'No archive documents exist yet.' : 'Only archive documents are eligible.'}</small>
                </label>
              </section>

              <section className="taxonomy-form-section">
                <div className="taxonomy-form-section-heading">
                  <strong>Custom field groups</strong>
                  <span>MF-038 stores field-group associations; field definitions/editor arrive in MF-039/MF-040.</span>
                </div>
                {fieldGroups.length === 0 ? (
                  <div className="taxonomy-scope-note">No field groups exist in this project yet.</div>
                ) : (
                  <div className="taxonomy-association-grid" aria-label="Taxonomy field group associations">
                    {fieldGroups.map((group) => (
                      <label className="taxonomy-association" key={group.id}>
                        <input
                          type="checkbox"
                          checked={draft.fieldGroupIds.includes(group.id)}
                          onChange={(event) => toggleId('fieldGroupIds', group.id, event.target.checked)}
                        />
                        <span><strong>{group.label}</strong><small>{group.id}</small></span>
                      </label>
                    ))}
                  </div>
                )}
              </section>

              {validation && !validation.ok ? (
                <div className="taxonomy-validation-summary" role="alert">
                  <strong>Resolve {validation.issues.length} validation {validation.issues.length === 1 ? 'issue' : 'issues'} before saving.</strong>
                </div>
              ) : null}
            </form>
          )}
        </div>
      </div>

      <div className="taxonomy-editor-status" data-tone={status.tone} aria-live="polite">
        <span>{status.message}</span>
        <code>{session.saveState}</code>
      </div>
    </section>
  );
}
