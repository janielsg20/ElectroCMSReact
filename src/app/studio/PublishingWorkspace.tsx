import { Icon, type IconName } from '../components/Icon';
import { useProjectSession } from '../project/project-session-context';

interface Destination {
  id: 'local' | 'react' | 'lamp' | 'wordpress';
  label: string;
  detail: string;
  icon: IconName;
  output: string;
}

const destinations: readonly Destination[] = [
  { id: 'local', label: 'Local', detail: 'Portable local project package.', icon: 'local', output: 'Local project bundle' },
  { id: 'react', label: 'React', detail: 'Standalone React/Vite production target.', icon: 'code', output: 'React application' },
  { id: 'lamp', label: 'LAMP', detail: 'PHP + MySQL/MariaDB server target.', icon: 'backend', output: 'LAMP package' },
  { id: 'wordpress', label: 'WordPress', detail: 'Theme plus companion plugin target.', icon: 'blocks', output: 'Theme + plugin' },
];

function ReadinessRow({ label, value, ready }: { label: string; value: string; ready: boolean }) {
  return <div className="flex items-center justify-between gap-3 border-b border-[var(--color-ec-border)] px-3 py-2.5 last:border-0"><span className="text-[8px] font-semibold text-[var(--color-ec-text-muted)]">{label}</span><span className={`text-right text-[9px] font-semibold ${ready ? 'text-[var(--color-ec-success-600)]' : 'text-[var(--color-ec-warning-600)]'}`}>{value}</span></div>;
}

export function PublishingWorkspace() {
  const session = useProjectSession();
  const documentCount = session.project.documentOrder.length;
  const hasDocuments = documentCount > 0;
  const hasThemes = Boolean(session.project.frontendThemeId && session.project.backendThemeId);
  const saved = session.saveState === 'saved';

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[var(--color-ec-app)]" aria-label="Export workspace">
      <header className="shrink-0 border-b border-[var(--color-ec-border)] bg-[var(--color-ec-surface)] px-4 py-3 md:px-5">
        <div className="mx-auto max-w-[1480px]"><span className="text-[8px] font-bold uppercase tracking-[.16em] text-[var(--color-ec-accent)]">Publishing center</span><h2 className="mt-1 text-[18px] font-semibold tracking-[-.03em] text-[var(--color-ec-text)]">Export workspace</h2><p className="mt-1 text-[9px] text-[var(--color-ec-text-muted)]">Review canonical project readiness and planned production destinations. Export actions appear only after a validated destination runtime exists.</p></div>
      </header>

      <div className="mx-auto grid min-h-0 w-full max-w-[1480px] flex-1 gap-3 overflow-y-auto p-3 lg:grid-cols-[minmax(0,1fr)_320px] md:p-4">
        <main className="min-w-0" aria-label="Publishing destinations">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {destinations.map((destination) => <article key={destination.id} className="flex min-h-48 flex-col rounded-[var(--ec-radius-lg)] border border-[var(--color-ec-border)] bg-[var(--color-ec-surface)] p-4 shadow-[var(--ec-shadow-panel)]"><span className="grid size-10 place-items-center rounded-[var(--ec-radius-lg)] bg-[var(--color-ec-accent-soft)] text-[var(--color-ec-accent)]"><Icon name={destination.icon} size={17} /></span><strong className="mt-4 text-[11px] font-semibold text-[var(--color-ec-text)]">{destination.label}</strong><p className="mt-1 text-[9px] leading-4 text-[var(--color-ec-text-muted)]">{destination.detail}</p><span className="mt-3 text-[8px] font-medium text-[var(--color-ec-text-muted)]">Output · {destination.output}</span><span className="mt-auto inline-flex min-h-8 items-center justify-center rounded-[var(--ec-radius-md)] border border-[var(--color-ec-border)] bg-[var(--color-ec-surface-subtle)] px-2 text-[10px] font-semibold text-[var(--color-ec-text-muted)]" aria-label={`${destination.label} exporter runtime required`} title="Exporter runtime is not implemented yet.">Runtime required</span></article>)}
          </div>

          <section className="mt-3 rounded-[var(--ec-radius-lg)] border border-[var(--color-ec-border)] bg-[var(--color-ec-surface)] p-4 shadow-[var(--ec-shadow-panel)]"><div className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-[var(--ec-radius-md)] bg-[var(--color-ec-surface-muted)] text-[var(--color-ec-text-muted)]"><Icon name="code" size={15} /></span><div><strong className="block text-[10px] text-[var(--color-ec-text)]">No simulated publishing</strong><p className="mt-1 text-[9px] leading-5 text-[var(--color-ec-text-muted)]">ElectroCMS does not report a deployment, package or compatibility result until a validated exporter produces it. This center exposes the intended destinations without creating a parallel fake build pipeline.</p></div></div></section>
        </main>

        <aside className="min-h-0 space-y-3" aria-label="Publishing readiness">
          <section className="overflow-hidden rounded-[var(--ec-radius-lg)] border border-[var(--color-ec-border)] bg-[var(--color-ec-surface)] shadow-[var(--ec-shadow-panel)]"><header className="border-b border-[var(--color-ec-border)] px-3 py-2.5"><span className="text-[8px] font-bold uppercase tracking-[.13em] text-[var(--color-ec-text-muted)]">Project readiness</span></header><ReadinessRow label="Documents" value={`${documentCount} available`} ready={hasDocuments} /><ReadinessRow label="Theme references" value={hasThemes ? 'Configured' : 'Incomplete'} ready={hasThemes} /><ReadinessRow label="Local save state" value={session.saveState} ready={saved} /><ReadinessRow label="Exporter runtime" value="Not implemented" ready={false} /></section>
          <section className="rounded-[var(--ec-radius-lg)] border border-[var(--color-ec-border)] bg-[var(--color-ec-surface)] p-4 shadow-[var(--ec-shadow-panel)]"><span className="text-[8px] font-bold uppercase tracking-[.13em] text-[var(--color-ec-text-muted)]">Canonical source</span><strong className="mt-2 block truncate text-[10px] text-[var(--color-ec-text)]">{session.project.name}</strong><p className="mt-1 break-all font-mono text-[8px] leading-4 text-[var(--color-ec-text-muted)]">{session.project.id}</p><p className="mt-3 text-[8px] leading-4 text-[var(--color-ec-text-muted)]">Schema {session.project.schemaVersion} · revision {session.project.historyMetadata.revision}</p></section>
        </aside>
      </div>
    </section>
  );
}
