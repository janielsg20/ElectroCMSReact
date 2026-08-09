import { useMemo, useState } from 'react';
import type { JsonObject, JsonValue } from '../../core/domain';
import { Icon, type IconName } from '../components/Icon';
import { useProjectSession } from '../project/project-session-context';
import { CapabilityStatus } from './CapabilityStatus';
import { ContentTypesCrudPanel } from './ContentTypesCrudPanel';
import { FieldGroupsCrudPanel } from './FieldGroupsCrudPanel';
import { RecordsCrudPanel } from './RecordsCrudPanel';
import { TaxonomiesCrudPanel } from './TaxonomiesCrudPanel';

type DynamicResourceKind =
  | 'content-types'
  | 'taxonomies'
  | 'field-groups'
  | 'records'
  | 'relations'
  | 'queries';

interface DynamicContentWorkspaceProps {
  initialResource?: DynamicResourceKind;
}

interface ResourceDefinition {
  id: DynamicResourceKind;
  label: string;
  icon: IconName;
  description: string;
}

const resources: readonly ResourceDefinition[] = [
  { id: 'content-types', label: 'Content Types', icon: 'database', description: 'Canonical models that define structured content.' },
  { id: 'taxonomies', label: 'Taxonomies', icon: 'filter', description: 'Canonical vocabularies used to classify records.' },
  { id: 'field-groups', label: 'Field Groups', icon: 'form', description: 'Reusable canonical field schemas attached to content.' },
  { id: 'records', label: 'Records', icon: 'list', description: 'Canonical content entries stored in this project.' },
  { id: 'relations', label: 'Relations', icon: 'link', description: 'Canonical relationships between structured resources.' },
  { id: 'queries', label: 'Queries', icon: 'query', description: 'Saved canonical query definitions already present in the project.' },
];

function asDisplayName(id: string, value: JsonObject): string {
  const candidates: JsonValue[] = [value.name ?? null, value.label ?? null, value.title ?? null, value.slug ?? null];
  const found = candidates.find((candidate) => typeof candidate === 'string' && candidate.trim().length > 0);
  return typeof found === 'string' ? found : id;
}

function valueSummary(value: JsonValue): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return `${value.length} items`;
  if (typeof value === 'object') return `${Object.keys(value).length} fields`;
  if (typeof value === 'string') return value.length > 48 ? `${value.slice(0, 45)}…` : value;
  return String(value);
}

function ResourceEmptyState({ definition }: { definition: ResourceDefinition }) {
  return (
    <div className="grid min-h-[360px] place-items-center rounded-[var(--ec-radius-lg)] border border-dashed border-[var(--color-ec-border)] bg-[var(--color-ec-surface-subtle)] p-6 text-center">
      <div className="max-w-xs">
        <span className="mx-auto grid size-11 place-items-center rounded-[var(--ec-radius-lg)] border border-[var(--color-ec-border)] bg-[var(--color-ec-surface)] text-[var(--color-ec-text-muted)]"><Icon name={definition.icon} size={18} /></span>
        <strong className="mt-3 block text-[11px] font-semibold text-[var(--color-ec-text)]">No {definition.label.toLowerCase()}</strong>
        <span className="mt-1 block text-[9px] leading-4 text-[var(--color-ec-text-muted)]">This project does not currently contain canonical {definition.label.toLowerCase()}.</span>
      </div>
    </div>
  );
}

export function DynamicContentWorkspace({ initialResource = 'content-types' }: DynamicContentWorkspaceProps) {
  const session = useProjectSession();
  const [resource, setResource] = useState<DynamicResourceKind>(initialResource);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const source = useMemo<Record<string, JsonObject>>(() => {
    if (resource === 'content-types') return session.project.contentTypes;
    if (resource === 'taxonomies') return session.project.taxonomies;
    if (resource === 'field-groups') return session.project.fieldGroups;
    if (resource === 'records') return session.project.records;
    if (resource === 'relations') return session.project.relations;
    return session.project.queries;
  }, [resource, session.project]);

  const definition = resources.find((candidate) => candidate.id === resource) ?? resources[0]!;
  const entries = useMemo(() => {
    if (resource === 'content-types' || resource === 'taxonomies' || resource === 'field-groups' || resource === 'records') return [];
    const normalized = query.trim().toLowerCase();
    return Object.entries(source)
      .map(([id, value]) => ({ id, value, name: asDisplayName(id, value) }))
      .filter((entry) => !normalized || `${entry.name} ${entry.id} ${JSON.stringify(entry.value)}`.toLowerCase().includes(normalized))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [query, resource, source]);

  const selectedValue = selectedId ? source[selectedId] : undefined;
  const selected = selectedId && selectedValue
    ? { id: selectedId, value: selectedValue, name: asDisplayName(selectedId, selectedValue) }
    : entries[0] ?? null;

  const crudLabel = resource === 'content-types'
    ? { aria: 'Content Types CRUD enabled', icon: 'database' as IconName }
    : resource === 'taxonomies'
      ? { aria: 'Taxonomies CRUD enabled', icon: 'filter' as IconName }
      : resource === 'field-groups'
        ? { aria: 'Field Groups CRUD enabled', icon: 'form' as IconName }
        : resource === 'records'
          ? { aria: 'Records CRUD enabled', icon: 'list' as IconName }
          : null;

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[var(--color-ec-app)]" aria-label="Dynamic Content Studio">
      <header className="shrink-0 border-b border-[var(--color-ec-border)] bg-[var(--color-ec-surface)] px-4 py-3 md:px-5">
        <div className="mx-auto flex max-w-[1480px] flex-wrap items-end justify-between gap-3">
          <div>
            <span className="text-[8px] font-bold uppercase tracking-[.16em] text-[var(--color-ec-accent)]">Data architecture</span>
            <h2 className="mt-1 text-[18px] font-semibold tracking-[-.03em] text-[var(--color-ec-text)]">Dynamic Content Studio</h2>
            <p className="mt-1 text-[9px] text-[var(--color-ec-text-muted)]">Manage validated canonical data capabilities without creating parallel F05 state.</p>
          </div>
          {crudLabel ? (
            <span className="inline-flex min-h-8 items-center gap-1.5 rounded-[var(--ec-radius-md)] border border-[var(--color-ec-success-600)] bg-[var(--color-ec-surface-subtle)] px-2.5 text-[10px] font-semibold text-[var(--color-ec-success-600)]" aria-label={crudLabel.aria}><Icon name={crudLabel.icon} size={12} />CRUD enabled</span>
          ) : (
            <CapabilityStatus label="Read-only data" detail={`${definition.label} mutation commands are not available on main yet; existing canonical resources remain inspectable.`} />
          )}
        </div>
      </header>

      <div className="mx-auto flex min-h-0 w-full max-w-[1480px] flex-1 flex-col p-3 md:p-4">
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-[var(--color-ec-border)] pb-3">
          <div className="flex max-w-full gap-1 overflow-x-auto [scrollbar-width:none]" role="tablist" aria-label="Dynamic content resources">
            {resources.map((item) => {
              const count = item.id === 'content-types' ? Object.keys(session.project.contentTypes).length : item.id === 'taxonomies' ? Object.keys(session.project.taxonomies).length : item.id === 'field-groups' ? Object.keys(session.project.fieldGroups).length : item.id === 'records' ? Object.keys(session.project.records).length : item.id === 'relations' ? Object.keys(session.project.relations).length : Object.keys(session.project.queries).length;
              return <button key={item.id} type="button" role="tab" aria-selected={resource === item.id} className="ec-focus-ring flex h-8 shrink-0 items-center gap-1.5 rounded-[var(--ec-radius-md)] px-2.5 text-[9px] font-semibold text-[var(--color-ec-text-muted)] data-[active=true]:bg-[var(--color-ec-surface)] data-[active=true]:text-[var(--color-ec-text)] data-[active=true]:shadow-sm" data-active={resource === item.id ? 'true' : 'false'} onClick={() => { setResource(item.id); setSelectedId(null); setQuery(''); }}><Icon name={item.icon} size={11} />{item.label}<span className="text-[8px] opacity-55">{count}</span></button>;
            })}
          </div>
          <label className="ml-auto flex h-8 min-w-[220px] flex-1 items-center gap-2 rounded-[var(--ec-radius-md)] border border-[var(--color-ec-border)] bg-[var(--color-ec-surface)] px-2.5 text-[var(--color-ec-text-muted)] sm:max-w-[320px]"><Icon name="search" size={12} /><input className="min-w-0 flex-1 bg-transparent text-[9px] text-[var(--color-ec-text)] outline-none placeholder:text-[var(--color-ec-text-muted)]" aria-label="Search dynamic content" placeholder={`Search ${definition.label.toLowerCase()}…`} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        </div>

        <div className="min-h-0 flex-1 pt-3">
          {resource === 'content-types' ? (
            <ContentTypesCrudPanel query={query} />
          ) : resource === 'taxonomies' ? (
            <TaxonomiesCrudPanel query={query} />
          ) : resource === 'field-groups' ? (
            <FieldGroupsCrudPanel query={query} />
          ) : resource === 'records' ? (
            <RecordsCrudPanel query={query} />
          ) : (
            <div className="grid min-h-0 h-full gap-3 lg:grid-cols-[minmax(0,1fr)_340px]">
              <div className="min-h-0 overflow-y-auto">
                {entries.length === 0 ? <ResourceEmptyState definition={definition} /> : (
                  <div className="overflow-hidden rounded-[var(--ec-radius-lg)] border border-[var(--color-ec-border)] bg-[var(--color-ec-surface)] shadow-[var(--ec-shadow-panel)]">
                    <div className="grid h-8 grid-cols-[minmax(180px,1.3fr)_minmax(120px,.8fr)_100px] items-center gap-3 border-b border-[var(--color-ec-border)] bg-[var(--color-ec-surface-subtle)] px-3 text-[7px] font-bold uppercase tracking-[.12em] text-[var(--color-ec-text-muted)]"><span>Name</span><span>Canonical id</span><span>Structure</span></div>
                    {entries.map((entry) => <button key={entry.id} type="button" className="grid min-h-11 w-full grid-cols-[minmax(180px,1.3fr)_minmax(120px,.8fr)_100px] items-center gap-3 border-b border-[var(--color-ec-border)] px-3 text-left transition-colors last:border-0 hover:bg-[var(--color-ec-surface-subtle)] focus-visible:outline-none focus-visible:shadow-[var(--ec-focus-ring)] data-[active=true]:bg-[var(--color-ec-accent-soft)]" data-active={selected?.id === entry.id ? 'true' : 'false'} onClick={() => setSelectedId(entry.id)}><span className="flex min-w-0 items-center gap-2"><span className="grid size-7 shrink-0 place-items-center rounded-[var(--ec-radius-sm)] bg-[var(--color-ec-surface-muted)] text-[var(--color-ec-text-muted)]"><Icon name={definition.icon} size={12} /></span><strong className="truncate text-[9px] font-semibold text-[var(--color-ec-text)]">{entry.name}</strong></span><span className="truncate font-mono text-[8px] text-[var(--color-ec-text-muted)]">{entry.id}</span><span className="text-[8px] text-[var(--color-ec-text-muted)]">{Object.keys(entry.value).length} fields</span></button>)}
                  </div>
                )}
              </div>

              <aside className="min-h-0 overflow-y-auto rounded-[var(--ec-radius-lg)] border border-[var(--color-ec-border)] bg-[var(--color-ec-surface)] shadow-[var(--ec-shadow-panel)]" aria-label="Dynamic resource details">
                <header className="border-b border-[var(--color-ec-border)] px-3 py-3"><span className="text-[7px] font-bold uppercase tracking-[.14em] text-[var(--color-ec-text-muted)]">Schema detail</span><strong className="mt-1 block truncate text-[11px] font-semibold text-[var(--color-ec-text)]">{selected?.name ?? definition.label}</strong><p className="mt-1 text-[8px] leading-4 text-[var(--color-ec-text-muted)]">{selected ? selected.id : definition.description}</p></header>
                {selected ? <dl className="divide-y divide-[var(--color-ec-border)]">{Object.entries(selected.value).map(([key, value]) => <div key={key} className="grid grid-cols-[110px_minmax(0,1fr)] gap-3 px-3 py-2.5"><dt className="truncate font-mono text-[8px] font-semibold text-[var(--color-ec-text-muted)]">{key}</dt><dd className="min-w-0 break-words text-[8px] leading-4 text-[var(--color-ec-text)]">{valueSummary(value)}</dd></div>)}</dl> : <div className="p-4 text-[9px] leading-5 text-[var(--color-ec-text-muted)]">Select a canonical resource to inspect its stored fields.</div>}
              </aside>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
