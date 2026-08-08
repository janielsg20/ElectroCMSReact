import { useMemo, useState } from 'react';
import type { JsonObject, JsonValue } from '../../core/domain';
import { Icon, type IconName } from '../components/Icon';
import { useProjectSession } from '../project/project-session-context';

type BackendView = 'overview' | 'dashboards' | 'backend-documents' | 'roles' | 'users';

interface BackendRolesWorkspaceProps {
  initialView?: BackendView;
}

interface ViewDefinition {
  id: BackendView;
  label: string;
  icon: IconName;
  description: string;
}

const views: readonly ViewDefinition[] = [
  { id: 'overview', label: 'Overview', icon: 'grid', description: 'Canonical administrative project structure.' },
  { id: 'dashboards', label: 'Dashboards', icon: 'dashboard', description: 'Saved administrative dashboard definitions.' },
  { id: 'backend-documents', label: 'Admin Pages', icon: 'pages', description: 'Backend documents built with the canonical document model.' },
  { id: 'roles', label: 'Roles', icon: 'shield', description: 'Canonical roles and capability definitions.' },
  { id: 'users', label: 'Users', icon: 'users', description: 'Canonical users already stored in the project.' },
];

function displayName(id: string, value: JsonObject): string {
  for (const key of ['name', 'label', 'title', 'email', 'slug']) {
    const candidate = value[key];
    if (typeof candidate === 'string' && candidate.trim()) return candidate;
  }
  return id;
}

function summarize(value: JsonValue | undefined): string {
  if (value === undefined) return '—';
  if (value === null) return 'null';
  if (Array.isArray(value)) return `${value.length} items`;
  if (typeof value === 'object') return `${Object.keys(value).length} fields`;
  if (typeof value === 'string') return value.length > 52 ? `${value.slice(0, 49)}…` : value;
  return String(value);
}

function Stat({ label, value, icon }: { label: string; value: number; icon: IconName }) {
  return (
    <article className="rounded-[var(--ec-radius-lg)] border border-[var(--color-ec-border)] bg-[var(--color-ec-surface)] p-3 shadow-[var(--ec-shadow-panel)]">
      <div className="flex items-center justify-between gap-2"><span className="text-[8px] font-semibold uppercase tracking-[.12em] text-[var(--color-ec-text-muted)]">{label}</span><Icon name={icon} size={12} /></div>
      <strong className="mt-3 block text-xl font-semibold tabular-nums tracking-[-.04em] text-[var(--color-ec-text)]">{value}</strong>
    </article>
  );
}

function Empty({ icon, label }: { icon: IconName; label: string }) {
  return <div className="grid min-h-64 place-items-center rounded-[var(--ec-radius-lg)] border border-dashed border-[var(--color-ec-border)] bg-[var(--color-ec-surface-subtle)] text-center"><div><span className="mx-auto grid size-10 place-items-center rounded-[var(--ec-radius-lg)] bg-[var(--color-ec-surface)] text-[var(--color-ec-text-muted)]"><Icon name={icon} size={17} /></span><strong className="mt-3 block text-[10px] text-[var(--color-ec-text)]">No {label.toLowerCase()}</strong><span className="mt-1 block text-[8px] text-[var(--color-ec-text-muted)]">No matching canonical resources exist in this project.</span></div></div>;
}

export function BackendRolesWorkspace({ initialView = 'overview' }: BackendRolesWorkspaceProps) {
  const session = useProjectSession();
  const [view, setView] = useState<BackendView>(initialView);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const backendDocuments = useMemo(() => session.project.documentOrder.flatMap((id) => {
    const document = session.project.documents[id];
    return document?.kind === 'backend' ? [document] : [];
  }), [session.project.documentOrder, session.project.documents]);

  const resourceMap = view === 'dashboards' ? session.project.dashboards : view === 'roles' ? session.project.roles : view === 'users' ? session.project.users : null;
  const normalized = query.trim().toLowerCase();
  const entries = useMemo(() => {
    if (!resourceMap) return [];
    return Object.entries(resourceMap)
      .map(([id, value]) => ({ id, value, name: displayName(id, value) }))
      .filter((entry) => !normalized || `${entry.name} ${entry.id} ${JSON.stringify(entry.value)}`.toLowerCase().includes(normalized))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [normalized, resourceMap]);
  const selected = selectedId && resourceMap?.[selectedId]
    ? { id: selectedId, value: resourceMap[selectedId], name: displayName(selectedId, resourceMap[selectedId]) }
    : entries[0] ?? null;

  const definition = views.find((item) => item.id === view) ?? views[0]!;
  const backendConfigEntries = Object.entries(session.project.backend);

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[var(--color-ec-app)]" aria-label="Backend and roles studio">
      <header className="shrink-0 border-b border-[var(--color-ec-border)] bg-[var(--color-ec-surface)] px-4 py-3 md:px-5">
        <div className="mx-auto flex max-w-[1480px] flex-wrap items-end justify-between gap-3">
          <div><span className="text-[8px] font-bold uppercase tracking-[.16em] text-[var(--color-ec-accent)]">Administrative system</span><h2 className="mt-1 text-[18px] font-semibold tracking-[-.03em] text-[var(--color-ec-text)]">Backend Builder</h2><p className="mt-1 text-[9px] text-[var(--color-ec-text-muted)]">Inspect the canonical admin structure, dashboards, roles and users without creating parallel backend state.</p></div>
          <button type="button" className="ec-control ec-focus-ring inline-flex h-8 items-center gap-1.5 px-2.5 text-[9px] font-semibold text-[var(--color-ec-text-muted)]" disabled><Icon name="plus" size={12} />New</button>
        </div>
      </header>

      <div className="mx-auto flex min-h-0 w-full max-w-[1480px] flex-1 flex-col p-3 md:p-4">
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-[var(--color-ec-border)] pb-3">
          <div className="flex max-w-full gap-1 overflow-x-auto [scrollbar-width:none]" role="tablist" aria-label="Backend resources">
            {views.map((item) => <button key={item.id} type="button" role="tab" aria-selected={view === item.id} className="ec-focus-ring flex h-8 shrink-0 items-center gap-1.5 rounded-[var(--ec-radius-md)] px-2.5 text-[9px] font-semibold text-[var(--color-ec-text-muted)] data-[active=true]:bg-[var(--color-ec-surface)] data-[active=true]:text-[var(--color-ec-text)] data-[active=true]:shadow-sm" data-active={view === item.id ? 'true' : 'false'} onClick={() => { setView(item.id); setSelectedId(null); }}><Icon name={item.icon} size={11} />{item.label}</button>)}
          </div>
          {resourceMap ? <label className="ml-auto flex h-8 min-w-[220px] flex-1 items-center gap-2 rounded-[var(--ec-radius-md)] border border-[var(--color-ec-border)] bg-[var(--color-ec-surface)] px-2.5 text-[var(--color-ec-text-muted)] sm:max-w-[320px]"><Icon name="search" size={12} /><input className="min-w-0 flex-1 bg-transparent text-[9px] text-[var(--color-ec-text)] outline-none" aria-label="Search backend resources" placeholder={`Search ${definition.label.toLowerCase()}…`} value={query} onChange={(event) => setQuery(event.target.value)} /></label> : null}
        </div>

        {view === 'overview' ? <div className="min-h-0 flex-1 overflow-y-auto pt-3"><div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-5"><Stat label="Dashboards" value={Object.keys(session.project.dashboards).length} icon="dashboard" /><Stat label="Admin pages" value={backendDocuments.length} icon="pages" /><Stat label="Roles" value={Object.keys(session.project.roles).length} icon="shield" /><Stat label="Users" value={Object.keys(session.project.users).length} icon="users" /><Stat label="Config keys" value={backendConfigEntries.length} icon="settings" /></div><div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1fr)_360px]"><article className="rounded-[var(--ec-radius-lg)] border border-[var(--color-ec-border)] bg-[var(--color-ec-surface)] shadow-[var(--ec-shadow-panel)]"><header className="border-b border-[var(--color-ec-border)] px-3 py-2.5"><strong className="text-[10px] text-[var(--color-ec-text)]">Backend configuration</strong></header>{backendConfigEntries.length ? <dl className="divide-y divide-[var(--color-ec-border)]">{backendConfigEntries.map(([key, value]) => <div key={key} className="grid grid-cols-[140px_minmax(0,1fr)] gap-3 px-3 py-2.5"><dt className="font-mono text-[8px] font-semibold text-[var(--color-ec-text-muted)]">{key}</dt><dd className="break-words text-[8px] text-[var(--color-ec-text)]">{summarize(value)}</dd></div>)}</dl> : <div className="p-4 text-[9px] text-[var(--color-ec-text-muted)]">No backend configuration keys are stored yet.</div>}</article><aside className="rounded-[var(--ec-radius-lg)] border border-[var(--color-ec-border)] bg-[var(--color-ec-surface)] p-4 shadow-[var(--ec-shadow-panel)]"><span className="text-[8px] font-semibold uppercase tracking-[.12em] text-[var(--color-ec-text-muted)]">Generated admin</span><strong className="mt-2 block text-[12px] text-[var(--color-ec-text)]">One canonical backend model</strong><p className="mt-2 text-[9px] leading-5 text-[var(--color-ec-text-muted)]">Backend Builder reads the same project model used by the rest of ElectroCMS. It does not maintain a separate dashboard, role or user store.</p></aside></div></div> : null}

        {view === 'backend-documents' ? <div className="min-h-0 flex-1 overflow-y-auto pt-3">{backendDocuments.length ? <div className="overflow-hidden rounded-[var(--ec-radius-lg)] border border-[var(--color-ec-border)] bg-[var(--color-ec-surface)] shadow-[var(--ec-shadow-panel)]">{backendDocuments.map((document) => <button key={document.id} type="button" className="flex min-h-11 w-full items-center justify-between gap-3 border-b border-[var(--color-ec-border)] px-3 text-left last:border-0 hover:bg-[var(--color-ec-surface-subtle)]" onClick={() => session.setActiveDocumentId(document.id)}><span><strong className="block text-[9px] text-[var(--color-ec-text)]">{document.name}</strong><small className="text-[8px] text-[var(--color-ec-text-muted)]">{document.id} · {Object.keys(document.nodes).length} nodes</small></span><Icon name="expand" size={11} /></button>)}</div> : <Empty icon="pages" label="admin pages" />}</div> : null}

        {resourceMap ? <div className="grid min-h-0 flex-1 gap-3 pt-3 lg:grid-cols-[minmax(0,1fr)_340px]"><div className="min-h-0 overflow-y-auto">{entries.length ? <div className="overflow-hidden rounded-[var(--ec-radius-lg)] border border-[var(--color-ec-border)] bg-[var(--color-ec-surface)] shadow-[var(--ec-shadow-panel)]"><div className="grid h-8 grid-cols-[minmax(180px,1.2fr)_minmax(120px,.8fr)_90px] items-center gap-3 border-b border-[var(--color-ec-border)] bg-[var(--color-ec-surface-subtle)] px-3 text-[7px] font-bold uppercase tracking-[.12em] text-[var(--color-ec-text-muted)]"><span>Name</span><span>Canonical id</span><span>Structure</span></div>{entries.map((entry) => <button key={entry.id} type="button" className="grid min-h-11 w-full grid-cols-[minmax(180px,1.2fr)_minmax(120px,.8fr)_90px] items-center gap-3 border-b border-[var(--color-ec-border)] px-3 text-left last:border-0 hover:bg-[var(--color-ec-surface-subtle)] data-[active=true]:bg-[var(--color-ec-accent-soft)]" data-active={selected?.id === entry.id ? 'true' : 'false'} onClick={() => setSelectedId(entry.id)}><strong className="truncate text-[9px] text-[var(--color-ec-text)]">{entry.name}</strong><span className="truncate font-mono text-[8px] text-[var(--color-ec-text-muted)]">{entry.id}</span><span className="text-[8px] text-[var(--color-ec-text-muted)]">{Object.keys(entry.value).length} fields</span></button>)}</div> : <Empty icon={definition.icon} label={definition.label} />}</div><aside className="min-h-0 overflow-y-auto rounded-[var(--ec-radius-lg)] border border-[var(--color-ec-border)] bg-[var(--color-ec-surface)] shadow-[var(--ec-shadow-panel)]" aria-label="Backend resource details"><header className="border-b border-[var(--color-ec-border)] px-3 py-3"><span className="text-[7px] font-bold uppercase tracking-[.14em] text-[var(--color-ec-text-muted)]">Detail</span><strong className="mt-1 block truncate text-[11px] text-[var(--color-ec-text)]">{selected?.name ?? definition.label}</strong><p className="mt-1 text-[8px] leading-4 text-[var(--color-ec-text-muted)]">{selected?.id ?? definition.description}</p></header>{selected ? <dl className="divide-y divide-[var(--color-ec-border)]">{Object.entries(selected.value).map(([key, value]) => <div key={key} className="grid grid-cols-[110px_minmax(0,1fr)] gap-3 px-3 py-2.5"><dt className="truncate font-mono text-[8px] font-semibold text-[var(--color-ec-text-muted)]">{key}</dt><dd className="break-words text-[8px] leading-4 text-[var(--color-ec-text)]">{summarize(value)}</dd></div>)}</dl> : null}</aside></div> : null}
      </div>
    </section>
  );
}
