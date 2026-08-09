import {
  MAX_ADVANCED_FIELD_DEPTH,
  MAX_REPEATER_ITEMS,
  advancedFieldGroupReference,
  createContentFieldTypeRegistry,
  createGroupDefaultValue,
  evaluateCalculatedField,
  evaluateConditionalField,
  isMf042AdvancedField,
  isMf043ReferenceField,
  type CustomFieldDefinition,
  type FieldGroupDefinition,
} from '../../core/content';
import { isJsonObject, type JsonObject, type JsonValue } from '../../core/domain';
import type { CanonicalProject } from '../../core/project';
import { ReferenceRecordFieldControl } from './ReferenceRecordFieldControl';

const registry = createContentFieldTypeRegistry();

interface AdvancedRecordFieldControlProps {
  project: CanonicalProject;
  ownerContentTypeId: string;
  field: CustomFieldDefinition;
  value: JsonValue | undefined;
  siblingValues: JsonObject;
  fieldGroups: readonly FieldGroupDefinition[];
  onChange(value: JsonValue): void;
  depth?: number;
}

function displayValue(value: JsonValue | undefined): string {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  return JSON.stringify(value);
}

function resolveGroup(fieldGroups: readonly FieldGroupDefinition[], field: CustomFieldDefinition): FieldGroupDefinition | null {
  const id = advancedFieldGroupReference(field);
  return id ? fieldGroups.find((group) => group.id === id) ?? null : null;
}

function groupDefaults(group: FieldGroupDefinition, fieldGroups: readonly FieldGroupDefinition[], depth: number): JsonObject {
  return createGroupDefaultValue(group, { registry, resolveGroup: (id) => fieldGroups.find((candidate) => candidate.id === id) ?? null, depth });
}

function PrimitiveNestedField({ field, value, onChange }: { field: CustomFieldDefinition; value: JsonValue | undefined; onChange(value: JsonValue): void }) {
  const label = field.label;
  if (field.type === 'core/textarea' || field.type === 'core/rich-text') return <textarea className="ec-control min-h-20 w-full resize-y px-2.5 py-2 text-[10px]" aria-label={label} rows={field.type === 'core/rich-text' ? 5 : 3} value={typeof value === 'string' ? value : ''} placeholder={field.placeholder ?? undefined} onChange={(event) => onChange(event.target.value)} />;
  if (field.type === 'core/number' || field.type === 'core/currency') return <input className="ec-control h-8 w-full px-2 text-[10px]" aria-label={label} type="number" step={typeof field.config.step === 'number' ? field.config.step : 'any'} value={typeof value === 'number' ? String(value) : ''} onChange={(event) => onChange(event.target.value === '' ? null : Number(event.target.value))} />;
  if (field.type === 'core/checkbox' || field.type === 'core/switch') return <label className="flex min-h-9 items-center gap-2 rounded-[var(--ec-radius-sm)] border border-[var(--color-ec-border)] px-2.5 text-[10px] text-[var(--color-ec-text)]"><input aria-label={label} type="checkbox" checked={value === true} onChange={(event) => onChange(event.target.checked)} /><span>{value === true ? 'Enabled' : 'Disabled'}</span></label>;
  if (field.type === 'core/select' || field.type === 'core/radio') {
    const options = Array.isArray(field.config.options) ? field.config.options.filter((option): option is JsonObject => isJsonObject(option) && typeof option.value === 'string' && typeof option.label === 'string') : [];
    return <select className="ec-control h-8 w-full px-2 text-[10px]" aria-label={label} value={typeof value === 'string' ? value : ''} onChange={(event) => onChange(event.target.value || null)}><option value="">Select…</option>{options.map((option) => <option key={String(option.value)} value={String(option.value)}>{String(option.label)}</option>)}</select>;
  }
  const htmlType = field.type === 'core/email' ? 'email' : field.type === 'core/url' ? 'url' : field.type === 'core/date' ? 'date' : field.type === 'core/time' ? 'time' : field.type === 'core/datetime' ? 'datetime-local' : field.type === 'core/color' ? 'color' : 'text';
  return <input className="ec-control h-8 w-full px-2 text-[10px]" aria-label={label} type={htmlType} value={displayValue(value)} placeholder={field.placeholder ?? undefined} onChange={(event) => onChange(event.target.value || null)} />;
}

function NestedGroupEditor({ project, ownerContentTypeId, group, value, fieldGroups, onChange, depth }: {
  project: CanonicalProject;
  ownerContentTypeId: string;
  group: FieldGroupDefinition;
  value: JsonObject;
  fieldGroups: readonly FieldGroupDefinition[];
  onChange(value: JsonObject): void;
  depth: number;
}) {
  if (depth > MAX_ADVANCED_FIELD_DEPTH) return <div role="alert" className="rounded-[var(--ec-radius-sm)] border border-[var(--color-ec-danger-600)] p-2 text-[9px] text-[var(--color-ec-danger-600)]">Nested field depth exceeds the safe editor limit.</div>;
  const defaults = groupDefaults(group, fieldGroups, depth); const values: JsonObject = { ...defaults, ...value };
  return <div className="grid gap-3 sm:grid-cols-2" data-advanced-depth={depth}>{group.fields.map((field) => {
    const current = values[field.name]; const complex = isMf042AdvancedField(field) || isMf043ReferenceField(field);
    return <div className={complex ? 'sm:col-span-2' : ''} key={field.id}><div className="mb-1 flex items-center justify-between gap-2 text-[9px] font-semibold text-[var(--color-ec-text-muted)]"><strong>{field.label}{field.required ? ' *' : ''}</strong><code className="font-mono font-normal">{field.name}</code></div>{complex ? <AdvancedRecordFieldControl project={project} ownerContentTypeId={ownerContentTypeId} field={field} value={current} siblingValues={values} fieldGroups={fieldGroups} onChange={(next) => onChange({ ...values, [field.name]: next })} depth={depth + 1} /> : <PrimitiveNestedField field={field} value={current} onChange={(next) => onChange({ ...values, [field.name]: next })} />}{field.description ? <small className="mt-1 block text-[8px] leading-4 text-[var(--color-ec-text-muted)]">{field.description}</small> : null}</div>;
  })}</div>;
}

export function AdvancedRecordFieldControl({ project, ownerContentTypeId, field, value, siblingValues, fieldGroups, onChange, depth = 0 }: AdvancedRecordFieldControlProps) {
  if (depth > MAX_ADVANCED_FIELD_DEPTH) return <div role="alert" className="rounded-[var(--ec-radius-sm)] border border-[var(--color-ec-danger-600)] p-2 text-[9px] text-[var(--color-ec-danger-600)]">Advanced field depth exceeds the safe editor limit.</div>;
  if (isMf043ReferenceField(field)) return <ReferenceRecordFieldControl project={project} ownerContentTypeId={ownerContentTypeId} field={field} value={value} onChange={onChange} />;
  if (!isMf042AdvancedField(field)) return <div role="status" className="rounded-[var(--ec-radius-sm)] border border-dashed border-[var(--color-ec-border)] p-2 text-[9px] text-[var(--color-ec-text-muted)]"><strong className="block text-[var(--color-ec-text)]">Modeled field version</strong><span>{field.type}@{field.typeVersion} has no active runtime behavior.</span></div>;

  if (field.type === 'core/calculated') {
    const result = evaluateCalculatedField(field, siblingValues);
    return <div role="status" aria-label={`Calculated ${field.label}`} className="flex items-center justify-between gap-3 rounded-[var(--ec-radius-sm)] border border-[var(--color-ec-border)] bg-[var(--color-ec-surface-subtle)] px-3 py-2"><div><span className="block text-[8px] font-bold uppercase tracking-[.1em] text-[var(--color-ec-text-muted)]">Calculated</span><code className="text-[8px] text-[var(--color-ec-text-muted)]">{String(field.config.expression ?? '')}</code></div><strong className="text-[14px] text-[var(--color-ec-text)]">{result.ok ? result.value : '—'}</strong></div>;
  }

  if (field.type === 'core/conditional') {
    const active = evaluateConditionalField(field, siblingValues);
    if (!active) return <div role="status" className="rounded-[var(--ec-radius-sm)] border border-dashed border-[var(--color-ec-border)] bg-[var(--color-ec-surface-subtle)] p-2 text-[9px] text-[var(--color-ec-text-muted)]"><strong className="block text-[var(--color-ec-text)]">Condition not met</strong><span>This nested group is inactive and will persist as null.</span></div>;
    const group = resolveGroup(fieldGroups, field); if (!group) return <div role="alert" className="text-[9px] text-[var(--color-ec-danger-600)]">Referenced Field Group is unavailable.</div>;
    const current = isJsonObject(value) ? value : groupDefaults(group, fieldGroups, depth + 1);
    return <div className="rounded-[var(--ec-radius-md)] border border-[var(--color-ec-border)] p-3"><div className="mb-3 flex items-center justify-between gap-2"><strong className="text-[10px] text-[var(--color-ec-text)]">{group.label}</strong><span className="text-[8px] font-semibold uppercase tracking-[.08em] text-[var(--color-ec-text-muted)]">Conditional group</span></div><NestedGroupEditor project={project} ownerContentTypeId={ownerContentTypeId} group={group} value={current} fieldGroups={fieldGroups} onChange={onChange} depth={depth + 1} /></div>;
  }

  if (field.type === 'core/group') {
    const group = resolveGroup(fieldGroups, field); if (!group) return <div role="alert" className="text-[9px] text-[var(--color-ec-danger-600)]">Referenced Field Group is unavailable.</div>;
    const current = isJsonObject(value) ? value : groupDefaults(group, fieldGroups, depth + 1);
    return <div className="rounded-[var(--ec-radius-md)] border border-[var(--color-ec-border)] p-3"><div className="mb-3 flex items-center justify-between gap-2"><strong className="text-[10px] text-[var(--color-ec-text)]">{group.label}</strong><span className="text-[8px] font-semibold uppercase tracking-[.08em] text-[var(--color-ec-text-muted)]">Nested group</span></div><NestedGroupEditor project={project} ownerContentTypeId={ownerContentTypeId} group={group} value={current} fieldGroups={fieldGroups} onChange={onChange} depth={depth + 1} /></div>;
  }

  if (field.type === 'core/repeater') {
    const group = resolveGroup(fieldGroups, field); if (!group) return <div role="alert" className="text-[9px] text-[var(--color-ec-danger-600)]">Referenced Field Group is unavailable.</div>;
    const rows = Array.isArray(value) ? value.filter(isJsonObject) : [];
    const configuredMax = typeof field.config.maxItems === 'number' ? field.config.maxItems : MAX_REPEATER_ITEMS; const maxItems = Math.min(configuredMax, MAX_REPEATER_ITEMS);
    return <div className="space-y-2 rounded-[var(--ec-radius-md)] border border-[var(--color-ec-border)] p-3"><div className="flex items-center justify-between gap-3"><div><strong className="block text-[10px] text-[var(--color-ec-text)]">{group.label}</strong><span className="text-[8px] text-[var(--color-ec-text-muted)]">{rows.length} {rows.length === 1 ? 'row' : 'rows'} · max {maxItems}</span></div><button type="button" className="ec-control ec-focus-ring h-8 px-2.5 text-[9px] font-semibold" disabled={rows.length >= maxItems} onClick={() => onChange([...rows, groupDefaults(group, fieldGroups, depth + 1)])}>Add row</button></div>{rows.length === 0 ? <div className="rounded-[var(--ec-radius-sm)] border border-dashed border-[var(--color-ec-border)] p-2 text-[9px] text-[var(--color-ec-text-muted)]">No rows. Add a row to start repeated content.</div> : null}{rows.map((row, index) => <section key={index} aria-label={`${field.label} row ${index + 1}`} className="rounded-[var(--ec-radius-sm)] border border-[var(--color-ec-border)] p-3"><div className="mb-3 flex items-center justify-between"><strong className="text-[9px] text-[var(--color-ec-text)]">Row {index + 1}</strong><button type="button" className="ec-control ec-focus-ring h-7 px-2 text-[8px] font-semibold text-[var(--color-ec-danger-600)]" onClick={() => onChange(rows.filter((_, rowIndex) => rowIndex !== index))}>Remove</button></div><NestedGroupEditor project={project} ownerContentTypeId={ownerContentTypeId} group={group} value={row} fieldGroups={fieldGroups} onChange={(next) => onChange(rows.map((item, rowIndex) => rowIndex === index ? next : item))} depth={depth + 1} /></section>)}</div>;
  }

  return <PrimitiveNestedField field={field} value={value} onChange={onChange} />;
}
