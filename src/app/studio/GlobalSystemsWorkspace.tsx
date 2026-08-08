import { useState } from 'react';
import { Icon, type IconName } from '../components/Icon';
import { useProjectSession } from '../project/project-session-context';
import { ProjectThemeControls } from '../themes/ProjectThemeControls';
import { EDITOR_THEME_PRESETS } from '../workspace/editor-theme-presets';
import { useWorkspacePreferences } from '../workspace/workspace-preferences-store';

type GlobalView = 'themes' | 'blueprints' | 'project' | 'storage' | 'appearance';

interface GlobalSystemsWorkspaceProps {
  initialView?: GlobalView;
}

interface ViewDefinition {
  id: GlobalView;
  label: string;
  icon: IconName;
}

const views: readonly ViewDefinition[] = [
  { id: 'themes', label: 'Themes', icon: 'theme' },
  { id: 'blueprints', label: 'Blueprints', icon: 'blueprint' },
  { id: 'project', label: 'Project', icon: 'settings' },
  { id: 'storage', label: 'Storage', icon: 'local' },
  { id: 'appearance', label: 'Editor', icon: 'editor' },
];

const blueprintGroups = [
  { title: 'Commerce & operations', items: ['Online Store', 'CRM Pipeline', 'Appointments', 'Inventory', 'Restaurant', 'Clinic'] },
  { title: 'Publishing & community', items: ['Blog & Magazine', 'Business Directory', 'Creative Portfolio', 'Events', 'LMS Academy', 'Memberships'] },
  { title: 'Vertical systems', items: ['Real Estate', 'Marketplace', 'Job Board', 'Help Desk', 'NGO & Donations', 'Tattoo Studio'] },
] as const;

function KeyValue({ label, value }: { label: string; value: string | number }) {
  return <div className="grid grid-cols-[132px_minmax(0,1fr)] gap-3 border-b border-[var(--color-ec-border)] px-3 py-2.5 last:border-0"><dt className="text-[8px] font-semibold text-[var(--color-ec-text-muted)]">{label}</dt><dd className="min-w-0 break-words text-[9px] text-[var(--color-ec-text)]">{value}</dd></div>;
}

export function GlobalSystemsWorkspace({ initialView = 'themes' }: GlobalSystemsWorkspaceProps) {
  const session = useProjectSession();
  const { preferences, setDensity, setEditorThemeMode, setEditorThemePresetId } = useWorkspacePreferences();
  const [view, setView] = useState<GlobalView>(initialView);

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[var(--color-ec-app)]" aria-label="Global systems studio">
      <header className="shrink-0 border-b border-[var(--color-ec-border)] bg-[var(--color-ec-surface)] px-4 py-3 md:px-5">
        <div className="mx-auto max-w-[1480px]">
          <span className="text-[8px] font-bold uppercase tracking-[.16em] text-[var(--color-ec-accent)]">Global systems</span>
          <h2 className="mt-1 text-[18px] font-semibold tracking-[-.03em] text-[var(--color-ec-text)]">Themes, blueprints & settings</h2>
          <p className="mt-1 text-[9px] text-[var(--color-ec-text-muted)]">Manage project-wide design, editor appearance and local-first project configuration from one professional surface.</p>
        </div>
      </header>

      <div className="mx-auto flex min-h-0 w-full max-w-[1480px] flex-1 flex-col p-3 md:p-4">
        <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-[var(--color-ec-border)] pb-3 [scrollbar-width:none]" role="tablist" aria-label="Global systems">
          {views.map((item) => <button key={item.id} type="button" role="tab" aria-selected={view === item.id} className="ec-focus-ring flex h-8 shrink-0 items-center gap-1.5 rounded-[var(--ec-radius-md)] px-2.5 text-[9px] font-semibold text-[var(--color-ec-text-muted)] data-[active=true]:bg-[var(--color-ec-surface)] data-[active=true]:text-[var(--color-ec-text)] data-[active=true]:shadow-sm" data-active={view === item.id ? 'true' : 'false'} onClick={() => setView(item.id)}><Icon name={item.icon} size={11} />{item.label}</button>)}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pt-3">
          {view === 'themes' ? <div className="grid gap-3 xl:grid-cols-2"><ProjectThemeControls scope="frontend" /><ProjectThemeControls scope="backend" /></div> : null}

          {view === 'blueprints' ? <div className="grid gap-3 lg:grid-cols-3">{blueprintGroups.map((group) => <section key={group.title} className="rounded-[var(--ec-radius-lg)] border border-[var(--color-ec-border)] bg-[var(--color-ec-surface)] p-3 shadow-[var(--ec-shadow-panel)]"><span className="text-[8px] font-bold uppercase tracking-[.12em] text-[var(--color-ec-text-muted)]">{group.title}</span><div className="mt-3 space-y-1">{group.items.map((item) => <article key={item} className="flex min-h-11 items-center justify-between gap-3 rounded-[var(--ec-radius-md)] border border-[var(--color-ec-border)] px-2.5"><span className="flex min-w-0 items-center gap-2"><span className="grid size-7 shrink-0 place-items-center rounded-[var(--ec-radius-sm)] bg-[var(--color-ec-surface-muted)] text-[var(--color-ec-text-muted)]"><Icon name="blueprint" size={12} /></span><strong className="truncate text-[9px] font-semibold text-[var(--color-ec-text)]">{item}</strong></span><button type="button" className="ec-control h-7 px-2 text-[8px] font-semibold" disabled>Apply</button></article>)}</div></section>)}</div> : null}

          {view === 'project' ? <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_360px]"><section className="overflow-hidden rounded-[var(--ec-radius-lg)] border border-[var(--color-ec-border)] bg-[var(--color-ec-surface)] shadow-[var(--ec-shadow-panel)]"><header className="border-b border-[var(--color-ec-border)] px-3 py-3"><strong className="text-[10px] text-[var(--color-ec-text)]">Canonical project</strong></header><dl><KeyValue label="Name" value={session.project.name} /><KeyValue label="Project id" value={session.project.id} /><KeyValue label="Schema" value={session.project.schemaVersion} /><KeyValue label="Documents" value={session.project.documentOrder.length} /><KeyValue label="Breakpoints" value={session.project.breakpoints.length} /><KeyValue label="Frontend theme" value={session.project.frontendThemeId} /><KeyValue label="Backend theme" value={session.project.backendThemeId} /></dl></section><aside className="rounded-[var(--ec-radius-lg)] border border-[var(--color-ec-border)] bg-[var(--color-ec-surface)] p-4 shadow-[var(--ec-shadow-panel)]"><span className="text-[8px] font-bold uppercase tracking-[.12em] text-[var(--color-ec-text-muted)]">Project health</span><strong className="mt-2 block text-[12px] text-[var(--color-ec-text)]">Canonical state connected</strong><p className="mt-2 text-[9px] leading-5 text-[var(--color-ec-text-muted)]">Settings displayed here come from the same project model used by Builder, Content, Forms and Backend.</p></aside></div> : null}

          {view === 'storage' ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"><section className="rounded-[var(--ec-radius-lg)] border border-[var(--color-ec-border)] bg-[var(--color-ec-surface)] p-4 shadow-[var(--ec-shadow-panel)]"><span className="text-[8px] font-bold uppercase tracking-[.12em] text-[var(--color-ec-text-muted)]">Save state</span><strong className="mt-3 block text-[14px] capitalize text-[var(--color-ec-text)]">{session.saveState}</strong></section><section className="rounded-[var(--ec-radius-lg)] border border-[var(--color-ec-border)] bg-[var(--color-ec-surface)] p-4 shadow-[var(--ec-shadow-panel)]"><span className="text-[8px] font-bold uppercase tracking-[.12em] text-[var(--color-ec-text-muted)]">Revision</span><strong className="mt-3 block text-[14px] tabular-nums text-[var(--color-ec-text)]">{session.project.historyMetadata.revision}</strong></section><section className="rounded-[var(--ec-radius-lg)] border border-[var(--color-ec-border)] bg-[var(--color-ec-surface)] p-4 shadow-[var(--ec-shadow-panel)]"><span className="text-[8px] font-bold uppercase tracking-[.12em] text-[var(--color-ec-text-muted)]">Last saved</span><strong className="mt-3 block text-[10px] text-[var(--color-ec-text)]">{session.project.historyMetadata.lastSavedAt ?? 'Not recorded'}</strong></section><section className="rounded-[var(--ec-radius-lg)] border border-[var(--color-ec-border)] bg-[var(--color-ec-surface)] p-4 shadow-[var(--ec-shadow-panel)]"><span className="text-[8px] font-bold uppercase tracking-[.12em] text-[var(--color-ec-text-muted)]">Local-first</span><strong className="mt-3 block text-[10px] text-[var(--color-ec-text)]">Autosave / recovery contract</strong><p className="mt-1 text-[8px] leading-4 text-[var(--color-ec-text-muted)]">Runtime persistence remains managed by ProjectSession and the configured persistence adapter.</p></section></div> : null}

          {view === 'appearance' ? <div className="grid gap-3 lg:grid-cols-3"><label className="rounded-[var(--ec-radius-lg)] border border-[var(--color-ec-border)] bg-[var(--color-ec-surface)] p-3 text-[9px] font-semibold text-[var(--color-ec-text-muted)] shadow-[var(--ec-shadow-panel)]"><span className="mb-2 block">Editor theme mode</span><select className="ec-control h-9 w-full px-2 text-[9px]" aria-label="Global editor theme mode" value={preferences.editorThemeMode} onChange={(event) => setEditorThemeMode(event.target.value as typeof preferences.editorThemeMode)}><option value="auto">System</option><option value="light">Light</option><option value="dark">Dark</option></select></label><label className="rounded-[var(--ec-radius-lg)] border border-[var(--color-ec-border)] bg-[var(--color-ec-surface)] p-3 text-[9px] font-semibold text-[var(--color-ec-text-muted)] shadow-[var(--ec-shadow-panel)]"><span className="mb-2 block">Density</span><select className="ec-control h-9 w-full px-2 text-[9px]" aria-label="Global workspace density" value={preferences.density} onChange={(event) => setDensity(event.target.value as 'compact' | 'comfortable')}><option value="compact">Compact</option><option value="comfortable">Comfortable</option></select></label><label className="rounded-[var(--ec-radius-lg)] border border-[var(--color-ec-border)] bg-[var(--color-ec-surface)] p-3 text-[9px] font-semibold text-[var(--color-ec-text-muted)] shadow-[var(--ec-shadow-panel)]"><span className="mb-2 block">Editor preset</span><select className="ec-control h-9 w-full px-2 text-[9px]" aria-label="Global editor preset" value={preferences.editorThemePresetId} onChange={(event) => setEditorThemePresetId(event.target.value as typeof preferences.editorThemePresetId)}>{EDITOR_THEME_PRESETS.map((preset) => <option key={preset.id} value={preset.id}>{preset.label}</option>)}</select></label></div> : null}
        </div>
      </div>
    </section>
  );
}
