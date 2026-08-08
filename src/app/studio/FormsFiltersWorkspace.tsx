import { useMemo, useState } from 'react';
import type { JsonObject, JsonValue } from '../../core/domain';
import { Icon, type IconName } from '../components/Icon';
import { useProjectSession } from '../project/project-session-context';

type WorkflowResource = 'forms' | 'filters';

interface FormsFiltersWorkspaceProps {
  initialResource?: WorkflowResource;
}

interface ResourceDefinition {
  id: WorkflowResource;
  label: string;
  singular: string;
  icon: IconName;
  description: string;
}

const definitions: Record<WorkflowResource, ResourceDefinition> = {
  forms: {
    id: 'forms',
    label: 'Forms',
    singular: 'Form',
    icon: 'form',
    description: 'Canonical form definitions already stored in the project.',
  },
  filters: {
    id: 'filters',
    label: 'Smart Filters',
    singular: 'Filter',
    icon: 'filter',
    description: 'Canonical filter definitions already stored in the project.',
  },
};

function displayName(id: string, value: JsonObject): string {
  for (const candidate of [value.name ?? null, value.label ?? null, value.title ?? null, value.slug ?? null]) {
    if (typeof candidate === 'string' && candidate.trim()) return candidate;
  }
  return id;
}

function summary(value: JsonValue): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return `${value.length} items`;
  if (typeof value === 'object') return `${Object.keys(value).length} fields`;
  if (typeof value === 'string') return value.length > 54 ? `${value.slice(0, 51)}…` : value;
  return String(value);
}

function detectStageIcon(key: string): IconName {
  const normalized = key.toLowerCase();
  if (normalized.includes('field')) return 'form';
  if (normalized.includes('condition') || normalized.includes('rule')) return 'command';
  if (normalized.includes('action') || normalized.includes('submit')) return 'link';
  if (normalized.includes('query') || normalized.includes('source')) return 'query';
  if (normalized.includes('filter')) return 'filter';
  return 'blocks';
}

function EmptyState({ definition }: { definition: ResourceDefinition }) {
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

export function FormsFiltersWorkspace({ initialResource = 'forms' }: FormsFiltersWorkspaceProps) {
  const session = useProjectSession();
  const [resource, setResource] = useState<WorkflowResource>(initialResource);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const definition = definitions[resource];
  const source = resource === 'forms' ? session.project.forms : session.project.filters;

  const entries = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return Object.entries(source)
      .map(([id, value]) => ({ id, value, name: displayName(id, value) }))
      .filter((entry) => !normalized || `${entry.name} ${entry.id} ${JSON.stringify(entry.value)}`.toLowerCase().includes(normalized))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [query, source]);

  const selectedValue = selectedId ? source[selectedId] : undefined;
  const selected = selectedId && selectedValue
    ? { id: selectedId, value: selectedValue, name: displayName(selectedId, selectedValue) }
    : entries[0] ?? null;
  const queryCount = Object.keys(session.project.queries).length;

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[var(--color-ec-app)]" aria-label="Forms Filters Workflow Studio">
      <header className="shrink-0 border-b border-[var(--color-ec-border)] bg-[var(--color-ec-surface)] px-4 py-3 md:px-5">
        <div className="mx-auto flex max-w-[1480px] flex-wrap items-end justify-between gap-3">
          <div>
            <span className="text-[8px] font-bold uppercase tracking-[.16em] text-[var(--color-ec-accent)]">Interaction architecture</span>
            <h2 className="mt-1 text-[18px] font-semibold tracking-[-.03em] text-[var(--color-ec-text)]">Forms, filters & workflow</h2>
            <p className="mt-1 text-[9px] text-[var(--color-ec-text-muted)]">Inspect existing canonical definitions and their stored workflow shape without inventing F06 mutations.</p>
          </div>
          <button type="button" className="ec-control ec-focus-ring inline-flex h-8 items-center gap-1.5 px-2.5 text-[9px] font-semibold text-[var(--color-ec-text-muted)]" disabled><Icon name="plus" size={12} />New {definition.singular}</button>
        </div>
      </header>

      <div className="mx-auto flex min-h-0 w-full max-w-[1480px] flex-1 flex-col p-3 md:p-4">
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-[var(--color-ec-border)] pb-3">
          <div className="flex rounded-[var(--ec-radius-md)] bg-[var(--color-ec-surface-muted)] p-0.5" role="tablist" aria-label="Workflow resources">
            {(['forms', 'filters'] as const).map((item) => (
              <button key={item} type="button" role="tab" aria-selected={resource === item} className="ec-focus-ring flex h-8 items-center gap-1.5 rounded-[var(--ec-radius-sm)] px-3 text-[9px] font-semibold text-[var(--color-ec-text-muted)] data-[active=true]:bg-[var(--color-ec-surface)] data-[active=true]:text-[var(--color-ec-text)] data-[active=true]:shadow-sm" data-active={resource === item ? 'true' : 'false'} onClick={() => { setResource(item); setSelectedId(null); }}>
                <Icon name={definitions[item].icon} size={11} />{definitions[item].label}<span className="text-[8px] opacity-55">{Object.keys(item === 'forms' ? session.project.forms : session.project.filters).length}</span>
              </button>
            ))}
          </div>
          <span className="inline-flex h-8 items-center gap-1.5 rounded-[var(--ec-radius-md)] border border-[var(--color-ec-border)] bg-[var(--color-ec-surface)] px-2.5 text-[8px] font-semibold text-[var(--color-ec-text-muted)]"><Icon name="query" size={11} />{queryCount} query connection{queryCount === 1 ? '' : 's'}</span>
          <label className="ml-auto flex h-8 min-w-[220px] flex-1 items-center gap-2 rounded-[var(--ec-radius-md)] border border-[var(--color-ec-border)] bg-[var(--color-ec-surface)] px-2.5 text-[var(--color-ec-text-muted)] sm:max-w-[320px]"><Icon name="search" size={12} /><input className="min-w-0 flex-1 bg-transparent text-[9px] text-[var(--color-ec-text)] outline-none placeholder:text-[var(--color-ec-text-muted)]" aria-label="Search forms and filters" placeholder={`Search ${definition.label.toLowerCase()}…`} value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        </div>

        <div className="grid min-h-0 flex-1 gap-3 pt-3 xl:grid-cols-[280px_minmax(0,1fr)_330px]">
          <aside className="min-h-0 overflow-y-auto rounded-[var(--ec-radius-lg)] border border-[var(--color-ec-border)] bg-[var(--color-ec-surface)] shadow-[var(--ec-shadow-panel)]" aria-label="Workflow definitions">
            <header className="border-b border-[var(--color-ec-border)] px-3 py-3"><span className="text-[7px] font-bold uppercase tracking-[.14em] text-[var(--color-ec-text-muted)]">Definitions</span><strong className="mt-1 block text-[10px] font-semibold text-[var(--color-ec-text)]">{definition.label}</strong><p className="mt-1 text-[8px] leading-4 text-[var(--color-ec-text-muted)]">{definition.description}</p></header>
            {entries.length === 0 ? <div className="p-3"><EmptyState definition={definition} /></div> : entries.map((entry) => <button key={entry.id} type="button" className="flex min-h-12 w-full items-center gap-2 border-b border-[var(--color-ec-border)] px-3 text-left last:border-0 hover:bg-[var(--color-ec-surface-subtle)] focus-visible:outline-none focus-visible:shadow-[var(--ec-focus-ring)] data-[active=true]:bg-[var(--color-ec-accent-soft)]" data-active={selected?.id === entry.id ? 'true' : 'false'} onClick={() => setSelectedId(entry.id)}><span className="grid size-7 shrink-0 place-items-center rounded-[var(--ec-radius-sm)] bg-[var(--color-ec-surface-muted)] text-[var(--color-ec-text-muted)]"><Icon name={definition.icon} size={12} /></span><span className="min-w-0"><strong className="block truncate text-[9px] font-semibold text-[var(--color-ec-text)]">{entry.name}</strong><small className="block truncate font-mono text-[7px] text-[var(--color-ec-text-muted)]">{entry.id}</small></span></button>)}
          </aside>

          <main className="min-h-0 overflow-y-auto rounded-[var(--ec-radius-lg)] border border-[var(--color-ec-border)] bg-[var(--color-ec-surface-subtle)] p-3 shadow-[var(--ec-shadow-panel)]" aria-label="Workflow canvas">
            <div className="mb-3 flex items-center justify-between"><div><span className="text-[7px] font-bold uppercase tracking-[.14em] text-[var(--color-ec-text-muted)]">Workflow composition</span><strong className="mt-1 block text-[11px] font-semibold text-[var(--color-ec-text)]">{selected?.name ?? definition.label}</strong></div><span className="text-[8px] text-[var(--color-ec-text-muted)]">Read-only canonical view</span></div>
            {selected ? (
              <div className="relative space-y-2 before:absolute before:bottom-5 before:left-[17px] before:top-5 before:w-px before:bg-[var(--color-ec-border)]">
                {Object.entries(selected.value).map(([key, value], index) => <article key={key} className="relative ml-0 grid grid-cols-[34px_minmax(0,1fr)] gap-2 rounded-[var(--ec-radius-md)] border border-[var(--color-ec-border)] bg-[var(--color-ec-surface)] p-2.5"><span className="z-10 grid size-8 place-items-center rounded-[var(--ec-radius-md)] border border-[var(--color-ec-border)] bg-[var(--color-ec-surface)] text-[var(--color-ec-accent)]"><Icon name={detectStageIcon(key)} size={13} /></span><div className="min-w-0"><div className="flex items-center justify-between gap-2"><strong className="truncate font-mono text-[8px] font-semibold text-[var(--color-ec-text)]">{key}</strong><span className="text-[7px] tabular-nums text-[var(--color-ec-text-muted)]">{String(index + 1).padStart(2, '0')}</span></div><p className="mt-1 break-words text-[8px] leading-4 text-[var(--color-ec-text-muted)]">{summary(value)}</p></div></article>)}
              </div>
            ) : <EmptyState definition={definition} />}
          </main>

          <aside className="min-h-0 overflow-y-auto rounded-[var(--ec-radius-lg)] border border-[var(--color-ec-border)] bg-[var(--color-ec-surface)] shadow-[var(--ec-shadow-panel)]" aria-label="Workflow details">
            <header className="border-b border-[var(--color-ec-border)] px-3 py-3"><span className="text-[7px] font-bold uppercase tracking-[.14em] text-[var(--color-ec-text-muted)]">Inspector</span><strong className="mt-1 block truncate text-[10px] font-semibold text-[var(--color-ec-text)]">{selected?.name ?? 'No selection'}</strong><p className="mt-1 text-[8px] leading-4 text-[var(--color-ec-text-muted)]">Stored definition fields and available project query connections.</p></header>
            {selected ? <dl className="divide-y divide-[var(--color-ec-border)]">{Object.entries(selected.value).map(([key, value]) => <div key={key} className="grid grid-cols-[100px_minmax(0,1fr)] gap-2 px-3 py-2.5"><dt className="truncate font-mono text-[8px] font-semibold text-[var(--color-ec-text-muted)]">{key}</dt><dd className="min-w-0 break-words text-[8px] leading-4 text-[var(--color-ec-text)]">{summary(value)}</dd></div>)}</dl> : null}
            <div className="border-t border-[var(--color-ec-border)] p-3"><span className="text-[7px] font-bold uppercase tracking-[.14em] text-[var(--color-ec-text-muted)]">Query connections</span>{queryCount > 0 ? <div className="mt-2 space-y-1">{Object.entries(session.project.queries).map(([id, value]) => <div key={id} className="flex min-h-8 items-center gap-2 rounded-[var(--ec-radius-sm)] bg-[var(--color-ec-surface-subtle)] px-2"><Icon name="query" size={10} /><span className="min-w-0 flex-1 truncate text-[8px] font-medium text-[var(--color-ec-text)]">{displayName(id, value)}</span></div>)}</div> : <p className="mt-2 text-[8px] leading-4 text-[var(--color-ec-text-muted)]">No canonical queries are available to connect yet.</p>}</div>
          </aside>
        </div>
      </div>
    </section>
  );
}
