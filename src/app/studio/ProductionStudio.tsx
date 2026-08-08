import { useMemo, useState, type ReactNode } from 'react';
import type { WidgetDefinition } from '../../core/widgets';
import { Icon, type IconName } from '../components/Icon';
import { EditorCanvas } from '../editor/canvas/EditorCanvas';
import { useCanvasDocumentActions } from '../editor/canvas/use-canvas-document-actions';
import { useProjectSession } from '../project/project-session-context';
import type { WorkspaceId } from '../routing/workspaces';
import { ProjectThemeControls } from '../themes/ProjectThemeControls';
import { useEditorWidgetRegistry } from '../widgets/editor-widget-registry-context';
import { useWorkspacePreferences } from '../workspace/workspace-preferences-store';

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

interface FeatureGroup {
  title: string;
  description: string;
  icon: IconName;
  items: readonly string[];
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

const moduleFeatures: Record<Exclude<StudioModuleId, 'builder' | 'themes'>, readonly FeatureGroup[]> = {
  pages: [
    { title: 'Documents', description: 'Manage the complete site structure.', icon: 'pages', items: ['Pages', 'Drafts', 'Trash', 'Navigation structure', 'SEO metadata'] },
    { title: 'Templates', description: 'Reusable layouts for dynamic rendering.', icon: 'blocks', items: ['Header', 'Footer', 'Single', 'Archive', 'Search results', '404'] },
    { title: 'Reusable', description: 'Build once and reuse across the project.', icon: 'layers', items: ['Global components', 'Saved widgets', 'Template parts', 'Display conditions'] },
  ],
  content: [
    { title: 'Models', description: 'Structure the data behind the experience.', icon: 'database', items: ['Content Types', 'Taxonomies', 'Field Groups', 'Records'] },
    { title: 'Advanced data', description: 'Compose richer content relationships.', icon: 'link', items: ['Relations', 'Repeaters', 'Groups', 'Calculated fields', 'Conditional fields'] },
    { title: 'Bindings', description: 'Connect data directly to the visual layer.', icon: 'content', items: ['Dynamic fields', 'Dynamic images', 'Dynamic links', 'Dynamic visibility'] },
  ],
  queries: [
    { title: 'Query source', description: 'Choose what the query reads from.', icon: 'database', items: ['Content type', 'Taxonomy', 'Users', 'Relations', 'Custom datasets'] },
    { title: 'Query pipeline', description: 'Shape, filter and paginate results.', icon: 'query', items: ['Filters', 'Sort', 'Limit', 'Offset', 'Pagination', 'Meta query'] },
    { title: 'Runtime', description: 'Preview and reuse query definitions.', icon: 'preview', items: ['Live preview', 'Saved queries', 'Query variables', 'Context bindings'] },
  ],
  forms: [
    { title: 'Fields', description: 'Build accessible data-entry experiences.', icon: 'form', items: ['Text', 'Email', 'Phone', 'Select', 'Checkbox', 'Date', 'File', 'Repeater'] },
    { title: 'Behavior', description: 'Control validation and form logic.', icon: 'command', items: ['Validation', 'Conditional fields', 'Multi-step', 'Calculations', 'Spam protection'] },
    { title: 'Actions', description: 'Define what happens after submission.', icon: 'link', items: ['Create record', 'Update record', 'Email', 'Redirect', 'Relation update', 'Success state'] },
  ],
  filters: [
    { title: 'Filter types', description: 'Provide multiple discovery patterns.', icon: 'filter', items: ['Search', 'Taxonomy', 'Select', 'Checkbox', 'Range', 'Date', 'Sorting'] },
    { title: 'Interaction', description: 'Control how filters affect the page.', icon: 'command', items: ['Live apply', 'URL sync', 'Result counts', 'Reset', 'Active chips'] },
    { title: 'Targets', description: 'Attach filtering to dynamic collections.', icon: 'grid', items: ['Listing grids', 'Directories', 'Archives', 'Commerce', 'Query results'] },
  ],
  media: [
    { title: 'Library', description: 'Centralize project media and resources.', icon: 'media', items: ['Images', 'SVG', 'Video', 'Audio', 'Documents', 'Fonts', 'Icons'] },
    { title: 'Organization', description: 'Keep large asset libraries navigable.', icon: 'folder', items: ['Folders', 'Tags', 'Favorites', 'Recent', 'Usage tracking'] },
    { title: 'Asset tools', description: 'Prepare assets for production output.', icon: 'image', items: ['Alt text', 'Metadata', 'Optimization', 'Responsive variants', 'Replace globally'] },
  ],
  users: [
    { title: 'Roles', description: 'Define responsibilities for every team.', icon: 'users', items: ['Administrator', 'Designer', 'Editor', 'Author', 'Manager', 'Client', 'Custom roles'] },
    { title: 'Capabilities', description: 'Control actions at a granular level.', icon: 'shield', items: ['View', 'Create', 'Edit', 'Delete', 'Publish', 'Export', 'Manage users'] },
    { title: 'Access', description: 'Scope content and backend visibility.', icon: 'link', items: ['Field-level permissions', 'Content access', 'Backend routes', 'Dashboard visibility'] },
  ],
  blueprints: [
    { title: 'Business', description: 'Operational systems for common businesses.', icon: 'blueprint', items: ['Online Store', 'CRM Pipeline', 'Appointments', 'Inventory', 'Restaurant', 'Clinic'] },
    { title: 'Content', description: 'Publishing-first project architectures.', icon: 'pages', items: ['Blog & Magazine', 'Directory', 'Portfolio', 'Events', 'LMS Academy', 'Memberships'] },
    { title: 'Verticals', description: 'Specialized starting points by industry.', icon: 'blocks', items: ['Real Estate', 'Marketplace', 'Job Board', 'Help Desk', 'NGO', 'Tattoo Studio'] },
  ],
  settings: [
    { title: 'Project', description: 'Core project-wide configuration.', icon: 'settings', items: ['General', 'Localization', 'Breakpoints', 'Project health'] },
    { title: 'Local-first', description: 'Storage, recovery and portability.', icon: 'local', items: ['Storage', 'Autosave', 'Recovery snapshots', 'Import', 'Portable project files'] },
    { title: 'Advanced', description: 'Technical controls for production teams.', icon: 'code', items: ['Performance', 'Accessibility', 'Custom code', 'Experimental features'] },
  ],
};

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

const quietButton = 'inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white';

function StudioRail({
  compactLayout,
  workspaceId,
  activeModule,
  onNavigate,
  onSelectModule,
  onClose,
}: {
  compactLayout: boolean;
  workspaceId: WorkspaceId;
  activeModule: StudioModuleId;
  onNavigate(workspaceId: WorkspaceId): void;
  onSelectModule(moduleId: StudioModuleId): void;
  onClose(): void;
}) {
  const {
    preferences,
    setNavigationPosition,
    setNavigationCollapsed,
    setNavigationDisplayMode,
    moveWorkspace,
    setDensity,
    reset,
  } = useWorkspacePreferences();
  const collapsed = !compactLayout && preferences.navigationCollapsed;
  const displayMode = collapsed ? 'icons' : preferences.navigationDisplayMode;
  const showLabels = displayMode !== 'icons';
  const showIcons = displayMode !== 'labels';

  const railButtonClass = 'group relative flex h-9 w-full items-center gap-2 rounded-lg px-2 text-left text-[12px] font-medium text-slate-400 transition hover:bg-white/7 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/40 data-[active=true]:bg-blue-500/14 data-[active=true]:text-blue-100';

  return (
    <aside
      className={`workspace-navigation studio-rail flex h-full shrink-0 flex-col border-slate-800/80 bg-[#09111f] p-2 text-white shadow-xl shadow-slate-950/5 ${collapsed ? 'w-[60px]' : 'w-[224px]'} ${preferences.navigationPosition === 'right' ? 'border-l' : 'border-r'}`}
      aria-label="Workspace navigation"
      data-position={preferences.navigationPosition}
      data-collapsed={collapsed ? 'true' : 'false'}
      data-display-mode={displayMode}
    >
      <div className="mb-2 flex h-10 items-center justify-between gap-2 px-1">
        <div className="flex min-w-0 items-center gap-2">
          <div className="grid size-8 shrink-0 place-items-center rounded-[10px] bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-950/30"><Icon name="bolt" size={16} /></div>
          {showLabels ? <div className="min-w-0"><strong className="block truncate text-[12px] font-semibold tracking-tight text-white">ElectroCMS</strong><span className="block text-[9px] font-medium uppercase tracking-[.18em] text-slate-500">Studio</span></div> : null}
        </div>
        {compactLayout ? (
          <button className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-white/8 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/40" type="button" aria-label="Close navigation" onClick={onClose}><Icon name="close" size={15} /></button>
        ) : (
          <button className="grid size-8 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-white/8 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/40" type="button" aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'} onClick={() => setNavigationCollapsed(!collapsed)}><Icon name={collapsed ? 'expand' : 'collapse'} size={15} /></button>
        )}
      </div>

      <nav className="space-y-1" aria-label="Primary workspaces">
        {preferences.workspaceOrder.map((workspaceIdFromOrder) => {
          const workspace = primaryWorkspaces.find((item) => item.id === workspaceIdFromOrder);
          if (!workspace) return null;
          return (
            <button
              key={workspace.id}
              type="button"
              className={railButtonClass}
              data-active={workspaceId === workspace.id ? 'true' : 'false'}
              aria-label={workspace.label}
              title={workspace.label}
              onClick={() => {
                onNavigate(workspace.id);
                if (compactLayout) onClose();
              }}
            >
              {workspaceId === workspace.id ? <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-blue-400" aria-hidden="true" /> : null}
              {showIcons ? <span className="grid size-6 shrink-0 place-items-center text-slate-400 group-data-[active=true]:text-blue-300"><Icon name={workspace.icon} size={16} /></span> : null}
              {showLabels ? <span className="truncate">{workspace.label}</span> : null}
            </button>
          );
        })}
      </nav>

      <div className="my-2 h-px bg-white/8" />
      {showLabels ? <span className="mb-1 px-2 text-[9px] font-semibold uppercase tracking-[.16em] text-slate-600">Build</span> : null}

      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-0.5 [scrollbar-width:thin] [scrollbar-color:#334155_transparent]" aria-label="Studio modules">
        {modules.map((module) => (
          <button
            key={module.id}
            type="button"
            className={railButtonClass}
            data-active={workspaceId === 'editor' && activeModule === module.id ? 'true' : 'false'}
            aria-label={module.label}
            title={module.label}
            onClick={() => {
              onSelectModule(module.id);
              if (compactLayout) onClose();
            }}
          >
            {workspaceId === 'editor' && activeModule === module.id ? <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-blue-400" aria-hidden="true" /> : null}
            {showIcons ? <span className="grid size-6 shrink-0 place-items-center text-slate-500 group-data-[active=true]:text-blue-300"><Icon name={module.icon} size={16} /></span> : null}
            {showLabels ? <span className="truncate">{module.label}</span> : null}
          </button>
        ))}
      </nav>

      <details className="group/settings relative mt-2 border-t border-white/8 pt-2">
        <summary className="flex h-9 cursor-pointer list-none items-center gap-2 rounded-lg px-2 text-[11px] font-medium text-slate-500 transition hover:bg-white/7 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/40 [&::-webkit-details-marker]:hidden">
          <span className="grid size-6 place-items-center"><Icon name="settings" size={15} /></span>
          {showLabels ? <span>Workspace settings</span> : <span className="sr-only">Workspace settings</span>}
        </summary>
        <div className={`absolute bottom-0 z-50 w-[260px] rounded-xl border border-slate-200 bg-white p-3 text-slate-900 shadow-2xl shadow-slate-950/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white ${preferences.navigationPosition === 'right' ? 'right-full mr-2' : 'left-full ml-2'}`}>
          <div className="mb-3"><strong className="text-[12px]">Workspace settings</strong><p className="mt-0.5 text-[10px] leading-4 text-slate-500 dark:text-slate-400">Customize navigation without changing project data.</p></div>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-[10px] font-medium text-slate-500 dark:text-slate-400"><span className="mb-1 block">Position</span><select className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2 text-[11px] text-slate-700 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200" aria-label="Navigation position" value={preferences.navigationPosition} onChange={(event) => setNavigationPosition(event.target.value as 'left' | 'right')}><option value="left">Left</option><option value="right">Right</option></select></label>
            <label className="text-[10px] font-medium text-slate-500 dark:text-slate-400"><span className="mb-1 block">Display</span><select className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2 text-[11px] text-slate-700 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200" aria-label="Navigation display mode" value={preferences.navigationDisplayMode} onChange={(event) => setNavigationDisplayMode(event.target.value as 'icons' | 'labels' | 'both')}><option value="both">Icons + labels</option><option value="icons">Icons</option><option value="labels">Labels</option></select></label>
            <label className="col-span-2 text-[10px] font-medium text-slate-500 dark:text-slate-400"><span className="mb-1 block">Density</span><select className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2 text-[11px] text-slate-700 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200" aria-label="Workspace density" value={preferences.density} onChange={(event) => setDensity(event.target.value as 'compact' | 'comfortable')}><option value="compact">Compact</option><option value="comfortable">Comfortable</option></select></label>
          </div>
          <fieldset className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-800">
            <legend className="mb-1 text-[10px] font-semibold uppercase tracking-[.12em] text-slate-400">Workspace order</legend>
            <div className="space-y-1">
              {preferences.workspaceOrder.map((orderedWorkspace, index) => {
                const workspace = primaryWorkspaces.find((item) => item.id === orderedWorkspace);
                if (!workspace) return null;
                return <div key={orderedWorkspace} className="flex h-7 items-center justify-between rounded-md px-1.5 text-[11px] hover:bg-slate-50 dark:hover:bg-slate-800"><span>{workspace.label}</span><span className="flex gap-0.5"><button className="grid size-6 place-items-center rounded text-slate-400 hover:bg-white hover:text-slate-900 disabled:opacity-25 dark:hover:bg-slate-700 dark:hover:text-white" type="button" aria-label={`Move ${workspace.label} up`} disabled={index === 0} onClick={() => moveWorkspace(orderedWorkspace, -1)}><Icon name="arrow-up" size={12} /></button><button className="grid size-6 place-items-center rounded text-slate-400 hover:bg-white hover:text-slate-900 disabled:opacity-25 dark:hover:bg-slate-700 dark:hover:text-white" type="button" aria-label={`Move ${workspace.label} down`} disabled={index === preferences.workspaceOrder.length - 1} onClick={() => moveWorkspace(orderedWorkspace, 1)}><Icon name="arrow-down" size={12} /></button></span></div>;
              })}
            </div>
          </fieldset>
          <button className="mt-3 h-8 w-full rounded-lg bg-slate-100 text-[11px] font-semibold text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700" type="button" onClick={reset}>Reset workspace layout</button>
        </div>
      </details>
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
    const matchesCategory = activeCategory === 'all' || definition.metadata.category === activeCategory;
    const matchesSearch = !query || `${definition.metadata.name} ${definition.metadata.description} ${definition.type}`.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  return (
    <aside className="studio-library flex min-h-0 w-[272px] shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950" aria-label="Insert library">
      <div className="flex h-12 items-center justify-between border-b border-slate-100 px-3 dark:border-slate-800"><div><span className="block text-[9px] font-semibold uppercase tracking-[.16em] text-slate-400">Insert</span><strong className="text-[12px] font-semibold text-slate-900 dark:text-white">Elements</strong></div><span className="grid size-7 place-items-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"><Icon name="blocks" size={15} /></span></div>
      <div className="p-2.5">
        <label className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-slate-400 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/10 dark:border-slate-800 dark:bg-slate-900 dark:focus-within:bg-slate-950">
          <Icon name="search" size={14} /><input className="min-w-0 flex-1 bg-transparent text-[11px] text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100" aria-label="Search elements" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search elements…" /><kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[9px] font-medium text-slate-400 dark:border-slate-700 dark:bg-slate-800">⌘K</kbd>
        </label>
      </div>
      <div className="flex gap-1 overflow-x-auto border-b border-slate-100 px-2.5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden dark:border-slate-800" aria-label="Element categories">
        <button className="h-7 shrink-0 rounded-md px-2 text-[10px] font-semibold text-slate-500 transition hover:bg-slate-100 data-[active=true]:bg-blue-50 data-[active=true]:text-blue-700 dark:hover:bg-slate-800 dark:data-[active=true]:bg-blue-950/50 dark:data-[active=true]:text-blue-300" type="button" data-active={activeCategory === 'all'} onClick={() => setActiveCategory('all')}>All</button>
        {categories.map((category) => <button className="h-7 shrink-0 rounded-md px-2 text-[10px] font-semibold text-slate-500 transition hover:bg-slate-100 data-[active=true]:bg-blue-50 data-[active=true]:text-blue-700 dark:hover:bg-slate-800 dark:data-[active=true]:bg-blue-950/50 dark:data-[active=true]:text-blue-300" key={category} type="button" data-active={activeCategory === category} onClick={() => setActiveCategory(category)}>{categoryLabels[category] ?? category}</button>)}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2.5 [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent]">
        {categories.map((category) => {
          const group = visible.filter((definition) => definition.metadata.category === category);
          if (group.length === 0) return null;
          return (
            <section className="mb-4" key={category}>
              <div className="mb-1.5 flex items-center justify-between px-0.5 text-[9px] font-semibold uppercase tracking-[.12em] text-slate-400"><span className="flex items-center gap-1.5"><Icon name={categoryIcons[category] ?? 'blocks'} size={12} />{categoryLabels[category] ?? category}</span><small className="font-medium tabular-nums">{group.length}</small></div>
              <div className="grid grid-cols-2 gap-1.5">
                {group.map((definition) => (
                  <button key={`${definition.type}@${definition.version}`} type="button" className="group flex min-h-16 flex-col items-start justify-between rounded-lg border border-slate-200 bg-white p-2 text-left transition hover:-translate-y-px hover:border-blue-300 hover:shadow-sm hover:shadow-blue-900/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-700" aria-label={`Insert ${definition.metadata.name}`} title={`${definition.metadata.name} — ${definition.metadata.description}`} onClick={() => onInsert(definition)}>
                    <span className="grid size-7 place-items-center rounded-md bg-slate-100 text-slate-500 transition group-hover:bg-blue-50 group-hover:text-blue-600 dark:bg-slate-800 dark:text-slate-400 dark:group-hover:bg-blue-950/60 dark:group-hover:text-blue-300"><Icon name={categoryIcons[definition.metadata.category] ?? 'blocks'} size={14} /></span><span className="mt-2 line-clamp-1 text-[10px] font-semibold text-slate-700 group-hover:text-slate-950 dark:text-slate-300 dark:group-hover:text-white">{definition.metadata.name}</span>
                  </button>
                ))}
              </div>
            </section>
          );
        })}
        {visible.length === 0 ? <div className="grid min-h-36 place-items-center rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center dark:border-slate-800 dark:bg-slate-900"><div><span className="mx-auto mb-2 grid size-9 place-items-center rounded-full bg-white text-slate-400 shadow-sm dark:bg-slate-800"><Icon name="search" size={17} /></span><strong className="block text-[11px] text-slate-700 dark:text-slate-200">No elements found</strong><span className="mt-1 block text-[10px] text-slate-400">Try another search or category.</span></div></div> : null}
      </div>
    </aside>
  );
}

function BuilderWorkspace() {
  const session = useProjectSession();
  const actions = useCanvasDocumentActions();
  const document = session.project.documents[session.activeDocumentId];
  const breakpoint = session.project.breakpoints.find((candidate) => candidate.id === session.activeBreakpointId);

  if (!document || !breakpoint) return <EmptyState icon="editor" title="No active document" description="Create or select a document to start building." />;

  return (
    <div className="studio-builder-workspace flex min-h-0 flex-1 overflow-hidden">
      <WidgetLibrary onInsert={(definition) => actions.insertWidget(definition.type)} />
      <div className="studio-editor-region flex min-w-0 flex-1 flex-col bg-slate-100/80 dark:bg-slate-900">
        <div className="flex h-10 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-3 dark:border-slate-800 dark:bg-slate-950">
          <div className="flex min-w-0 items-center gap-1.5 text-[10px] text-slate-400"><span className="truncate">{document.name}</span><span>/</span><strong className="font-semibold text-slate-600 dark:text-slate-300">Canvas</strong></div>
          <div className="flex items-center gap-1"><button className={quietButton} type="button"><Icon name="grid" size={13} />Grid</button><button className={quietButton} type="button"><Icon name="layers" size={13} />Layers</button><button className={quietButton} type="button"><Icon name="command" size={13} />Commands</button></div>
        </div>
        <EditorCanvas document={document} breakpointId={session.activeBreakpointId} breakpoints={session.project.breakpoints} viewportWidth={breakpoint.width} zoom={session.zoom} actions={actions} />
      </div>
    </div>
  );
}

function EmptyState({ icon, title, description }: { icon: IconName; title: string; description: string }) {
  return <div className="grid min-h-0 flex-1 place-items-center bg-slate-50 p-6 dark:bg-slate-950"><div className="max-w-sm text-center"><span className="mx-auto mb-3 grid size-11 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"><Icon name={icon} size={20} /></span><strong className="block text-[13px] font-semibold text-slate-900 dark:text-white">{title}</strong><p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">{description}</p></div></div>;
}

function FeatureCard({ icon, title, description, items }: FeatureGroup) {
  return (
    <article className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/[.02] transition hover:border-slate-300 hover:shadow-md hover:shadow-slate-900/[.04] dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700">
      <div className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300"><Icon name={icon} size={17} /></span><div className="min-w-0"><strong className="block text-[12px] font-semibold text-slate-900 dark:text-white">{title}</strong><p className="mt-0.5 text-[10px] leading-4 text-slate-500 dark:text-slate-400">{description}</p></div></div>
      <div className="mt-4 grid gap-1 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">{items.map((item) => <button key={item} type="button" className="flex h-8 items-center justify-between rounded-lg px-2 text-left text-[10px] font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"><span className="flex items-center gap-2"><span className="size-1 rounded-full bg-slate-300 dark:bg-slate-600" />{item}</span><Icon name="expand" size={11} /></button>)}</div>
    </article>
  );
}

function ModuleWorkspace({ module }: { module: Exclude<StudioModuleId, 'builder' | 'themes'> }) {
  const definition = modules.find((item) => item.id === module);
  return (
    <section className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-4 md:p-5 dark:bg-slate-950" aria-label={`${definition?.label ?? module} workspace`}>
      <header className="mx-auto flex max-w-[1280px] flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between dark:border-slate-800"><div><span className="text-[9px] font-semibold uppercase tracking-[.16em] text-blue-600 dark:text-blue-400">ElectroCMS Studio</span><h2 className="mt-1 text-xl font-semibold tracking-[-.03em] text-slate-950 dark:text-white">{definition?.label ?? module}</h2><p className="mt-1 max-w-2xl text-[11px] leading-5 text-slate-500 dark:text-slate-400">{definition?.description}</p></div><button type="button" className={quietButton}><Icon name="more" size={14} />Options</button></header>
      <div className="mx-auto mt-5 grid max-w-[1280px] gap-3 lg:grid-cols-3">{moduleFeatures[module].map((group) => <FeatureCard key={group.title} {...group} />)}</div>
    </section>
  );
}

function ThemesWorkspace() {
  return <section className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-4 md:p-5 dark:bg-slate-950" aria-label="Themes workspace"><header className="mx-auto max-w-[1280px] border-b border-slate-200 pb-4 dark:border-slate-800"><span className="text-[9px] font-semibold uppercase tracking-[.16em] text-blue-600 dark:text-blue-400">Design systems</span><h2 className="mt-1 text-xl font-semibold tracking-[-.03em] text-slate-950 dark:text-white">Theme Studio</h2><p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">Manage the frontend and backend theme packages connected to canonical project state.</p></header><div className="mx-auto mt-5 grid max-w-[1280px] gap-4 xl:grid-cols-2"><ProjectThemeControls scope="frontend" /><ProjectThemeControls scope="backend" /></div></section>;
}

function PreviewWorkspace() {
  return (
    <section className="min-h-0 flex-1 overflow-y-auto bg-slate-100 p-3 md:p-5 dark:bg-slate-950" aria-label="Preview workspace">
      <div className="mx-auto flex h-full max-w-[1440px] flex-col gap-3"><div className="flex items-center justify-between"><div><span className="text-[9px] font-semibold uppercase tracking-[.16em] text-blue-600 dark:text-blue-400">Frontend preview</span><h2 className="mt-0.5 text-lg font-semibold tracking-[-.02em] text-slate-950 dark:text-white">Preview workspace</h2></div><div className="flex rounded-lg border border-slate-200 bg-white p-0.5 dark:border-slate-800 dark:bg-slate-900"><button className="h-7 rounded-md bg-slate-900 px-2.5 text-[10px] font-semibold text-white dark:bg-white dark:text-slate-900" type="button">Desktop</button><button className="h-7 rounded-md px-2.5 text-[10px] font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white" type="button">Tablet</button><button className="h-7 rounded-md px-2.5 text-[10px] font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white" type="button">Mobile</button></div></div><div className="grid min-h-[620px] flex-1 gap-3 xl:grid-cols-[minmax(0,1fr)_320px]"><div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900"><div className="flex h-9 items-center gap-1.5 border-b border-slate-200 bg-slate-50 px-3 dark:border-slate-800 dark:bg-slate-950"><span className="size-2 rounded-full bg-rose-400" /><span className="size-2 rounded-full bg-amber-400" /><span className="size-2 rounded-full bg-emerald-400" /><div className="ml-3 flex h-6 min-w-0 flex-1 items-center rounded-md bg-white px-2 text-[9px] text-slate-400 shadow-inner dark:bg-slate-900">electrocms.local / preview</div></div><div className="grid h-[calc(100%-36px)] place-items-center bg-[radial-gradient(circle_at_top,#eff6ff,transparent_42%),linear-gradient(#fff,#f8fafc)] dark:bg-[radial-gradient(circle_at_top,#172554,transparent_42%),linear-gradient(#0f172a,#020617)]"><div className="max-w-sm text-center"><span className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20"><Icon name="preview" size={21} /></span><strong className="block text-[14px] font-semibold text-slate-900 dark:text-white">Live site preview</strong><span className="mt-1 block text-[11px] leading-5 text-slate-500 dark:text-slate-400">This surface is connected to the same project, breakpoints and theme configuration used by the builder.</span></div></div></div><aside className="min-h-0 overflow-y-auto rounded-xl"><ProjectThemeControls scope="frontend" /></aside></div></div>
    </section>
  );
}

function BackendWorkspace() {
  const menu = ['Overview', 'Products', 'Orders', 'Customers', 'Inventory', 'Content', 'Reports'];
  return (
    <section className="min-h-0 flex-1 overflow-y-auto bg-slate-100 p-3 md:p-5 dark:bg-slate-950" aria-label="Backend workspace">
      <div className="mx-auto max-w-[1440px]"><div className="mb-3"><span className="text-[9px] font-semibold uppercase tracking-[.16em] text-blue-600 dark:text-blue-400">Administrative experience</span><h2 className="mt-0.5 text-lg font-semibold tracking-[-.02em] text-slate-950 dark:text-white">Backend workspace</h2></div><div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_320px]"><div className="grid min-h-[650px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5 md:grid-cols-[190px_minmax(0,1fr)] dark:border-slate-800 dark:bg-slate-900"><aside className="border-r border-slate-200 bg-slate-950 p-3 text-white dark:border-slate-800"><strong className="mb-4 flex items-center gap-2 text-[12px]"><span className="grid size-7 place-items-center rounded-lg bg-blue-600"><Icon name="bolt" size={14} /></span>Northstar Admin</strong><div className="space-y-1">{menu.map((item, index) => <button type="button" key={item} className={`flex h-8 w-full items-center gap-2 rounded-lg px-2 text-[10px] font-medium transition ${index === 0 ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/7 hover:text-white'}`}><Icon name={item === 'Overview' ? 'grid' : item === 'Products' ? 'content' : item === 'Customers' ? 'users' : 'list'} size={13} />{item}</button>)}</div></aside><main className="min-w-0 bg-slate-50 p-4 dark:bg-slate-950"><div><span className="text-[9px] text-slate-400">Workspace / Overview</span><strong className="mt-1 block text-[16px] font-semibold text-slate-900 dark:text-white">Operations dashboard</strong></div><div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">{['Revenue', 'Orders', 'Average order', 'Low stock'].map((item) => <article className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900" key={item}><span className="text-[9px] font-medium text-slate-400">{item}</span><strong className="mt-2 block text-lg font-semibold tracking-tight text-slate-900 dark:text-white">—</strong></article>)}</div><div className="mt-3 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"><div className="flex h-10 items-center justify-between border-b border-slate-100 px-3 dark:border-slate-800"><strong className="text-[11px] text-slate-700 dark:text-slate-200">Recent records</strong><button className="text-[10px] font-semibold text-blue-600 dark:text-blue-400" type="button">View all</button></div>{['Primary table', 'Filters', 'Saved views', 'Bulk actions'].map((item) => <button key={item} type="button" className="flex h-10 w-full items-center justify-between border-b border-slate-100 px-3 text-[10px] text-slate-500 last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"><span>{item}</span><Icon name="expand" size={12} /></button>)}</div></main></div><aside><ProjectThemeControls scope="backend" /></aside></div></div>
    </section>
  );
}

function ExportWorkspace() {
  const targets = [
    { label: 'Local', detail: 'Portable local package', icon: 'local' as const },
    { label: 'React', detail: 'Vite / React deployment', icon: 'code' as const },
    { label: 'LAMP', detail: 'PHP + MySQL/MariaDB', icon: 'backend' as const },
    { label: 'WordPress', detail: 'Theme + companion plugin', icon: 'blocks' as const },
  ];
  return <section className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-4 md:p-5 dark:bg-slate-950" aria-label="Export workspace"><header className="mx-auto max-w-[1200px] border-b border-slate-200 pb-4 dark:border-slate-800"><span className="text-[9px] font-semibold uppercase tracking-[.16em] text-blue-600 dark:text-blue-400">Publishing center</span><h2 className="mt-1 text-xl font-semibold tracking-[-.03em] text-slate-950 dark:text-white">Export workspace</h2><p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Package the same project for different production environments.</p></header><div className="mx-auto mt-5 grid max-w-[1200px] gap-3 sm:grid-cols-2 xl:grid-cols-4">{targets.map((target) => <article key={target.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/[.02] dark:border-slate-800 dark:bg-slate-900"><span className="grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300"><Icon name={target.icon} size={18} /></span><strong className="mt-4 block text-[12px] font-semibold text-slate-900 dark:text-white">{target.label}</strong><span className="mt-1 block text-[10px] leading-4 text-slate-500 dark:text-slate-400">{target.detail}</span><button type="button" className={`${quietButton} mt-4 w-full`} disabled>Configure</button></article>)}</div></section>;
}

function EditorModuleWorkspace({ module }: { module: StudioModuleId }) {
  if (module === 'builder') return <BuilderWorkspace />;
  if (module === 'themes') return <ThemesWorkspace />;
  return <ModuleWorkspace module={module} />;
}

export function ProductionStudio({ workspaceId, compactLayout, navigationOpen, onCloseNavigation, onNavigate }: ProductionStudioProps) {
  const { preferences } = useWorkspacePreferences();
  const [activeModule, setActiveModule] = useState<StudioModuleId>('builder');
  const activeDefinition = modules.find((module) => module.id === activeModule) ?? modules[0];
  const collapsed = !compactLayout && preferences.navigationCollapsed;

  const selectModule = (moduleId: StudioModuleId) => {
    setActiveModule(moduleId);
    if (workspaceId !== 'editor') onNavigate('editor');
  };

  let content: ReactNode;
  if (workspaceId === 'preview') content = <PreviewWorkspace />;
  else if (workspaceId === 'backend') content = <BackendWorkspace />;
  else if (workspaceId === 'export') content = <ExportWorkspace />;
  else content = <EditorModuleWorkspace module={activeModule} />;

  const workspaceLabel = primaryWorkspaces.find((workspace) => workspace.id === workspaceId)?.label ?? 'Editor';
  const rail = <StudioRail compactLayout={compactLayout} workspaceId={workspaceId} activeModule={activeModule} onNavigate={onNavigate} onSelectModule={selectModule} onClose={onCloseNavigation} />;

  return (
    <main className="production-studio flex min-h-0 flex-1 overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100" id="workspace-main" tabIndex={-1} data-workspace={workspaceId} data-compact={compactLayout ? 'true' : 'false'} data-navigation-position={preferences.navigationPosition} data-navigation-collapsed={collapsed ? 'true' : 'false'}>
      <h1 className="sr-only">{workspaceLabel} workspace</h1>
      {!compactLayout && preferences.navigationPosition === 'left' ? rail : null}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-11 shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-3 dark:border-slate-800 dark:bg-slate-950">
          <div className="flex min-w-0 items-center gap-2"><span className="text-[9px] font-semibold uppercase tracking-[.16em] text-slate-400">{workspaceId === 'editor' ? 'Studio' : 'Workspace'}</span><span className="h-3 w-px bg-slate-200 dark:bg-slate-800" /><strong className="truncate text-[11px] font-semibold text-slate-700 dark:text-slate-200">{workspaceId === 'editor' ? activeDefinition?.label ?? 'Builder' : workspaceLabel}</strong></div>
          <div className="flex items-center gap-1"><button type="button" className={`${quietButton} hidden md:inline-flex`}><Icon name="command" size={13} />Command palette</button><button type="button" className={`${quietButton} hidden lg:inline-flex`}><Icon name="users" size={13} />Share</button><button type="button" className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-[11px] font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30" disabled={workspaceId === 'export'}><Icon name="export" size={13} />Publish</button></div>
        </div>
        <div className="flex min-h-0 flex-1">{content}</div>
      </div>
      {!compactLayout && preferences.navigationPosition === 'right' ? rail : null}
      {compactLayout && navigationOpen ? <div className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-[2px]" role="presentation" onPointerDown={(event) => { if (event.target === event.currentTarget) onCloseNavigation(); }}><div className="h-full w-[min(86vw,260px)] shadow-2xl" role="dialog" aria-modal="true" aria-label="Workspace navigation">{rail}</div></div> : null}
    </main>
  );
}
