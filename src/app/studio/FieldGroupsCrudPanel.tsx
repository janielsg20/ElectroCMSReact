import { useMemo, useState } from 'react';
import {
  CONDITIONAL_OPERATORS,
  RELATION_FIELD_SIDES,
  createContentFieldTypeRegistry,
  createDefaultCustomFieldDefinition,
  createDefaultFieldGroupDefinition,
  isMf042AdvancedField,
  listFieldGroupDefinitions,
  listRelationDefinitions,
  listTaxonomyDefinitions,
  validateFieldGroupDefinition,
  type CustomFieldDefinition,
  type FieldGroupDefinition,
  type FieldTypeDefinition,
} from '../../core/content';
import type { JsonObject, JsonValue } from '../../core/domain';
import { Icon } from '../components/Icon';
import { useProjectSession } from '../project/project-session-context';

interface FieldGroupsCrudPanelProps { query: string; }

function createDraft(): FieldGroupDefinition { return createDefaultFieldGroupDefinition('field-group', 'Field Group'); }
function fieldBaseId(type: string): string { return (type.split('/').at(-1) ?? 'field').replace(/[^a-z0-9-]/g, '-') || 'field'; }
function nextFieldId(type: string, fields: readonly CustomFieldDefinition[]): string {
  const base = fieldBaseId(type); const existing = new Set(fields.map((field) => field.id));
  if (!existing.has(base)) return base; let index = 2; while (existing.has(`${base}-${index}`)) index += 1; return `${base}-${index}`;
}
function configWithValue(config: JsonObject, key: string, value: JsonValue | undefined): JsonObject {
  const next = structuredClone(config); if (value === undefined) delete next[key]; else next[key] = value; return next;
}
function optionsText(value: JsonValue | undefined): string {
  if (!Array.isArray(value)) return '';
  return value.filter((item): item is JsonObject => typeof item === 'object' && item !== null && !Array.isArray(item))
    .map((item) => `${typeof item.label === 'string' ? item.label : ''}=${typeof item.value === 'string' ? item.value : ''}`).join('\n');
}
function parseOptions(value: string): JsonValue[] {
  return value.split('\n').map((line) => line.trim()).filter(Boolean).map((line) => {
    const separator = line.indexOf('='); const label = separator >= 0 ? line.slice(0, separator).trim() : line;
    const optionValue = separator >= 0 ? line.slice(separator + 1).trim() : line; return { label, value: optionValue };
  });
}
function descriptorLabel(key: string): string { return key.replace(/([A-Z])/g, ' $1').replace(/^./, (character) => character.toUpperCase()); }

function FieldConfigEditor({ definition, field, fieldGroups, currentGroupId, siblingFields, relations, taxonomies, onChange }: {
  definition: FieldTypeDefinition;
  field: CustomFieldDefinition;
  fieldGroups: readonly FieldGroupDefinition[];
  currentGroupId: string;
  siblingFields: readonly CustomFieldDefinition[];
  relations: readonly { id: string; label: string }[];
  taxonomies: readonly { id: string; label: string }[];
  onChange(next: CustomFieldDefinition): void;
}) {
  const descriptors = Object.entries(definition.configSchema);
  if (descriptors.length === 0) return <p className="text-[10px] leading-4 text-[var(--color-ec-text-muted)]">This field type has no type-specific settings.</p>;

  return <div className="grid gap-2 sm:grid-cols-2">{descriptors.map(([key, rawDescriptor]) => {
    const descriptor = typeof rawDescriptor === 'string' ? rawDescriptor : 'json';
    const currentValue = field.config[key]; const label = descriptorLabel(key);

    if (descriptor === 'relation-id') return (
      <label key={key} className="sm:col-span-2 text-[10px] font-semibold text-[var(--color-ec-text-muted)]">
        <span className="mb-1 block">{label}</span>
        <select className="ec-control h-8 w-full px-2 text-[10px]" aria-label={`Field config ${label}`} value={typeof currentValue === 'string' ? currentValue : ''} onChange={(event) => onChange({ ...field, config: configWithValue(field.config, key, event.target.value) })}>
          <option value="">Select Relation…</option>{relations.map((relation) => <option key={relation.id} value={relation.id}>{relation.label} · {relation.id}</option>)}
        </select>
        <small className="mt-1 block font-normal">The Relation must exist before this Field Group can be saved.</small>
      </label>
    );
    if (descriptor === 'relation-side') return (
      <label key={key} className="text-[10px] font-semibold text-[var(--color-ec-text-muted)]"><span className="mb-1 block">{label}</span>
        <select className="ec-control h-8 w-full px-2 text-[10px]" aria-label={`Field config ${label}`} value={typeof currentValue === 'string' ? currentValue : 'source'} onChange={(event) => onChange({ ...field, config: configWithValue(field.config, key, event.target.value) })}>
          {RELATION_FIELD_SIDES.map((side) => <option key={side} value={side}>{side}</option>)}
        </select>
      </label>
    );
    if (descriptor === 'taxonomy-id') return (
      <label key={key} className="sm:col-span-2 text-[10px] font-semibold text-[var(--color-ec-text-muted)]"><span className="mb-1 block">{label}</span>
        <select className="ec-control h-8 w-full px-2 text-[10px]" aria-label={`Field config ${label}`} value={typeof currentValue === 'string' ? currentValue : ''} onChange={(event) => onChange({ ...field, config: configWithValue(field.config, key, event.target.value) })}>
          <option value="">Select Taxonomy…</option>{taxonomies.map((taxonomy) => <option key={taxonomy.id} value={taxonomy.id}>{taxonomy.label} · {taxonomy.id}</option>)}
        </select>
      </label>
    );
    if (descriptor === 'field-group-id') return (
      <label key={key} className="sm:col-span-2 text-[10px] font-semibold text-[var(--color-ec-text-muted)]"><span className="mb-1 block">{label}</span>
        <select className="ec-control h-8 w-full px-2 text-[10px]" aria-label={`Field config ${label}`} value={typeof currentValue === 'string' ? currentValue : ''} onChange={(event) => onChange({ ...field, config: configWithValue(field.config, key, event.target.value) })}>
          <option value="">Select Field Group…</option>{fieldGroups.filter((group) => group.id !== currentGroupId).map((group) => <option key={group.id} value={group.id}>{group.label} · {group.id}</option>)}
        </select><small className="mt-1 block font-normal">Only saved reusable groups can be referenced. Cycles and depth &gt; 8 are rejected by core.</small>
      </label>
    );
    if (descriptor === 'field-storage-name') return (
      <label key={key} className="sm:col-span-2 text-[10px] font-semibold text-[var(--color-ec-text-muted)]"><span className="mb-1 block">{label}</span>
        <select className="ec-control h-8 w-full px-2 text-[10px]" aria-label={`Field config ${label}`} value={typeof currentValue === 'string' ? currentValue : ''} onChange={(event) => onChange({ ...field, config: configWithValue(field.config, key, event.target.value) })}>
          <option value="">Select sibling field…</option>{siblingFields.filter((candidate) => candidate.id !== field.id && !isMf042AdvancedField(candidate)).map((candidate) => <option key={candidate.id} value={candidate.name}>{candidate.label} · {candidate.name}</option>)}
        </select><small className="mt-1 block font-normal">Conditional sources must be non-advanced siblings.</small>
      </label>
    );
    if (descriptor === 'conditional-operator') return (
      <label key={key} className="text-[10px] font-semibold text-[var(--color-ec-text-muted)]"><span className="mb-1 block">{label}</span>
        <select className="ec-control h-8 w-full px-2 text-[10px]" aria-label={`Field config ${label}`} value={typeof currentValue === 'string' ? currentValue : 'truthy'} onChange={(event) => onChange({ ...field, config: configWithValue(field.config, key, event.target.value) })}>{CONDITIONAL_OPERATORS.map((operator) => <option key={operator} value={operator}>{operator}</option>)}</select>
      </label>
    );
    if (descriptor === 'calculation-expression') return (
      <label key={key} className="sm:col-span-2 text-[10px] font-semibold text-[var(--color-ec-text-muted)]"><span className="mb-1 block">{label}</span>
        <input className="ec-control h-8 w-full px-2 font-mono text-[10px]" aria-label={`Field config ${label}`} value={typeof currentValue === 'string' ? currentValue : ''} placeholder="quantity * unit_price" onChange={(event) => onChange({ ...field, config: configWithValue(field.config, key, event.target.value) })} />
        <small className="mt-1 block font-normal">Safe arithmetic only: sibling Number/Currency names, + − × ÷ and parentheses. No code execution.</small>
      </label>
    );
    if (descriptor === 'json?') return (
      <label key={key} className="sm:col-span-2 text-[10px] font-semibold text-[var(--color-ec-text-muted)]"><span className="mb-1 block">{label} · JSON</span>
        <textarea key={JSON.stringify(currentValue)} className="ec-control min-h-16 w-full resize-y px-2.5 py-2 font-mono text-[9px]" aria-label={`Field config ${label}`} defaultValue={currentValue === undefined ? '' : JSON.stringify(currentValue, null, 2)} onBlur={(event) => {
          const text = event.target.value.trim(); if (!text) { onChange({ ...field, config: configWithValue(field.config, key, undefined) }); return; }
          try { onChange({ ...field, config: configWithValue(field.config, key, JSON.parse(text) as JsonValue) }); } catch { /* keep last valid config */ }
        }} />
      </label>
    );
    if (descriptor.startsWith('array<')) return (
      <label key={key} className="sm:col-span-2 text-[10px] font-semibold text-[var(--color-ec-text-muted)]"><span className="mb-1 block">{label}</span>
        <textarea className="ec-control min-h-20 w-full resize-y px-2.5 py-2 text-[10px]" aria-label={`Field config ${label}`} value={optionsText(currentValue)} placeholder={'Label=value\nSecond option=second'} onChange={(event) => onChange({ ...field, config: configWithValue(field.config, key, parseOptions(event.target.value)) })} />
        <small className="mt-1 block font-normal">One option per line using Label=value.</small>
      </label>
    );
    if (descriptor.startsWith('integer') || descriptor.startsWith('number')) return (
      <label key={key} className="text-[10px] font-semibold text-[var(--color-ec-text-muted)]"><span className="mb-1 block">{label}</span>
        <input className="ec-control h-8 w-full px-2 text-[10px]" aria-label={`Field config ${label}`} type="number" step={descriptor.startsWith('integer') ? 1 : 'any'} value={typeof currentValue === 'number' ? String(currentValue) : ''} onChange={(event) => onChange({ ...field, config: configWithValue(field.config, key, event.target.value === '' ? undefined : Number(event.target.value)) })} />
      </label>
    );
    if (descriptor.startsWith('string')) return (
      <label key={key} className="text-[10px] font-semibold text-[var(--color-ec-text-muted)]"><span className="mb-1 block">{label}</span>
        <input className="ec-control h-8 w-full px-2 text-[10px]" aria-label={`Field config ${label}`} value={typeof currentValue === 'string' ? currentValue : ''} onChange={(event) => onChange({ ...field, config: configWithValue(field.config, key, event.target.value || undefined) })} />
      </label>
    );
    return <div key={key} className="rounded-[var(--ec-radius-sm)] border border-dashed border-[var(--color-ec-border)] p-2 text-[9px] text-[var(--color-ec-text-muted)]">{label}: portable JSON config.</div>;
  })}</div>;
}

function DefaultValueEditor({ definition, field, onChange }: { definition: FieldTypeDefinition; field: CustomFieldDefinition; onChange(next: CustomFieldDefinition): void }) {
  if (definition.features.defaultValue === 'unsupported') return null;
  if (definition.valueShape === 'string') return <label className="text-[10px] font-semibold text-[var(--color-ec-text-muted)]"><span className="mb-1 block">Default value</span><input className="ec-control h-8 w-full px-2 text-[10px]" aria-label="Field default value" value={typeof field.defaultValue === 'string' ? field.defaultValue : ''} onChange={(event) => onChange({ ...field, defaultValue: event.target.value || null })} /></label>;
  if (definition.valueShape === 'number') return <label className="text-[10px] font-semibold text-[var(--color-ec-text-muted)]"><span className="mb-1 block">Default value</span><input className="ec-control h-8 w-full px-2 text-[10px]" aria-label="Field default value" type="number" value={typeof field.defaultValue === 'number' ? String(field.defaultValue) : ''} onChange={(event) => onChange({ ...field, defaultValue: event.target.value === '' ? null : Number(event.target.value) })} /></label>;
  if (definition.valueShape === 'boolean') return <label className="text-[10px] font-semibold text-[var(--color-ec-text-muted)]"><span className="mb-1 block">Default value</span><select className="ec-control h-8 w-full px-2 text-[10px]" aria-label="Field default value" value={field.defaultValue === null ? 'null' : field.defaultValue === true ? 'true' : 'false'} onChange={(event) => onChange({ ...field, defaultValue: event.target.value === 'null' ? null : event.target.value === 'true' })}><option value="null">No default</option><option value="true">True</option><option value="false">False</option></select></label>;
  return <label className="block text-[10px] font-semibold text-[var(--color-ec-text-muted)]"><span className="mb-1 block">Default value · JSON</span><textarea key={JSON.stringify(field.defaultValue)} className="ec-control min-h-20 w-full resize-y px-2.5 py-2 font-mono text-[9px]" aria-label="Field default value JSON" defaultValue={JSON.stringify(field.defaultValue, null, 2)} onBlur={(event) => { try { onChange({ ...field, defaultValue: JSON.parse(event.target.value) as JsonValue }); } catch { /* keep last valid value */ } }} /></label>;
}

export function FieldGroupsCrudPanel({ query }: FieldGroupsCrudPanelProps) {
  const session = useProjectSession();
  const registry = useMemo(() => createContentFieldTypeRegistry(), []);
  const definitions = useMemo(() => listFieldGroupDefinitions(session.project, registry), [registry, session.project]);
  const relations = useMemo(() => listRelationDefinitions(session.project), [session.project]);
  const taxonomies = useMemo(() => listTaxonomyDefinitions(session.project), [session.project]);
  const availableTypes = useMemo(() => registry.listLatest({ availability: 'available' }), [registry]);
  const modeledTypes = useMemo(() => registry.listLatest({ availability: 'modeled' }), [registry]);
  const normalized = query.trim().toLowerCase();
  const visible = definitions.filter((definition) => !normalized || `${definition.label} ${definition.id} ${definition.fields.map((field) => `${field.label} ${field.name} ${field.type}`).join(' ')}`.toLowerCase().includes(normalized));
  const [selectedId, setSelectedId] = useState<string | null>(null); const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<FieldGroupDefinition>(() => createDraft()); const [selectedFieldIndex, setSelectedFieldIndex] = useState<number | null>(null);
  const [message, setMessage] = useState<{ tone: 'error' | 'success'; text: string } | null>(null); const [deleteArmed, setDeleteArmed] = useState(false); const [typeSearch, setTypeSearch] = useState('');
  const selected = selectedId ? definitions.find((definition) => definition.id === selectedId) ?? null : null;
  const selectedField = selectedFieldIndex === null ? null : draft.fields[selectedFieldIndex] ?? null;
  const selectedType = selectedField ? registry.resolve(selectedField.type, selectedField.typeVersion) : null;
  const filteredTypes = availableTypes.filter((definition) => !typeSearch.trim() || `${definition.metadata.label} ${definition.type} ${definition.metadata.category}`.toLowerCase().includes(typeSearch.trim().toLowerCase()));
  const validation = validateFieldGroupDefinition(session.project, draft, registry);

  const selectDefinition = (definition: FieldGroupDefinition) => { setSelectedId(definition.id); setCreating(false); setDraft(structuredClone(definition)); setSelectedFieldIndex(definition.fields.length ? 0 : null); setMessage(null); setDeleteArmed(false); };
  const beginCreate = () => { setCreating(true); setSelectedId(null); setDraft(createDraft()); setSelectedFieldIndex(null); setMessage(null); setDeleteArmed(false); };
  const updateDraft = <K extends keyof FieldGroupDefinition>(key: K, value: FieldGroupDefinition[K]) => { setDraft((current) => ({ ...current, [key]: value })); setMessage(null); };
  const updateField = (index: number, next: CustomFieldDefinition) => { setDraft((current) => ({ ...current, fields: current.fields.map((item, candidate) => candidate === index ? structuredClone(next) : item) })); setMessage(null); };
  const addField = (type: string) => { const id = nextFieldId(type, draft.fields); const definition = registry.resolve(type); const field = createDefaultCustomFieldDefinition(registry, type, id, definition.metadata.label); setDraft((current) => ({ ...current, fields: [...current.fields, field] })); setSelectedFieldIndex(draft.fields.length); setMessage(null); };
  const removeField = (index: number) => { setDraft((current) => ({ ...current, fields: current.fields.filter((_, candidate) => candidate !== index) })); setSelectedFieldIndex((current) => current === null || draft.fields.length <= 1 ? null : Math.min(current, draft.fields.length - 2)); setMessage(null); };
  const moveField = (index: number, direction: -1 | 1) => { const target = index + direction; if (target < 0 || target >= draft.fields.length) return; const fields = [...draft.fields]; const current = fields[index]; const replacement = fields[target]; if (!current || !replacement) return; fields[index] = replacement; fields[target] = current; updateDraft('fields', fields); setSelectedFieldIndex(target); };
  const changeFieldType = (field: CustomFieldDefinition, type: string): CustomFieldDefinition => { const definition = registry.resolve(type); const replacement = createDefaultCustomFieldDefinition(registry, type, field.id, field.label); return { ...replacement, name: field.name, description: field.description, required: field.required, conditions: structuredClone(field.conditions), roleVisibility: [...field.roleVisibility], placeholder: definition.features.placeholder === 'supported' ? field.placeholder : null }; };
  const save = () => { const result = creating ? session.createFieldGroup(draft) : selected ? session.updateFieldGroup(selected.id, draft) : null; if (!result) return; if (!result.ok) { setMessage({ tone: 'error', text: result.message }); return; } setCreating(false); setSelectedId(result.value.id); setDraft(structuredClone(result.value)); setMessage({ tone: 'success', text: result.changed ? 'Field group saved.' : 'No changes to save.' }); };
  const remove = () => { if (!selected) return; if (!deleteArmed) { setDeleteArmed(true); setMessage(null); return; } const result = session.removeFieldGroup(selected.id); if (!result.ok) { setDeleteArmed(false); setMessage({ tone: 'error', text: result.message }); return; } setDeleteArmed(false); setSelectedId(null); setSelectedFieldIndex(null); setDraft(createDraft()); setMessage({ tone: 'success', text: `Deleted ${selected.label}.` }); };
  const feedback = message ? <div role={message.tone === 'error' ? 'alert' : 'status'} className={`rounded-[var(--ec-radius-md)] border px-3 py-2 text-[10px] ${message.tone === 'error' ? 'border-[var(--color-ec-danger-600)] text-[var(--color-ec-danger-600)]' : 'border-[var(--color-ec-success-600)] text-[var(--color-ec-success-600)]'}`}>{message.text}</div> : null;

  return <div className="grid min-h-0 flex-1 gap-3 xl:grid-cols-[minmax(0,1fr)_520px]">
    <div className="min-h-0 overflow-y-auto"><div className="mb-2 flex items-center justify-between gap-3"><span className="text-[10px] font-semibold text-[var(--color-ec-text-muted)]">{definitions.length} field group{definitions.length === 1 ? '' : 's'}</span><button type="button" className="ec-control ec-focus-ring inline-flex h-8 items-center gap-1.5 px-2.5 text-[11px] font-semibold" onClick={beginCreate}><Icon name="plus" size={12} />New field group</button></div>
      {visible.length ? <div className="overflow-hidden rounded-[var(--ec-radius-lg)] border border-[var(--color-ec-border)] bg-[var(--color-ec-surface)] shadow-[var(--ec-shadow-panel)]"><div className="grid min-h-9 grid-cols-[minmax(170px,1.2fr)_100px_90px] items-center gap-3 border-b border-[var(--color-ec-border)] bg-[var(--color-ec-surface-subtle)] px-3 text-[9px] font-bold uppercase tracking-[.1em] text-[var(--color-ec-text-muted)]"><span>Name</span><span>Presentation</span><span>Fields</span></div>{visible.map((definition) => <button key={definition.id} type="button" className="grid min-h-12 w-full grid-cols-[minmax(170px,1.2fr)_100px_90px] items-center gap-3 border-b border-[var(--color-ec-border)] px-3 text-left last:border-0 hover:bg-[var(--color-ec-surface-subtle)] data-[active=true]:bg-[var(--color-ec-accent-soft)]" data-active={!creating && selected?.id === definition.id ? 'true' : 'false'} onClick={() => selectDefinition(definition)}><span className="min-w-0"><strong className="block truncate text-[11px] text-[var(--color-ec-text)]">{definition.label}</strong><small className="font-mono text-[9px] text-[var(--color-ec-text-muted)]">{definition.id}</small></span><span className="text-[10px] capitalize text-[var(--color-ec-text-muted)]">{definition.presentation}</span><span className="text-[10px] font-semibold text-[var(--color-ec-text-muted)]">{definition.fields.length}</span></button>)}</div> : <div className="grid min-h-64 place-items-center rounded-[var(--ec-radius-lg)] border border-dashed border-[var(--color-ec-border)] bg-[var(--color-ec-surface-subtle)] text-center"><div><Icon name="form" size={22} /><strong className="mt-3 block text-[12px] text-[var(--color-ec-text)]">{definitions.length ? 'No matching field groups' : 'No field groups yet'}</strong><p className="mt-1 text-[10px] text-[var(--color-ec-text-muted)]">Build reusable portable schemas from the versioned field registry.</p></div></div>}
    </div>
    <aside className="min-h-0 overflow-y-auto rounded-[var(--ec-radius-lg)] border border-[var(--color-ec-border)] bg-[var(--color-ec-surface)] shadow-[var(--ec-shadow-panel)]" aria-label="Field group editor">
      <header className="border-b border-[var(--color-ec-border)] px-3 py-3"><span className="text-[9px] font-bold uppercase tracking-[.12em] text-[var(--color-ec-accent)]">{creating ? 'Create' : selected ? 'Edit' : 'Field group'}</span><strong className="mt-1 block text-[13px] text-[var(--color-ec-text)]">{creating ? 'New field group' : selected?.label ?? 'Select or create a field group'}</strong></header>
      {message && !creating && !selected ? <div className="p-3 pb-0">{feedback}</div> : null}
      {(creating || selected) ? <div className="space-y-4 p-3">
        <div className="grid gap-2 sm:grid-cols-2"><label className="text-[10px] font-semibold text-[var(--color-ec-text-muted)]"><span className="mb-1 block">ID</span><input className="ec-control h-8 w-full px-2 text-[10px]" aria-label="Field group id" value={draft.id} disabled={!creating} onChange={(event) => updateDraft('id', event.target.value)} /></label><label className="text-[10px] font-semibold text-[var(--color-ec-text-muted)]"><span className="mb-1 block">Presentation</span><select className="ec-control h-8 w-full px-2 text-[10px]" aria-label="Field group presentation" value={draft.presentation} onChange={(event) => updateDraft('presentation', event.target.value as FieldGroupDefinition['presentation'])}><option value="group">Group</option><option value="tabs">Tabs</option></select></label><label className="sm:col-span-2 text-[10px] font-semibold text-[var(--color-ec-text-muted)]"><span className="mb-1 block">Label</span><input className="ec-control h-8 w-full px-2 text-[10px]" aria-label="Field group label" value={draft.label} onChange={(event) => updateDraft('label', event.target.value)} /></label><label className="sm:col-span-2 text-[10px] font-semibold text-[var(--color-ec-text-muted)]"><span className="mb-1 block">Description</span><textarea className="ec-control min-h-16 w-full resize-y px-2.5 py-2 text-[10px]" aria-label="Field group description" value={draft.description} onChange={(event) => updateDraft('description', event.target.value)} /></label></div>
        <section className="rounded-[var(--ec-radius-md)] border border-[var(--color-ec-border)]" aria-label="Field definitions"><header className="border-b border-[var(--color-ec-border)] px-3 py-2"><strong className="block text-[10px] text-[var(--color-ec-text)]">Fields</strong><span className="text-[9px] text-[var(--color-ec-text-muted)]">{draft.fields.length} ordered field{draft.fields.length === 1 ? '' : 's'}</span></header>{draft.fields.length ? <div className="divide-y divide-[var(--color-ec-border)]">{draft.fields.map((field, index) => <div key={`${field.id}-${index}`} className="flex min-h-10 items-center gap-2 px-2 py-1.5 data-[active=true]:bg-[var(--color-ec-accent-soft)]" data-active={selectedFieldIndex === index ? 'true' : 'false'}><button type="button" className="min-w-0 flex-1 text-left" onClick={() => setSelectedFieldIndex(index)}><strong className="block truncate text-[10px] text-[var(--color-ec-text)]">{field.label}</strong><span className="block truncate font-mono text-[8px] text-[var(--color-ec-text-muted)]">{field.name} · {field.type}@{field.typeVersion}</span></button><button type="button" className="ec-control ec-focus-ring size-7 text-[10px]" aria-label={`Move ${field.label} up`} disabled={index === 0} onClick={() => moveField(index, -1)}>↑</button><button type="button" className="ec-control ec-focus-ring size-7 text-[10px]" aria-label={`Move ${field.label} down`} disabled={index === draft.fields.length - 1} onClick={() => moveField(index, 1)}>↓</button><button type="button" className="ec-control ec-focus-ring size-7 text-[var(--color-ec-danger-600)]" aria-label={`Remove ${field.label}`} onClick={() => removeField(index)}><Icon name="close" size={11} /></button></div>)}</div> : <p className="p-3 text-[10px] text-[var(--color-ec-text-muted)]">No fields yet. Add one from the registry below.</p>}</section>
        <section className="rounded-[var(--ec-radius-md)] border border-[var(--color-ec-border)] p-3" aria-label="Field type library"><div className="mb-2 flex items-center gap-2"><Icon name="search" size={11} /><input className="ec-control h-8 min-w-0 flex-1 px-2 text-[10px]" aria-label="Search field types" placeholder={`Search ${availableTypes.length} available field types…`} value={typeSearch} onChange={(event) => setTypeSearch(event.target.value)} /></div><div className="grid max-h-36 grid-cols-2 gap-1 overflow-y-auto sm:grid-cols-3">{filteredTypes.map((definition) => <button key={`${definition.type}@${definition.version}`} type="button" className="ec-control ec-focus-ring min-h-8 px-2 text-left text-[9px]" aria-label={`Add ${definition.metadata.label} field`} onClick={() => addField(definition.type)}><strong className="block truncate">{definition.metadata.label}</strong><span className="block truncate text-[8px] text-[var(--color-ec-text-muted)]">{definition.metadata.category} · v{definition.version}</span></button>)}</div><p className="mt-2 text-[8px] leading-4 text-[var(--color-ec-text-muted)]">MF-043 enables Relation, User and Taxonomy v2 while preserving their modeled v1 contracts. {modeledTypes.length} latest modeled type{modeledTypes.length === 1 ? '' : 's'} remain.</p></section>
        {selectedField && selectedType && selectedFieldIndex !== null ? <section className="space-y-3 rounded-[var(--ec-radius-md)] border border-[var(--color-ec-border)] p-3" aria-label="Selected field editor"><div className="flex items-center justify-between gap-2"><div><span className="text-[8px] font-bold uppercase tracking-[.1em] text-[var(--color-ec-text-muted)]">Selected field</span><strong className="block text-[11px] text-[var(--color-ec-text)]">{selectedField.label}</strong></div><span className="rounded-[var(--ec-radius-sm)] bg-[var(--color-ec-surface-muted)] px-2 py-1 font-mono text-[8px] text-[var(--color-ec-text-muted)]">{selectedField.type}@{selectedField.typeVersion}</span></div><div className="grid gap-2 sm:grid-cols-2"><label className="text-[10px] font-semibold text-[var(--color-ec-text-muted)]"><span className="mb-1 block">ID</span><input className="ec-control h-8 w-full px-2 text-[10px]" aria-label="Field id" value={selectedField.id} onChange={(event) => updateField(selectedFieldIndex, { ...selectedField, id: event.target.value })} /></label><label className="text-[10px] font-semibold text-[var(--color-ec-text-muted)]"><span className="mb-1 block">Storage name</span><input className="ec-control h-8 w-full px-2 font-mono text-[10px]" aria-label="Field storage name" value={selectedField.name} onChange={(event) => updateField(selectedFieldIndex, { ...selectedField, name: event.target.value })} /></label><label className="text-[10px] font-semibold text-[var(--color-ec-text-muted)]"><span className="mb-1 block">Label</span><input className="ec-control h-8 w-full px-2 text-[10px]" aria-label="Field label" value={selectedField.label} onChange={(event) => updateField(selectedFieldIndex, { ...selectedField, label: event.target.value })} /></label><label className="text-[10px] font-semibold text-[var(--color-ec-text-muted)]"><span className="mb-1 block">Type</span><select className="ec-control h-8 w-full px-2 text-[10px]" aria-label="Field type" value={selectedField.type} onChange={(event) => updateField(selectedFieldIndex, changeFieldType(selectedField, event.target.value))}>{availableTypes.map((definition) => <option key={`${definition.type}@${definition.version}`} value={definition.type}>{definition.metadata.label}</option>)}</select></label></div><label className="block text-[10px] font-semibold text-[var(--color-ec-text-muted)]"><span className="mb-1 block">Description</span><textarea className="ec-control min-h-14 w-full resize-y px-2.5 py-2 text-[10px]" aria-label="Field description" value={selectedField.description} onChange={(event) => updateField(selectedFieldIndex, { ...selectedField, description: event.target.value })} /></label><div className="grid gap-2 sm:grid-cols-2">{selectedType.features.placeholder === 'supported' ? <label className="text-[10px] font-semibold text-[var(--color-ec-text-muted)]"><span className="mb-1 block">Placeholder</span><input className="ec-control h-8 w-full px-2 text-[10px]" aria-label="Field placeholder" value={selectedField.placeholder ?? ''} onChange={(event) => updateField(selectedFieldIndex, { ...selectedField, placeholder: event.target.value || null })} /></label> : null}<label className="flex min-h-8 items-center gap-2 self-end text-[10px] font-semibold text-[var(--color-ec-text)]"><input type="checkbox" aria-label="Field required" checked={selectedField.required} onChange={(event) => updateField(selectedFieldIndex, { ...selectedField, required: event.target.checked })} />Required field</label></div><FieldConfigEditor definition={selectedType} field={selectedField} fieldGroups={definitions} currentGroupId={draft.id} siblingFields={draft.fields} relations={relations} taxonomies={taxonomies} onChange={(next) => updateField(selectedFieldIndex, next)} /><DefaultValueEditor definition={selectedType} field={selectedField} onChange={(next) => updateField(selectedFieldIndex, next)} /></section> : null}
        {!validation.ok ? <div role="alert" className="rounded-[var(--ec-radius-md)] border border-[var(--color-ec-danger-600)] p-3 text-[9px] text-[var(--color-ec-danger-600)]"><strong className="block">Resolve {validation.issues.length} schema issue{validation.issues.length === 1 ? '' : 's'}.</strong><ul className="mt-1 list-disc space-y-1 pl-4">{validation.issues.slice(0, 5).map((issue, index) => <li key={`${issue.path}-${index}`}>{issue.message}</li>)}</ul></div> : null}
        {message ? feedback : null}<div className="flex flex-wrap gap-2 border-t border-[var(--color-ec-border)] pt-3"><button type="button" className="ec-focus-ring inline-flex h-9 items-center justify-center rounded-[var(--ec-radius-md)] bg-[var(--color-ec-accent)] px-3 text-[11px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50" disabled={!validation.ok} onClick={save}>{creating ? 'Create field group' : 'Save changes'}</button>{creating ? <button type="button" className="ec-control ec-focus-ring h-9 px-3 text-[11px] font-semibold" onClick={() => { setCreating(false); setSelectedId(null); setSelectedFieldIndex(null); setMessage(null); }}>Cancel</button> : null}{!creating && selected ? <button type="button" className="ec-control ec-focus-ring ml-auto h-9 px-3 text-[11px] font-semibold text-[var(--color-ec-danger-600)]" onClick={remove}>{deleteArmed ? 'Confirm delete' : 'Delete'}</button> : null}</div>
      </div> : <div className="p-4 text-[10px] leading-5 text-[var(--color-ec-text-muted)]">Select a field group from the list or create a new one.</div>}
    </aside>
  </div>;
}
