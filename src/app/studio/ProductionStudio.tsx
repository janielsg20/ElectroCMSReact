import { useEffect, useMemo, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import type { WidgetDefinition } from '../../core/widgets';
import { Icon, type IconName } from '../components/Icon';
import { EditorCanvas, type CanvasMobilePanel } from '../editor/canvas/EditorCanvas';
import { useCanvasDocumentActions } from '../editor/canvas/use-canvas-document-actions';
import { useProjectSession } from '../project/project-session-context';
import type { EditorModuleId } from '../routing/editor-modules';
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

interface ProductionStudioProps {
  workspaceId: WorkspaceId;
  editorModuleId: EditorModuleId;
  compactLayout: boolean;
  navigationOpen: boolean;
  onCloseNavigation(): void;
  onNavigate(workspaceId: WorkspaceId): void;
  onNavigateEditorModule(moduleId: EditorModuleId): void;
}

interface StudioModuleDefinition {
  id: EditorModuleId;
  label: string;
  description: string;
  icon: IconName;
}

type MobileBuilderPanel = 'pages' | 'components' | 'layers' | 'properties' | null;

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
  activeModule: EditorModuleId;
  settingsOpen: boolean;
  onSettingsOpenChange(open: boolean): void;
  onNavigate(workspaceId: WorkspaceId): void;
  onSelectModule(moduleId: EditorModuleId): void;
  onClose(): void;
}) {
  const { preferences, setNavigationPosition, setNavigationWidth, setNavigationDisplayMode, moveWorkspace, setDensity, reset } = useWorkspacePreferences();
  const forcedDesktopRail = !compactLayout;
  const collapsed = forcedDesktopRail || preferences.navigationCollapsed;
  const displayMode = collapsed ? 'icons' : preferences.navigationDisplayMode;
  const showLabels = compactLayout && displayMode !== 'icons';
  const railButtonClass = 'studio-rail-button ec-focus-ring group relative flex min-h-10 w-full items-center gap-2 rounded-lg px-2 text-left text-[11px] font-medium text-[var(--color-ec-text-muted)] transition-colors hover:bg-[var(--color-ec-surface-muted)] hover:text-[var(--color-ec-text)] data-[active=true]:bg-[var(--color-ec-accent-soft)] data-[active=true]:text-[var(--color-ec-accent)]';

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
      className={`workspace-navigation studio-rail relative flex h-full shrink-0 flex-col bg-[var(--color-ec-surface)] text-[var(--color-ec-text)] ${collapsed ? 'w-[60px]' : compactLayout ? 'w-full' : 'min-w-[196px] max-w-[360px]'}`}
      aria-label="Workspace navigation"
      data-position={preferences.navigationPosition}
      data-collapsed={collapsed ? 'true' : 'false'}
      data-display-mode={displayMode}
      data-navigation-width={preferences.navigationWidth}
      data-studio-rail={forcedDesktopRail ? 'true' : 'false'}
      style={!compactLayout && !collapsed ? { width: preferences.navigationWidth } : undefined}
    >
      <div className="studio-rail-header flex h-12 shrink-0 items-center justify-center gap-2 px-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="studio-rail-brand grid size-9 shrink-0 place-items-center rounded-lg bg-[var(--color-ec-accent-soft)] text-[var(--color-ec-accent)]"><Icon name="bolt" size={17} /></div>
          {showLabels ? <div className="min-w-0"><strong className="block truncate text-xs font-semibold text-[var(--color-ec-text)]">ElectroCMS</strong><span className="block text-[9px] font-medium text-[var(--color-ec-text-muted)]">Studio</span></div> : null}
        </div>
        {compactLayout ? <button className="studio-drawer-close ec-focus-ring ml-auto grid size-12 shrink-0 place-items-center rounded-lg text-[var(--color-ec-text-muted)] hover:bg-[var(--color-ec-surface-muted)] hover:text-[var(--color-ec-text)]" type="button" aria-label="Close navigation" onClick={onClose}><Icon name="close" size={17} /></button> : null}
      </div>

      <nav className="studio-rail-primary grid gap-1 px-2" aria-label="Primary workspaces">
        {preferences.workspaceOrder.map((workspaceIdFromOrder) => {
          const workspace = primaryWorkspaces.find((item) => item.id === workspaceIdFromOrder);
          if (!workspace) return null;
          return <button key={workspace.id} type="button" className={railButtonClass} data-active={workspaceId === workspace.id ? 'true' : 'false'} aria-label={workspace.label} title={workspace.label} onClick={() => { onNavigate(workspace.id); if (compactLayout) onClose(); }}><span className="studio-rail-icon grid size-7 shrink-0 place-items-center"><Icon name={workspace.icon} size={16} /></span>{showLabels ? <span className="min-w-0 flex-1 truncate">{workspace.label}</span> : null}</button>;
        })}
      </nav>

      <div className="mx-auto my-2 h-px w-8 bg-[var(--color-ec-border)]" />
      {showLabels ? <span className="mb-1 px-4 text-[9px] font-semibold uppercase tracking-[.14em] text-[var(--color-ec-text-muted)]">Create</span> : null}
      <nav className="studio-rail-modules grid min-h-0 flex-1 content-start gap-1 overflow-y-auto px-2 [scrollbar-width:thin]" aria-label="Studio modules">
        {modules.map((module) => <button key={module.id} type="button" className={railButtonClass} data-active={workspaceId === 'editor' && activeModule === module.id ? 'true' : 'false'} aria-label={module.label} title={module.label} onClick={() => { onSelectModule(module.id); if (compactLayout) onClose(); }}><span className="studio-rail-icon grid size-7 shrink-0 place-items-center"><Icon name={module.icon} size={16} /></span>{showLabels ? <span className="min-w-0 flex-1 truncate">{module.label}</span> : null}</button>)}
      </nav>

      <details className="workspace-settings group/settings relative m-2 mt-auto border-t border-[var(--color-ec-border)] pt-2" open={settingsOpen} onToggle={(event) => onSettingsOpenChange(event.currentTarget.open)}>
        <summary className="ec-focus-ring flex min-h-11 cursor-pointer list-none items-center justify-center gap-2 rounded-lg px-2 text-[10px] font-medium text-[var(--color-ec-text-muted)] hover:bg-[var(--color-ec-surface-muted)] hover:text-[var(--color-ec-text)] [&::-webkit-details-marker]:hidden"><span className="studio-rail-icon grid size-7 place-items-center"><Icon name="settings" size={16} /></span>{showLabels ? <span>Workspace settings</span> : <span className="sr-only">Workspace settings</span>}</summary>
        <div className={`workspace-settings-popover absolute bottom-0 z-50 w-[264px] rounded-xl border border-[var(--color-ec-border)] bg-[var(--color-ec-surface)] p-3 text-[var(--color-ec-text)] shadow-xl ${preferences.navigationPosition === 'right' ? 'right-full mr-2' : 'left-full ml-2'}`}>
          <div className="mb-3"><strong className="text-[11px]">Layout preferences</strong><p className="mt-0.5 text-[9px] leading-4 text-[var(--color-ec-text-muted)]">Customize the authoring workspace without changing project data.</p></div>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-[9px] font-medium text-[var(--color-ec-text-muted)]"><span className="mb-1 block">Position</span><select className="ec-control h-9 w-full px-2 text-[10px]" aria-label="Navigation position" value={preferences.navigationPosition} onChange={(event) => setNavigationPosition(event.target.value as 'left' | 'right')}><option value="left">Left</option><option value="right">Right</option></select></label>
            <label className="text-[9px] font-medium text-[var(--color-ec-text-muted)]"><span className="mb-1 block">Display</span><select className="ec-control h-9 w-full px-2 text-[10px]" aria-label="Navigation display mode" value={preferences.navigationDisplayMode} onChange={(event) => setNavigationDisplayMode(event.target.value as 'icons' | 'labels' | 'both')}><option value="both">Icons + labels</option><option value="icons">Icons</option><option value="labels">Labels</option></select></label>
            <label className="col-span-2 text-[9px] font-medium text-[var(--color-ec-text-muted)]"><span className="mb-1 block">Density</span><select className="ec-control h-9 w-full px-2 text-[10px]" aria-label="Workspace density" value={preferences.density} onChange={(event) => setDensity(event.target.value as 'compact' | 'comfortable')}><option value="compact">Compact</option><option value="comfortable">Comfortable</option></select></label>
          </div>
          <fieldset className="mt-3 border-t border-[var(--color-ec-border)] pt-3"><legend className="mb-1 text-[8px] font-semibold uppercase tracking-[.14em] text-[var(--color-ec-text-muted)]">Workspace order</legend><div className="space-y-1">{preferences.workspaceOrder.map((orderedWorkspace, index) => { const workspace = primaryWorkspaces.find((item) => item.id === orderedWorkspace); if (!workspace) return null; return <div key={orderedWorkspace} className="flex min-h-8 items-center justify-between rounded-md px-1.5 text-[10px] hover:bg-[var(--color-ec-surface-muted)]"><span>{workspace.label}</span><span className="flex gap-0.5"><button className="ec-focus-ring grid size-7 place-items-center rounded text-[var(--color-ec-text-muted)] hover:bg-[var(--color-ec-surface-subtle)] hover:text-[var(--color-ec-text)] disabled:opacity-25" type="button" aria-label={`Move ${workspace.label} up`} disabled={index === 0} onClick={() => moveWorkspace(orderedWorkspace, -1)}><Icon name="arrow-up" size={12} /></button><button className="ec-focus-ring grid size-7 place-items-center rounded text-[var(--color-ec-text-muted)] hover:bg-[var(--color-ec-surface-subtle)] hover:text-[var(--color-ec-text)] disabled:opacity-25" type="button" aria-label={`Move ${workspace.label} down`} disabled={index === preferences.workspaceOrder.length - 1} onClick={() => moveWorkspace(orderedWorkspace, 1)}><Icon name="arrow-down" size={12} /></button></span></div>; })}</div></fieldset>
          <button className="ec-control ec-focus-ring mt-3 h-9 w-full text-[10px] font-semibold" type="button" onClick={reset}>Reset workspace layout</button>
        </div>
      </details>

      {!compactLayout && !collapsed ? <div className={`group/resizer absolute inset-y-0 z-20 w-2 touch-none cursor-col-resize outline-none ${preferences.navigationPosition === 'left' ? '-right-1' : '-left-1'}`} role="separator" aria-label="Resize navigation" aria-orientation="vertical" aria-valuemin={MIN_NAVIGATION_WIDTH} aria-valuemax={MAX_NAVIGATION_WIDTH} aria-valuenow={preferences.navigationWidth} aria-valuetext={`${preferences.navigationWidth} pixels`} tabIndex={0} onPointerDown={handleResizeStart} onKeyDown={handleResizeKeyDown}><span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-transparent transition-colors group-hover/resizer:bg-[var(--color-ec-accent)] group-focus-visible/resizer:bg-[var(--color-ec-accent)]" aria-hidden="true" /></div> : null}
    </aside>
  );
}

function WidgetLibrary({ onInsert, initialTab = 'pages' }: { onInsert(definition: WidgetDefinition): void; initialTab?: 'pages' | 'components' }) {
  const registry = useEditorWidgetRegistry();
  const session = useProjectSession();
  const [panelTab, setPanelTab] = useState<'pages' | 'components'>(initialTab);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const definitions = useMemo(() => registry.core.listLatest(), [registry]);
  const categories = useMemo(() => [...new Set(definitions.map((item) => item.metadata.category))], [definitions]);
  const visible = definitions.filter((definition) => {
    const query = search.trim().toLowerCase();
    return (activeCategory === 'all' || definition.metadata.category === activeCategory) && (!query || `${definition.metadata.name} ${definition.metadata.description} ${definition.type}`.toLowerCase().includes(query));
  });
  const activeDocument = session.project.documents[session.activeDocumentId];

  const renderTreeNode = (nodeId: string, depth = 0): ReactNode => {
    const node = activeDocument?.nodes[nodeId];
    if (!node) return null;
    return (
      <li key={nodeId} role="treeitem" aria-level={depth + 1} className="builder-tree-item">
        <div className="builder-tree-row" style={{ paddingLeft: `${Math.min(depth, 7) * 14 + 8}px` }}>
          <Icon name={node.children.length > 0 ? 'layers' : 'blocks'} size={12} />
          <span className="min-w-0 flex-1 truncate">{node.name}</span>
          <small>{node.type.split('/').pop()}</small>
        </div>
        {node.children.length > 0 ? <ul role="group">{node.children.map((childId) => renderTreeNode(childId, depth + 1))}</ul> : null}
      </li>
    );
  };

  return (
    <aside className="studio-library builder-context-panel flex min-h-0 w-[288px] shrink-0 flex-col border-r border-[var(--color-ec-border)] bg-[var(--color-ec-surface)]" aria-label="Builder navigator">
      <div className="builder-context-tabs grid grid-cols-2 border-b border-[var(--color-ec-border)] p-2" role="tablist" aria-label="Builder navigator views">
        <button className="ec-focus-ring" type="button" role="tab" aria-selected={panelTab === 'pages'} data-active={panelTab === 'pages' ? 'true' : 'false'} onClick={() => setPanelTab('pages')}><Icon name="pages" size={13} />Pages</button>
        <button className="ec-focus-ring" type="button" role="tab" aria-selected={panelTab === 'components'} data-active={panelTab === 'components' ? 'true' : 'false'} onClick={() => setPanelTab('components')}><Icon name="blocks" size={13} />Components</button>
      </div>

      {panelTab === 'pages' ? (
        <div className="builder-pages-panel min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin]">
          <section className="builder-pages-section">
            <header><strong>Pages</strong><span>{session.project.documentOrder.length}</span></header>
            <div className="builder-page-list">
              {session.project.documentOrder.map((documentId) => {
                const document = session.project.documents[documentId];
                if (!document) return null;
                return (
                  <button key={document.id} type="button" className="builder-page-row ec-focus-ring" data-active={document.id === session.activeDocumentId ? 'true' : 'false'} onClick={() => session.setActiveDocumentId(document.id)}>
                    <Icon name={document.kind === 'page' ? 'pages' : 'layers'} size={14} />
                    <span className="min-w-0 flex-1 truncate">{document.name}</span>
                    <span className="builder-page-more" aria-hidden="true">•••</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="builder-pages-section builder-tree-section">
            <header><strong>Widget Tree</strong><span>{activeDocument ? Object.keys(activeDocument.nodes).length : 0}</span></header>
            {activeDocument ? <ul className="builder-widget-tree" role="tree" aria-label="Current document widget tree">{renderTreeNode(activeDocument.rootNodeId)}</ul> : <p className="builder-context-empty">No active document.</p>}
          </section>
        </div>
      ) : (
        <div className="builder-components-panel flex min-h-0 flex-1 flex-col">
          <div className="p-2.5"><label className="ec-control flex h-10 items-center gap-2 px-2.5 text-[var(--color-ec-text-muted)] focus-within:border-[var(--color-ec-accent)] focus-within:shadow-[var(--ec-focus-ring)]"><Icon name="search" size={14} /><input className="min-w-0 flex-1 bg-transparent text-[11px] text-[var(--color-ec-text)] outline-none placeholder:text-[var(--color-ec-text-muted)]" aria-label="Search elements" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search components" /></label></div>
          <div className="flex gap-1 overflow-x-auto border-b border-[var(--color-ec-border)] px-2.5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Element categories"><button className="ec-focus-ring h-8 shrink-0 rounded-md px-2.5 text-[10px] font-semibold text-[var(--color-ec-text-muted)] hover:bg-[var(--color-ec-surface-muted)] data-[active=true]:bg-[var(--color-ec-accent-soft)] data-[active=true]:text-[var(--color-ec-accent)]" type="button" data-active={activeCategory === 'all'} onClick={() => setActiveCategory('all')}>All</button>{categories.map((category) => <button className="ec-focus-ring h-8 shrink-0 rounded-md px-2.5 text-[10px] font-semibold text-[var(--color-ec-text-muted)] hover:bg-[var(--color-ec-surface-muted)] data-[active=true]:bg-[var(--color-ec-accent-soft)] data-[active=true]:text-[var(--color-ec-accent)]" key={category} type="button" data-active={activeCategory === category} onClick={() => setActiveCategory(category)}>{categoryLabels[category] ?? category}</button>)}</div>
          <div className="min-h-0 flex-1 overflow-y-auto p-2.5 [scrollbar-width:thin]">{categories.map((category) => { const group = visible.filter((definition) => definition.metadata.category === category); if (group.length === 0) return null; return <section className="mb-4" key={category}><div className="mb-1.5 flex items-center justify-between px-0.5 text-[9px] font-semibold uppercase tracking-[.12em] text-[var(--color-ec-text-muted)]"><span className="flex items-center gap-1.5"><Icon name={categoryIcons[category] ?? 'blocks'} size={12} />{categoryLabels[category] ?? category}</span><small className="font-medium tabular-nums">{group.length}</small></div><div className="grid grid-cols-2 gap-2">{group.map((definition) => <button key={`${definition.type}@${definition.version}`} type="button" className="ec-focus-ring group flex min-h-20 flex-col items-start justify-between rounded-lg border border-[var(--color-ec-border)] bg-[var(--color-ec-surface)] p-2.5 text-left transition-colors hover:border-[var(--color-ec-accent)] hover:bg-[var(--color-ec-surface-subtle)]" aria-label={`Add ${definition.metadata.name} from element library`} title={`${definition.metadata.name} — ${definition.metadata.description}`} onClick={() => onInsert(definition)}><span className="grid size-8 place-items-center rounded-md bg-[var(--color-ec-surface-muted)] text-[var(--color-ec-text-muted)] transition-colors group-hover:bg-[var(--color-ec-accent-soft)] group-hover:text-[var(--color-ec-accent)]"><Icon name={categoryIcons[definition.metadata.category] ?? 'blocks'} size={14} /></span><span className="mt-2 line-clamp-1 text-[10px] font-semibold text-[var(--color-ec-text)]">{definition.metadata.name}</span></button>)}</div></section>; })}{visible.length === 0 ? <div className="grid min-h-36 place-items-center rounded-xl border border-dashed border-[var(--color-ec-border)] bg-[var(--color-ec-surface-subtle)] p-5 text-center"><div><span className="mx-auto mb-2 grid size-10 place-items-center rounded-full bg-[var(--color-ec-surface)] text-[var(--color-ec-text-muted)] shadow-sm"><Icon name="search" size={17} /></span><strong className="block text-[11px] text-[var(--color-ec-text)]">No components found</strong><span className="mt-1 block text-[10px] text-[var(--color-ec-text-muted)]">Try another search or category.</span></div></div> : null}</div>
        </div>
      )}
    </aside>
  );
}

function BuilderWorkspace({ compactLayout }: { compactLayout: boolean }) {
  const session = useProjectSession();
  const actions = useCanvasDocumentActions();
  const [mobilePanel, setMobilePanel] = useState<MobileBuilderPanel>(null);
  const document = session.project.documents[session.activeDocumentId];
  const breakpoint = session.project.breakpoints.find((candidate) => candidate.id === session.activeBreakpointId);

  useEffect(() => {
    if (!compactLayout || mobilePanel === null) return undefined;
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setMobilePanel(null);
    };
    globalThis.addEventListener('keydown', closeOnEscape);
    return () => globalThis.removeEventListener('keydown', closeOnEscape);
  }, [compactLayout, mobilePanel]);

  if (!document || !breakpoint) return <div className="grid min-h-0 flex-1 place-items-center bg-[var(--color-ec-app)] p-6"><div className="max-w-sm text-center"><Icon name="editor" size={20} /><strong className="mt-3 block text-sm font-semibold text-[var(--color-ec-text)]">No active document</strong><p className="mt-1 text-xs leading-5 text-[var(--color-ec-text-muted)]">Create or select a document to start building.</p></div></div>;

  const canvasMobilePanel: CanvasMobilePanel = mobilePanel === 'layers' || mobilePanel === 'properties' ? mobilePanel : null;
  const editor = <div className="studio-editor-region flex min-w-0 flex-1 flex-col bg-[var(--color-ec-app)]"><div className="builder-document-bar flex h-10 shrink-0 items-center justify-between border-b border-[var(--color-ec-border)] bg-[var(--color-ec-surface)] px-3"><div className="flex min-w-0 items-center gap-1.5 text-[10px] text-[var(--color-ec-text-muted)]"><span className="truncate">{document.name}</span><span>/</span><strong className="font-semibold text-[var(--color-ec-text)]">Canvas</strong></div><span className="builder-viewport-summary">{breakpoint.label} · {breakpoint.width}px</span></div><EditorCanvas document={document} breakpointId={session.activeBreakpointId} breakpoints={session.project.breakpoints} viewportWidth={breakpoint.width} zoom={session.zoom} actions={actions} compactLayout={compactLayout} mobilePanel={canvasMobilePanel} onMobilePanelChange={(panel) => setMobilePanel(panel)} /></div>;

  if (!compactLayout) {
    return <div className="studio-builder-workspace studio-pro-builder flex min-h-0 flex-1 overflow-hidden"><WidgetLibrary onInsert={(definition) => actions.insertWidget(definition.type)} />{editor}</div>;
  }

  return (
    <div className="studio-builder-workspace studio-pro-builder studio-pro-builder--mobile relative flex min-h-0 flex-1 overflow-hidden">
      {editor}
      <nav className="mobile-builder-dock" aria-label="Mobile builder tools">
        <button type="button" aria-pressed={mobilePanel === 'pages'} onClick={() => setMobilePanel((current) => current === 'pages' ? null : 'pages')}><Icon name="pages" size={19} /><span>Pages</span></button>
        <button type="button" aria-pressed={mobilePanel === 'components'} onClick={() => setMobilePanel((current) => current === 'components' ? null : 'components')}><Icon name="plus" size={20} /><span>Add</span></button>
        <button type="button" aria-pressed={mobilePanel === 'layers'} onClick={() => setMobilePanel((current) => current === 'layers' ? null : 'layers')}><Icon name="layers" size={19} /><span>Layers</span></button>
        <button type="button" aria-pressed={mobilePanel === 'properties'} onClick={() => setMobilePanel((current) => current === 'properties' ? null : 'properties')}><Icon name="settings" size={19} /><span>Properties</span></button>
      </nav>

      {mobilePanel === 'pages' || mobilePanel === 'components' ? (
        <div className="mobile-builder-sheet" role="presentation" onPointerDown={(event) => { if (event.target === event.currentTarget) setMobilePanel(null); }}>
          <section className="mobile-builder-sheet-panel" role="dialog" aria-modal="true" aria-label={mobilePanel === 'pages' ? 'Pages panel' : 'Add components panel'}>
            <header className="mobile-sheet-header"><span className="mobile-sheet-handle" aria-hidden="true" /><div><strong>{mobilePanel === 'pages' ? 'Pages' : 'Add components'}</strong><small>{mobilePanel === 'pages' ? 'Navigate pages and widget tree' : 'Search and insert building blocks'}</small></div><button type="button" autoFocus aria-label={mobilePanel === 'pages' ? 'Close pages' : 'Close components'} onClick={() => setMobilePanel(null)}><Icon name="close" size={17} /></button></header>
            <div className="mobile-builder-sheet-content"><WidgetLibrary key={mobilePanel} initialTab={mobilePanel} onInsert={(definition) => { actions.insertWidget(definition.type); setMobilePanel(null); }} /></div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function EditorModuleWorkspace({ module, onOpenBuilder, compactLayout }: { module: EditorModuleId; onOpenBuilder(): void; compactLayout: boolean }) {
  if (module === 'builder') return <BuilderWorkspace key={compactLayout ? 'compact-builder' : 'desktop-builder'} compactLayout={compactLayout} />;
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

export function ProductionStudio({ workspaceId, editorModuleId, compactLayout, navigationOpen, onCloseNavigation, onNavigate, onNavigateEditorModule }: ProductionStudioProps) {
  const { preferences } = useWorkspacePreferences();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const activeDefinition = modules.find((module) => module.id === editorModuleId) ?? modules[0];
  const collapsed = !compactLayout || preferences.navigationCollapsed;
  const selectModule = (moduleId: EditorModuleId) => onNavigateEditorModule(moduleId);

  let content: ReactNode;
  if (workspaceId === 'preview') content = <LivePreviewWorkspace />;
  else if (workspaceId === 'backend') content = <BackendRolesWorkspace initialView="overview" />;
  else if (workspaceId === 'export') content = <PublishingWorkspace />;
  else content = <EditorModuleWorkspace module={editorModuleId} compactLayout={compactLayout} onOpenBuilder={() => onNavigateEditorModule('builder')} />;

  const workspaceLabel = primaryWorkspaces.find((workspace) => workspace.id === workspaceId)?.label ?? 'Editor';
  const rail = <StudioRail compactLayout={compactLayout} workspaceId={workspaceId} activeModule={editorModuleId} settingsOpen={settingsOpen} onSettingsOpenChange={setSettingsOpen} onNavigate={onNavigate} onSelectModule={selectModule} onClose={onCloseNavigation} />;

  return (
    <main className="production-studio flex min-h-0 flex-1 overflow-hidden bg-[var(--color-ec-app)] text-[var(--color-ec-text)]" id="workspace-main" tabIndex={-1} data-workspace={workspaceId} data-editor-module={editorModuleId} data-compact={compactLayout ? 'true' : 'false'} data-navigation-position={preferences.navigationPosition} data-navigation-collapsed={collapsed ? 'true' : 'false'}>
      <h1 className="sr-only">{workspaceLabel} workspace</h1>
      {!compactLayout && preferences.navigationPosition === 'left' ? rail : null}
      <div className="production-studio-main flex min-w-0 flex-1 flex-col">
        <div className="studio-context-bar flex h-10 shrink-0 items-center justify-between gap-3 border-b border-[var(--color-ec-border)] bg-[var(--color-ec-surface)] px-3"><div className="flex min-w-0 items-center gap-2"><span className="text-[8px] font-semibold uppercase tracking-[.18em] text-[var(--color-ec-text-muted)]">{workspaceId === 'editor' ? 'Studio' : 'Workspace'}</span><span className="h-3 w-px bg-[var(--color-ec-border)]" /><strong className="truncate text-[10px] font-semibold text-[var(--color-ec-text)]">{workspaceId === 'editor' ? activeDefinition?.label ?? 'Builder' : workspaceLabel}</strong></div><button type="button" className={`${quietButton} hidden md:inline-flex`} aria-label="Open command palette" title="Command palette · Ctrl/⌘ K" onClick={() => setCommandOpen(true)}><Icon name="command" size={12} />Commands</button></div>
        <div className="flex min-h-0 flex-1">{content}</div>
      </div>
      {!compactLayout && preferences.navigationPosition === 'right' ? rail : null}
      {compactLayout && navigationOpen ? <div className="studio-navigation-backdrop fixed inset-0 z-50 bg-black/45" role="presentation" onPointerDown={(event) => { if (event.target === event.currentTarget) onCloseNavigation(); }}><div className="studio-navigation-drawer h-full w-[min(88vw,320px)] shadow-2xl" role="dialog" aria-modal="true" aria-label="Workspace navigation">{rail}</div></div> : null}
      <StudioCommandPalette open={commandOpen} onOpenChange={setCommandOpen} onNavigate={onNavigate} onSelectModule={selectModule} />
    </main>
  );
}
