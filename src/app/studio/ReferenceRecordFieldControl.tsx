import {
  listContentRecords,
  listContentTypeDefinitions,
  listTaxonomyDefinitions,
  resolveRelationForField,
  type CustomFieldDefinition,
  type RelationFieldSide,
} from '../../core/content';
import { isJsonObject, type JsonValue } from '../../core/domain';
import type { CanonicalProject } from '../../core/project';

interface ReferenceRecordFieldControlProps {
  project: CanonicalProject;
  ownerContentTypeId: string;
  field: CustomFieldDefinition;
  value: JsonValue | undefined;
  onChange(value: JsonValue): void;
}

function referenceIds(value: JsonValue | undefined): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function userLabel(id: string, raw: unknown): string {
  if (!isJsonObject(raw)) return id;
  for (const key of ['displayName', 'name', 'email'] as const) {
    const candidate = raw[key];
    if (typeof candidate === 'string' && candidate.trim()) return candidate.trim();
  }
  return id;
}

export function ReferenceRecordFieldControl({ project, ownerContentTypeId, field, value, onChange }: ReferenceRecordFieldControlProps) {
  if (field.type === 'core/user') {
    const selected = typeof value === 'string' ? value : '';
    const users = Object.entries(project.users).sort(([left], [right]) => left.localeCompare(right));
    return (
      <select className="ec-control h-9 w-full px-2.5 text-[10px]" aria-label={field.label} value={selected} onChange={(event) => onChange(event.target.value || null)}>
        <option value="">No user</option>
        {users.map(([id, raw]) => <option key={id} value={id}>{userLabel(id, raw)} · {id}</option>)}
      </select>
    );
  }

  if (field.type === 'core/taxonomy') {
    const taxonomyId = typeof field.config.taxonomyId === 'string' ? field.config.taxonomyId : '';
    const taxonomy = listTaxonomyDefinitions(project).find((candidate) => candidate.id === taxonomyId);
    const ids = referenceIds(value);
    return (
      <div className="space-y-1.5">
        <input
          className="ec-control h-9 w-full px-2.5 text-[10px]"
          aria-label={field.label}
          value={ids.join(', ')}
          placeholder="term-id, second-term-id"
          onChange={(event) => onChange([...new Set(event.target.value.split(',').map((item) => item.trim()).filter(Boolean))])}
        />
        <small className="block text-[8px] leading-4 text-[var(--color-ec-text-muted)]">
          {taxonomy ? `${taxonomy.label} · scoped term IDs. The canonical term catalog is not modeled yet.` : `Configured taxonomy ${taxonomyId || '(empty)'} is unavailable.`}
        </small>
      </div>
    );
  }

  const relation = resolveRelationForField(project, field);
  if (!relation) return <div role="alert" className="rounded-[var(--ec-radius-sm)] border border-[var(--color-ec-danger-600)] p-2 text-[9px] text-[var(--color-ec-danger-600)]">Configured Relation is unavailable.</div>;
  const side = field.config.side as RelationFieldSide;
  if (side !== 'source' && side !== 'target') return <div role="alert" className="text-[9px] text-[var(--color-ec-danger-600)]">Relation side must be source or target.</div>;

  const expectedOwner = side === 'source' ? relation.sourceContentTypeId : relation.targetContentTypeId;
  const referencedContentTypeId = side === 'source' ? relation.targetContentTypeId : relation.sourceContentTypeId;
  const cardinality = side === 'source' ? relation.sourceCardinality : relation.targetCardinality;
  const contentType = listContentTypeDefinitions(project).find((candidate) => candidate.id === referencedContentTypeId);
  const records = listContentRecords(project, { contentTypeId: referencedContentTypeId });
  const selected = referenceIds(value);

  if (ownerContentTypeId !== expectedOwner) return <div role="alert" className="rounded-[var(--ec-radius-sm)] border border-[var(--color-ec-danger-600)] p-2 text-[9px] text-[var(--color-ec-danger-600)]">Relation {relation.label} expects this field on Content Type {expectedOwner}.</div>;

  if (cardinality === 'one') {
    return (
      <div className="space-y-1.5">
        <select className="ec-control h-9 w-full px-2.5 text-[10px]" aria-label={field.label} value={selected[0] ?? ''} onChange={(event) => onChange(event.target.value ? [event.target.value] : [])}>
          <option value="">No related record</option>
          {records.map((record) => <option key={record.id} value={record.id}>{record.title || record.id} · /{record.slug}</option>)}
        </select>
        <small className="block text-[8px] text-[var(--color-ec-text-muted)]">{relation.label} · one {contentType?.singularLabel ?? referencedContentTypeId}</small>
      </div>
    );
  }

  return (
    <fieldset className="rounded-[var(--ec-radius-sm)] border border-[var(--color-ec-border)] p-2" aria-label={field.label}>
      <legend className="px-1 text-[8px] font-semibold text-[var(--color-ec-text-muted)]">{relation.label} · {contentType?.label ?? referencedContentTypeId}</legend>
      {records.length === 0 ? <small className="text-[8px] text-[var(--color-ec-text-muted)]">No compatible records exist yet.</small> : <div className="grid gap-1.5">{records.map((record) => {
        const checked = selected.includes(record.id);
        return <label key={record.id} className="flex min-h-9 items-center gap-2 rounded-[var(--ec-radius-sm)] px-1.5 text-[9px] text-[var(--color-ec-text)]"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked ? [...selected, record.id] : selected.filter((id) => id !== record.id))} /><span className="min-w-0"><strong className="block truncate">{record.title || record.id}</strong><small className="block truncate text-[8px] text-[var(--color-ec-text-muted)]">/{record.slug}</small></span></label>;
      })}</div>}
    </fieldset>
  );
}
