import { useMemo, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import type { WidgetDefinition } from '../../core/widgets';
import { Icon, type IconName } from '../components/Icon';
import { EditorCanvas } from '../editor/canvas/EditorCanvas';
import { useCanvasDocumentActions } from '../editor/canvas/use-canvas-document-actions';
import { useProjectSession } from '../project/project-session-context';
import type { WorkspaceId } from '../routing/workspaces';
import { useEditorWidgetRegistry } from '../widgets/editor-widget-registry-context';
import { MAX_NAVIGATION_WIDTH, MIN_NAVIGATION_WIDTH } from '../workspace/workspace-preferences';
import { useWorkspacePreferences } from '../workspace/workspace-preferences-store';
import { BackendRolesWorkspace } from './BackendRolesWorkspace';
import { DynamicContentWorkspace } from './DynamicContentWorkspace';
import { FormsFiltersWorkspace } from './FormsFiltersWorkspace';
import { GlobalSystemsWorkspace } from './GlobalSystemsWorkspace';
import { LivePreviewWorkspace } from './LivePreviewWorkspace';
import { PagesAssetsWorkspace } from './PagesAssetsWorkspace';
import { PublishingWorkspace } from './PublishingWorkspace';
import { StudioCommandPalette } from './StudioCommandPalette';

type StudioModuleId =
  | 'builder'
  | 'pages'
  | 'content'
  | 'queries'
  | 'forms'
  | 'filters'
  | 'media'
  | 'themes'
  | 'users'
  | 'blueprints'
  | 'settings';

interface ProductionStudioProps {
  workspaceId: WorkspaceId;
  compactLayout: boolean;
  navigationOpen: boolean;
  onCloseNavigation(): void;
  onNavigate(workspaceId: WorkspaceId): void;
}

interface StudioModuleDefinition {
  id: StudioModuleId;
  label: string;
  description: string;
  icon: IconName;
}

const modules: readonly StudioModuleDefinition[] = [
  { id: 'builder', label: 'Builder', description: 'Visual page builder', icon: 'editor' },
  { id: 'pages', label: 'Pages', description: 'Pages and templates', icon: 'pages' },
  { id: 'content', label: 'Content', description: 'Models and records', icon: 'database' },
  { id: 'queries', label: 'Queries', description: 'Dynamic data queries', icon: 'query' },
  { id: 'forms', label: 'Forms', description: 'Forms and actions', icon: 'form' },
  { id: 'filters', label: 'Filters', description: 'Smart filtering', icon: 'filter' },
  { id: 'media', label: 'Media', description: 'Assets and files', icon: 'media' },
  { id: 'themes', label: 'Themes', description: 'Design systems', icon: 'theme' },
  { id: 'users', label: 'Roles', description: 'Users and access', icon: 'users' },
  { id: 'blueprints', label: 'Blueprints', description: 'Project starters', icon: 'blueprint' },
  { id: 'settings', label: 'Settings', description: 'Project configuration', icon: 'settings' },
];

const primaryWorkspaces: readonly { id: WorkspaceId; label: string; icon: IconName }[] = [
  { id: 'editor', label: 'Editor', icon: 'editor' },
  { id: 'preview', label: 'Preview', icon: 'preview' },
  { id: 'backend', label: 'Backend', icon: 'backend' },
  { id: 'export', label: 'Export', icon: 'export' },
];

const categoryLabels: Record<string, string> = {
  structural: 'Layout',
  basic: 'Basic',
  content: 'Content',
  dynamic: 'Dynamic',
  commerce: 'Commerce',
  form: 'Forms',
  filter: 'Filters',
};

const categoryIcons: Record<string, IconName> = {
  structural: 'grid',
  basic: 'blocks',
  content: 'content',
  dynamic: 'database',
  commerce: 'list',
  form: 'form',
  filter: 'filter',
};

const quietButton = 'ec-control ec-focus-ring inline-flex h-8 items-center justify-center gap-1.5 px-2.5 text-[10px] font-semibold text-[var(--color-ec-text-muted)] hover:text-[var(--color-ec-text)]';

function StudioRail({ compactLayout, workspaceId, activeModule, settingsOpen, onSettingsOpenChange, onNavigate, onSelectModule, onClose }: {
  compactLayout: boolean;
  workspaceId: WorkspaceId;
  activeModule: StudioModuleId;
  settingsOpen: boolean;
  onSettingsOpenChange(open: boolean): void;
  onNavigate(workspaceId: WorkspaceId): void;
  onSelectModule(moduleId: StudioModuleId): void;
  onClose(): void;
}) {
  const { preferences, setNavigationPosition, setNavigationWidth, setNavigationCollapsed, setNavigationDisplayMode, moveWorkspace, setDensity, reset } = useWorkspacePreferences();
  const collapsed = !compactLayout && preferences.navigationCollapsed;
  const displayMode = collapsed ? 'icons' : preferences.navigationDisplayMode;
  const showLabels = displayMode !== 'icons';
  const showIcons = displayMode !== 'labels';
  const railButtonClass = 'ec-focus-ring group relative flex h-9 w-full items-center gap-2 rounded-[var(--ec-radius-md)] px-2 text-left text-[11px] font-medium text-white/55 transition-colors hover:bg-white/[.06] hover:text-white data-[active=true]:bg-[var(--color-ec-accent-soft)] data-[active=true]:text-[var(--color-ec-accent)]';

  const handleResizeStart = (event: PointerEvent<HTMLDivElement>) => {
    if (compactLayout || collapsed) return;
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = preferences.navigationWidth;
    const direction = preferences.navigationPosition === 'left' ? 1 : -1;
    const onMove = (moveEvent: globalThis.PointerEvent) => {
      setNavigationWidth(startWidth + (moveEvent.clientX - startX) * direction);
    };
    const onUp = () => {
      globalThis.removeEventListener('pointermove', onMove);
      globalThis.removeEventListener('pointerup', onUp);
    };
    globalThis.addEventListener('pointermove', onMove);
    globalThis.addEventListener('pointerup', onUp);
  };

  const handleResizeKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const delta = event.key === 'ArrowRight' ? 12 : -12;
    const direction = preferences.navigationPosition === 'left' ? 1 : -1;
    setNavigationWidth(preferences.navigationWidth + delta * direction);
  };

  return (
    <aside
      className={`workspace-navigation studio-rail relative flex h-full shrink-0 flex-col border-white/[.06] bg-[var(--color-ec-chrome)] p-2 text-white ${collapsed ? 'w-[58px]' : compactLayout ? 'w-full' : 'min-w-[196px] max-w-[360px]'} ${preferences.navigationPosition === 'right' ? 'border-l' : 'border-r'}`}
      aria-label="Workspace navigation"
      data-position={preferences.navigationPosition}
      data-collapsed={collapsed ? 'true' : 'false'}
      data-display-mode={displayMode}
      data-navigation-width={preferences.navigationWidth}
      style={!compactLayout && !collapsed ? { width: preferences.navigationWidth } : undefined}
    >
      <div className="mb-2 flex h-10 items-center justify-between gap-2 px-1">
        <div className="flex min-w-0 items-center gap-2">
          <div className="grid size-8 shrink-0 place-items-center rounded-[var(--ec-radius-md)] bg-[var(--color-ec-chrome-raised)] text-[var(--color-ec-accent)] ring-1 ring-white/[.07]"><Icon name="bolt" size={16} /></div>
          {showLabels ? <div className="min-w-0"><strong className="block truncate text-[12px] font-semibold tracking-[-.01em] text-white">ElectroCMS</strong><span className="block text-[8px] font-semibold uppercase tracking-[.18em] text-white/35">Workspace</span></div> : null}
        </div>
        <button className="ec-focus-ring grid size-8 shrink-0 place-items-center rounded-[var(--ec-radius-md)] text-white/35 transition-colors hover:bg-white/[.06] hover:text-white" type="button" aria-label={compactLayout ? 'Close navigation' : collapsed ? 'Expand navigation' : 'Collapse navigation'} onClick={compactLayout ? onClose : () => setNavigationCollapsed(!collapsed)}><Icon name={compactLayout ? 'close' : collapsed ? 'expand' : 'collapse'} size={15} /></button>
      </div>

      <nav className="space-y-1" aria-label="Primary workspaces">
        {preferences.workspaceOrder.map((workspaceIdFromOrder) => {
          const workspace = primaryWorkspaces.find((item) => item.id === workspaceIdFromOrder);
          if (!workspace) return null;
          return <button key={workspace.id} type="button" className={railButtonClass} data-active={workspaceId === workspace.id ? 'true' : 'false'} aria-label={workspace.label} title={workspace.label} onClick={() => { onNavigate(workspace.id); if (compactLayout) onClose(); }}>{workspaceId === workspace.id ? <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-[var(--color-ec-accent)]" aria-hidden="true" /> : null}{showIcons ? <span className="grid size-6 shrink-0 place-items-center"><Icon name={workspace.icon} size={15} /></span> : null}{showLabels ? <span className="min-w-0 flex-1 truncate">{workspace.label}</span> : null}</button>;
        })}
      </nav>

      <div className="my-2 h-px bg-white/[.06]" />
      {showLabels ? <span className="mb-1 px-2 text-[8px] font-semibold uppercase tracking-[.18em] text-white/25">Create</span> : null}
      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-0.5 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,.12)_transparent]" aria-label="Studio modules">
        {modules.map((module) => <button key={module.id} type="button" className={railButtonClass} data-active={workspaceId === 'editor' && activeModule === module.id ? 'true' : 'false'} aria-label={module.label} title={module.label} onClick={() => { onSelectModule(module.id); if (compactLayout) onClose(); }}>{workspaceId === 'editor' && activeModule === module.id ? <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-[var(--color-ec-accent)]" aria-hidden="true" /> : null}{showIcons ? <span className="grid size-6 shrink-0 place-items-center"><Icon name={module.icon} size={15} /></span> : null}{showLabels ? <span className="min-w-0 flex-1 truncate">{module.label}</span> : null}</button>)}
      </nav>

      <details className="group/settings relative mt-2 border-t border-white/[.06] pt-2" open={settingsOpen} onToggle={(event) => onSettingsOpenChange(event.currentTarget.open)}>
        <summary className="ec-focus-ring flex h-9 cursor-pointer list-none items-center gap-2 rounded-[var(--ec-radius-md)] px-2 text-[10px] font-medium text-white/40 transition-colors hover:bg-white/[.06] hover:text-white [&::-webkit-details-marker]:hidden"><span className="grid size-6 place-items-center"><Icon name="settings" size={14} /></span>{showLabels ? <span>Workspace settings</span> : <span className="sr-only">Workspace settings</span>}</summary>
        <div className={`absolute bottom-0 z-50 w-[264px] rounded-[var(--ec-radius-lg)] border border-[var(--color-ec-border)] bg-[var(--color-ec-surface)] p-3 text-[var(--color-ec-text)] shadow-[var(--ec-shadow-float)] ${preferences.navigationPosition === 'right' ? 'right-full mr-2' : 'left-full ml-2'}`}>
          <div className="mb-3"><strong className="text-[11px]">Layout preferences</strong><p className="mt-0.5 text-[9px] leading-4 text-[var(--color-ec-text-muted)]">Customize the editor chrome without changing project data.</p></div>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-[9px] font-medium text-[var(--color-ec-text-muted)]"><span className="mb-1 block">Position</span><select className="ec-control h-8 w-full px-2 text-[10px]" aria-label="Navigation position" value={preferences.navigationPosition} onChange={(event) => setNavigationPosition(event.target.value as 'left' | 'right')}><option value="left">Left</option><option value="right">Right</option></select></label>
            <label className="text-[9px] font-medium text-[var(--color-ec-text-muted)]"><span className="mb-1 block">Display</span><select className="ec-control h-8 w-full px-2 text-[10px]" aria-label="Navigation display mode" value={preferences.navigationDisplayMode} onChange={(event) => setNavigationDisplayMode(event.target.value as 'icons' | 'labels' | 'both')}><option value="both">Icons + labels</option><option value="icons">Icons</option><option value="labels">Labels</option></select></label>
            <label className="col-span-2 text-[9px] font-medium text-[var(--color-ec-text-muted)]"><span className="mb-1 block">Density</span><select className="ec-control h-8 w-full px-2 text-[10px]" aria-label="Workspace density" value={preferences.density} onChange={(event) => setDensity(event.target.value as 'compact' | 'comfortable')}><option value="compact">Compact</option><option value="comfortable">Comfortable</option></select></label>
          </div>
          <fieldset className="mt-3 border-t border-[var(--color-ec-border)] pt-3"><legend className="mb-1 text-[8px] font-semibold uppercase tracking-[.14em] text-[var(--color-ec-text-muted)]">Workspace order</legend><div className="space-y-1">{preferences.workspaceOrder.map((orderedWorkspace, index) => { const workspace = primaryWorkspaces.find((item) => item.id === orderedWorkspace); if (!workspace) return null; return <div key={orderedWorkspace} className="flex h-7 items-center justify-between rounded-[var(--ec-radius-sm)] px-1.5 text-[10px] hover:bg-[var(--color-ec-surface-muted)]"><span>{workspace.label}</span><span className="flex gap-0.5"><button className="ec-focus-ring grid size-6 place-items-center rounded text-[var(--color-ec-text-muted)] hover:bg-[var(--color-ec-surface-subtle)] hover:text-[var(--color-ec-text)] disabled:opacity-25" type="button" aria-label={`Move ${workspace.label} up`} disabled={index === 0} onClick={() => moveWorkspace(orderedWorkspace, -1)}><Icon name="arrow-up" size={12} /></button><button className="ec-focus-ring grid size-6 place-items-center rounded text-[var(--color-ec-text-muted)] hover:bg-[var(--color-ec-surface-subtle)] hover:text-[var(--color-ec-text)] disabled:opacity-25" type="button" aria-label={`Move ${workspace.label} down`} disabled={index === preferences.workspaceOrder.length - 1} onClick={() => moveWorkspace(orderedWorkspace, 1)}><Icon name="arrow-down" size={12} /></button></span></div>; })}</div></fieldset>
          <button className="ec-control ec-focus-ring mt-3 h-8 w-full text-[10px] font-semibold" type="button" onClick={reset}>Reset workspace layout</button>
        </div>
      </details>

      {!compactLayout && !collapsed ? <div className={`group/resizer absolute inset-y-0 z-20 w-2 touch-none cursor-col-resize outline-none ${preferences.navigationPosition === 'left' ? '-right-1' : '-left-1'}`} role="separator" aria-label="Resize navigation" aria-orientation="vertical" aria-valuemin={MIN_NAVIGATION_WIDTH} aria-valuemax={MAX_NAVIGATION_WIDTH} aria-valuenow={preferences.navigationWidth} aria-valuetext={`${preferences.navigationWidth} pixels`} tabIndex={0} onPointerDown={handleResizeStart} onKeyDown={handleResizeKeyDown}><span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-transparent transition-colors group-hover/resizer:bg-[var(--color-ec-accent)] group-focus-visible/resizer:bg-[var(--color-ec-accent)]" aria-hidden="true" /></div> : null}
    </aside>
  );
}

function WidgetLibrary({ onInsert }: { onInsert(definition: WidgetDefinition): void }) {
  const registry = useEditorWidgetRegistry();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const definitions = useMemo(() => registry.core.listLatest(), [registry]);
  const categories = useMemo(() => [...new Set(definitions.map((item) => item.metadata.category))], [definitions]);
  const visible = definitions.filter((definition) => {
    const query = search.trim().toLowerCase();
    return (activeCategory === 'all' || definition.metadata.category === activeCategory) && (!query || `${definition.metadata.name} ${definition.metadata.description} ${definition.type}`.toLowerCase().includes(query));
  });

  return (
    <aside className="studio-library flex min-h-0 w-[264px] shrink-0 flex-col border-r border-[var(--color-ec-border)] bg-[var(--color-ec-surface)]" aria-label="Insert library">
      <div className="flex h-12 items-center justify-between border-b border-[var(--color-ec-border)] px-3"><div><span className="block text-[8px] font-semibold uppercase tracking-[.18em] text-[var(--color-ec-text-muted)]">Library</span><strong className="text-[11px] font-semibold text-[var(--color-ec-text)]">Elements</strong></div><span className="grid size-7 place-items-center rounded-[var(--ec-radius-md)] bg-[var(--color-ec-accent-soft)] text-[var(--color-ec-accent)]"><Icon name="blocks" size={14} /></span></div>
      <div className="p-2.5"><label className="ec-control flex h-9 items-center gap-2 px-2.5 text-[var(--color-ec-text-muted)] focus-within:border-[var(--color-ec-accent)] focus-within:shadow-[var(--ec-focus-ring)]"><Icon name="search" size={13} /><input className="min-w-0 flex-1 bg-transparent text-[10px] text-[var(--color-ec-text)] outline-none placeholder:text-[var(--color-ec-text-muted)]" aria-label="Search elements" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search elements" /></label></div>
      <div className="flex gap-1 overflow-x-auto border-b border-[var(--color-ec-border)] px-2.5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Element categories"><button className="ec-focus-ring h-7 shrink-0 rounded-[var(--ec-radius-sm)] px-2 text-[9px] font-semibold text-[var(--color-ec-text-muted)] hover:bg-[var(--color-ec-surface-muted)] data-[active=true]:bg-[var(--color-ec-accent-soft)] data-[active=true]:text-[var(--color-ec-accent)]" type="button" data-active={activeCategory === 'all'} onClick={() => setActiveCategory('all')}>All</button>{categories.map((category) => <button className="ec-focus-ring h-7 shrink-0 rounded-[var(--ec-radius-sm)] px-2 text-[9px] font-semibold text-[var(--color-ec-text-muted)] hover:bg-[var(--color-ec-surface-muted)] data-[active=true]:bg-[var(--color-ec-accent-soft)] data-[active=true]:text-[var(--color-ec-accent)]" key={category} type="button" data-active={activeCategory === category} onClick={() => setActiveCategory(category)}>{categoryLabels[category] ?? category}</button>)}</div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2.5 [scrollbar-width:thin]">{categories.map((category) => { const group = visible.filter((definition) => definition.metadata.category === category); if (group.length === 0) return null; return <section className="mb-4" key={category}><div className="mb-1.5 flex items-center justify-between px-0.5 text-[8px] font-semibold uppercase tracking-[.14em] text-[var(--color-ec-text-muted)]"><span className="flex items-center gap-1.5"><Icon name={categoryIcons[category] ?? 'blocks'} size={11} />{categoryLabels[category] ?? category}</span><small className="font-medium tabular-nums">{group.length}</small></div><div className="grid grid-cols-2 gap-1.5">{group.map((definition) => <button key={`${definition.type}@${definition.version}`} type="button" className="ec-focus-ring group flex min-h-16 flex-col items-start justify-between rounded-[var(--ec-radius-md)] border border-[var(--color-ec-border)] bg-[var(--color-ec-surface)] p-2 text-left transition-[border-color,background-color,transform] hover:-translate-y-px hover:border-[var(--color-ec-accent)] hover:bg-[var(--color-ec-surface-subtle)]" aria-label={`Add ${definition.metadata.name} from element library`} title={`${definition.metadata.name} — ${definition.metadata.description}`} onClick={() => onInsert(definition)}><span className="grid size-7 place-items-center rounded-[var(--ec-radius-sm)] bg-[var(--color-ec-surface-muted)] text-[var(--color-ec-text-muted)] transition-colors group-hover:bg-[var(--color-ec-accent-soft)] group-hover:text-[var(--color-ec-accent)]"><Icon name={categoryIcons[definition.metadata.category] ?? 'blocks'} size={13} /></span><span className="mt-2 line-clamp-1 text-[9px] font-semibold text-[var(--color-ec-text)]">{definition.metadata.name}</span></button>)}</div></section>; })}{visible.length === 0 ? <div className="grid min-h-36 place-items-center rounded-[var(--ec-radius-lg)] border border-dashed border-[var(--color-ec-border)] bg-[var(--color-ec-surface-subtle)] p-5 text-center"><div><span className="mx-auto mb-2 grid size-9 place-items-center rounded-full bg-[var(--color-ec-surface)] text-[var(--color-ec-text-muted)] shadow-sm"><Icon name="search" size={16} /></span><strong className="block text-[10px] text-[var(--color-ec-text)]">No elements found</strong><span className="mt-1 block text-[9px] text-[var(--color-ec-text-muted)]">Try another search or category.</span></div></div> : null}</div>
    </aside>
  );
}

function BuilderWorkspace() {
  const session = useProjectSession();
  const actions = useCanvasDocumentActions();
  const document = session.project.documents[session.activeDocumentId];
  const breakpoint = session.project.breakpoints.find((candidate) => candidate.id === session.activeBreakpointId);
  if (!document || !breakpoint) return <div className="grid min-h-0 flex-1 place-items-center bg-[var(--color-ec-app)] p-6"><div className="max-w-sm text-center"><Icon name="editor" size={19} /><strong className="mt-3 block text-[12px] font-semibold text-[var(--color-ec-text)]">No active document</strong><p className="mt-1 text-[10px] leading-5 text-[var(--color-ec-text-muted)]">Create or select a document to start building.</p></div></div>;
  return <div className="studio-builder-workspace flex min-h-0 flex-1 overflow-hidden"><WidgetLibrary onInsert={(definition) => actions.insertWidget(definition.type)} /><div className="studio-editor-region flex min-w-0 flex-1 flex-col bg-[var(--color-ec-app)]"><div className="flex h-10 shrink-0 items-center justify-between border-b border-[var(--color-ec-border)] bg-[var(--color-ec-surface)] px-3"><div className="flex min-w-0 items-center gap-1.5 text-[9px] text-[var(--color-ec-text-muted)]"><span className="truncate">{document.name}</span><span>/</span><strong className="font-semibold text-[var(--color-ec-text)]">Canvas</strong></div><div className="hidden items-center gap-1 md:flex"><button className={quietButton} type="button"><Icon name="grid" size={12} />Grid</button><button className={quietButton} type="button"><Icon name="layers" size={12} />Layers</button></div></div><EditorCanvas document={document} breakpointId={session.activeBreakpointId} breakpoints={session.project.breakpoints} viewportWidth={breakpoint.width} zoom={session.zoom} actions={actions} /></div></div>;
}

function EditorModuleWorkspace({ module, onOpenBuilder }: { module: StudioModuleId; onOpenBuilder(): void }) {
  if (module === 'builder') return <BuilderWorkspace />;
  if (module === 'pages') return <PagesAssetsWorkspace key="pages" initialView="pages" onOpenBuilder={onOpenBuilder} />;
  if (module === 'media') return <PagesAssetsWorkspace key="media" initialView="assets" onOpenBuilder={onOpenBuilder} />;
  if (module === 'content') return <DynamicContentWorkspace key="content" initialResource="content-types" />;
  if (module === 'queries') return <DynamicContentWorkspace key="queries" initialResource="queries" />;
  if (module === 'forms') return <FormsFiltersWorkspace key="forms" initialResource="forms" />;
  if (module === 'filters') return <FormsFiltersWorkspace key="filters" initialResource="filters" />;
  if (module === 'users') return <BackendRolesWorkspace key="roles" initialView="roles" />;
  if (module === 'themes') return <GlobalSystemsWorkspace key="themes" initialView="themes" />;
  if (module === 'blueprints') return <GlobalSystemsWorkspace key="blueprints" initialView="blueprints" />;
  return <GlobalSystemsWorkspace key="settings" initialView="project" />;
}

export function ProductionStudio({ workspaceId, compactLayout, navigationOpen, onCloseNavigation, onNavigate }: ProductionStudioProps) {
  const { preferences } = useWorkspacePreferences();
  const [activeModule, setActiveModule] = useState<StudioModuleId>('builder');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const activeDefinition = modules.find((module) => module.id === activeModule) ?? modules[0];
  const collapsed = !compactLayout && preferences.navigationCollapsed;
  const selectModule = (moduleId: StudioModuleId) => { setActiveModule(moduleId); if (workspaceId !== 'editor') onNavigate('editor'); };

  let content: ReactNode;
  if (workspaceId === 'preview') content = <LivePreviewWorkspace />;
  else if (workspaceId === 'backend') content = <BackendRolesWorkspace initialView="overview" />;
  else if (workspaceId === 'export') content = <PublishingWorkspace />;
  else content = <EditorModuleWorkspace module={activeModule} onOpenBuilder={() => setActiveModule('builder')} />;

  const workspaceLabel = primaryWorkspaces.find((workspace) => workspace.id === workspaceId)?.label ?? 'Editor';
  const rail = <StudioRail compactLayout={compactLayout} workspaceId={workspaceId} activeModule={activeModule} settingsOpen={settingsOpen} onSettingsOpenChange={setSettingsOpen} onNavigate={onNavigate} onSelectModule={selectModule} onClose={onCloseNavigation} />;

  return (
    <main className="production-studio flex min-h-0 flex-1 overflow-hidden bg-[var(--color-ec-app)] text-[var(--color-ec-text)]" id="workspace-main" tabIndex={-1} data-workspace={workspaceId} data-compact={compactLayout ? 'true' : 'false'} data-navigation-position={preferences.navigationPosition} data-navigation-collapsed={collapsed ? 'true' : 'false'}>
      <h1 className="sr-only">{workspaceLabel} workspace</h1>
      {!compactLayout && preferences.navigationPosition === 'left' ? rail : null}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-10 shrink-0 items-center justify-between gap-3 border-b border-[var(--color-ec-border)] bg-[var(--color-ec-surface)] px-3"><div className="flex min-w-0 items-center gap-2"><span className="text-[8px] font-semibold uppercase tracking-[.18em] text-[var(--color-ec-text-muted)]">{workspaceId === 'editor' ? 'Studio' : 'Workspace'}</span><span className="h-3 w-px bg-[var(--color-ec-border)]" /><strong className="truncate text-[10px] font-semibold text-[var(--color-ec-text)]">{workspaceId === 'editor' ? activeDefinition?.label ?? 'Builder' : workspaceLabel}</strong></div><button type="button" className={`${quietButton} hidden md:inline-flex`} aria-label="Open command palette" title="Command palette · Ctrl/⌘ K" onClick={() => setCommandOpen(true)}><Icon name="command" size={12} />Commands</button></div>
        <div className="flex min-h-0 flex-1">{content}</div>
      </div>
      {!compactLayout && preferences.navigationPosition === 'right' ? rail : null}
      {compactLayout && navigationOpen ? <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px]" role="presentation" onPointerDown={(event) => { if (event.target === event.currentTarget) onCloseNavigation(); }}><div className="h-full w-[min(86vw,260px)] shadow-2xl" role="dialog" aria-modal="true" aria-label="Workspace navigation">{rail}</div></div> : null}
      <StudioCommandPalette open={commandOpen} onOpenChange={setCommandOpen} onNavigate={onNavigate} onSelectModule={selectModule} />
    </main>
  );
}
