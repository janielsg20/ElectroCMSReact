import { useMemo, useState, type ReactNode } from 'react';
import type { WidgetDefinition } from '../../core/widgets';
import { Icon, type IconName } from '../components/Icon';
import { EditorCanvas } from '../editor/canvas/EditorCanvas';
import { useCanvasDocumentActions } from '../editor/canvas/use-canvas-document-actions';
import { useProjectSession } from '../project/project-session-context';
import type { WorkspaceId } from '../routing/workspaces';
import { ProjectThemeControls } from '../themes/ProjectThemeControls';
import { useEditorWidgetRegistry } from '../widgets/editor-widget-registry-context';
import './production-studio.css';

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

type ImplementationState = 'ready' | 'partial' | 'planned';

interface ProductionStudioProps {
  workspaceId: WorkspaceId;
  onNavigate(workspaceId: WorkspaceId): void;
}

interface StudioModuleDefinition {
  id: StudioModuleId;
  label: string;
  icon: IconName;
  state: ImplementationState;
}

interface PlannedFeatureGroup {
  title: string;
  icon: IconName;
  items: readonly string[];
}

const modules: readonly StudioModuleDefinition[] = [
  { id: 'builder', label: 'Builder', icon: 'editor', state: 'ready' },
  { id: 'pages', label: 'Pages', icon: 'pages', state: 'planned' },
  { id: 'content', label: 'Content', icon: 'database', state: 'planned' },
  { id: 'queries', label: 'Queries', icon: 'query', state: 'planned' },
  { id: 'forms', label: 'Forms', icon: 'form', state: 'planned' },
  { id: 'filters', label: 'Filters', icon: 'filter', state: 'planned' },
  { id: 'media', label: 'Media', icon: 'media', state: 'planned' },
  { id: 'themes', label: 'Themes', icon: 'theme', state: 'ready' },
  { id: 'users', label: 'Roles', icon: 'users', state: 'planned' },
  { id: 'blueprints', label: 'Blueprints', icon: 'blueprint', state: 'planned' },
  { id: 'settings', label: 'Settings', icon: 'settings', state: 'partial' },
];

const primaryWorkspaces: readonly {
  id: WorkspaceId;
  label: string;
  icon: IconName;
  state: ImplementationState;
}[] = [
  { id: 'editor', label: 'Editor', icon: 'editor', state: 'ready' },
  { id: 'preview', label: 'Preview', icon: 'preview', state: 'partial' },
  { id: 'backend', label: 'Backend', icon: 'backend', state: 'partial' },
  { id: 'export', label: 'Export', icon: 'export', state: 'planned' },
];

const moduleFeatures: Record<Exclude<StudioModuleId, 'builder' | 'themes'>, readonly PlannedFeatureGroup[]> = {
  pages: [
    { title: 'Documents', icon: 'pages', items: ['Pages', 'Drafts', 'Trash', 'Navigation structure', 'SEO metadata'] },
    { title: 'Templates', icon: 'blocks', items: ['Header', 'Footer', 'Single', 'Archive', 'Search results', '404'] },
    { title: 'Reusable', icon: 'layers', items: ['Global components', 'Saved widgets', 'Template parts', 'Display conditions'] },
  ],
  content: [
    { title: 'Models', icon: 'database', items: ['Content Types', 'Taxonomies', 'Field Groups', 'Records'] },
    { title: 'Advanced data', icon: 'link', items: ['Relations', 'Repeaters', 'Groups', 'Calculated fields', 'Conditional fields'] },
    { title: 'Bindings', icon: 'content', items: ['Dynamic fields', 'Dynamic images', 'Dynamic links', 'Dynamic visibility'] },
  ],
  queries: [
    { title: 'Query source', icon: 'database', items: ['Content type', 'Taxonomy', 'Users', 'Relations', 'Custom datasets'] },
    { title: 'Query pipeline', icon: 'query', items: ['Filters', 'Sort', 'Limit', 'Offset', 'Pagination', 'Meta query'] },
    { title: 'Runtime', icon: 'preview', items: ['Live preview', 'Saved queries', 'Query variables', 'Context bindings'] },
  ],
  forms: [
    { title: 'Fields', icon: 'form', items: ['Text', 'Email', 'Phone', 'Select', 'Checkbox', 'Date', 'File', 'Repeater'] },
    { title: 'Behavior', icon: 'command', items: ['Validation', 'Conditional fields', 'Multi-step', 'Calculations', 'Spam protection'] },
    { title: 'Actions', icon: 'link', items: ['Create record', 'Update record', 'Email', 'Redirect', 'Relation update', 'Success state'] },
  ],
  filters: [
    { title: 'Filter types', icon: 'filter', items: ['Search', 'Taxonomy', 'Select', 'Checkbox', 'Range', 'Date', 'Sorting'] },
    { title: 'Interaction', icon: 'command', items: ['Live apply', 'URL sync', 'Result counts', 'Reset', 'Active chips'] },
    { title: 'Targets', icon: 'grid', items: ['Listing grids', 'Directories', 'Archives', 'Commerce', 'Query results'] },
  ],
  media: [
    { title: 'Library', icon: 'media', items: ['Images', 'SVG', 'Video', 'Audio', 'Documents', 'Fonts', 'Icons'] },
    { title: 'Organization', icon: 'folder', items: ['Folders', 'Tags', 'Favorites', 'Recent', 'Usage tracking'] },
    { title: 'Asset tools', icon: 'image', items: ['Alt text', 'Metadata', 'Optimization', 'Responsive variants', 'Replace globally'] },
  ],
  users: [
    { title: 'Roles', icon: 'users', items: ['Administrator', 'Designer', 'Editor', 'Author', 'Manager', 'Client', 'Custom roles'] },
    { title: 'Capabilities', icon: 'shield', items: ['View', 'Create', 'Edit', 'Delete', 'Publish', 'Export', 'Manage users'] },
    { title: 'Access', icon: 'link', items: ['Field-level permissions', 'Content access', 'Backend routes', 'Dashboard visibility'] },
  ],
  blueprints: [
    { title: 'Business', icon: 'blueprint', items: ['Online Store', 'CRM Pipeline', 'Appointments', 'Inventory', 'Restaurant', 'Clinic'] },
    { title: 'Content', icon: 'pages', items: ['Blog & Magazine', 'Directory', 'Portfolio', 'Events', 'LMS Academy', 'Memberships'] },
    { title: 'Verticals', icon: 'blocks', items: ['Real Estate', 'Marketplace', 'Job Board', 'Help Desk', 'NGO', 'Tattoo Studio'] },
  ],
  settings: [
    { title: 'Project', icon: 'settings', items: ['General', 'Localization', 'Breakpoints', 'Project health'] },
    { title: 'Local-first', icon: 'local', items: ['Storage', 'Autosave', 'Recovery snapshots', 'Import', 'Portable project files'] },
    { title: 'Advanced', icon: 'code', items: ['Performance', 'Accessibility', 'Custom code', 'Experimental features'] },
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

function PendingDot({ state, label }: { state: ImplementationState; label?: string }) {
  if (state === 'ready') return null;
  return <span className="studio-pending-dot" title={label ?? 'Not fully implemented yet'} aria-label={label ?? 'Not fully implemented yet'} />;
}

function StudioRail({
  workspaceId,
  activeModule,
  onNavigate,
  onSelectModule,
}: {
  workspaceId: WorkspaceId;
  activeModule: StudioModuleId;
  onNavigate(workspaceId: WorkspaceId): void;
  onSelectModule(moduleId: StudioModuleId): void;
}) {
  return (
    <aside className="studio-rail" aria-label="ElectroCMS Studio navigation">
      <div className="studio-rail-brand" aria-label="ElectroCMS"><Icon name="bolt" size={17} /></div>
      <nav className="studio-primary-nav" aria-label="Primary workspaces">
        {primaryWorkspaces.map((workspace) => (
          <button
            key={workspace.id}
            type="button"
            className="studio-rail-button"
            data-active={workspaceId === workspace.id ? 'true' : 'false'}
            aria-label={workspace.label}
            title={workspace.label}
            onClick={() => onNavigate(workspace.id)}
          >
            <Icon name={workspace.icon} size={17} />
            <span>{workspace.label}</span>
            <PendingDot state={workspace.state} />
          </button>
        ))}
      </nav>
      <div className="studio-rail-separator" />
      <nav className="studio-module-nav" aria-label="Studio modules">
        {modules.map((module) => (
          <button
            key={module.id}
            type="button"
            className="studio-rail-button"
            data-active={workspaceId === 'editor' && activeModule === module.id ? 'true' : 'false'}
            aria-label={module.label}
            title={module.label}
            onClick={() => onSelectModule(module.id)}
          >
            <Icon name={module.icon} size={17} />
            <span>{module.label}</span>
            <PendingDot state={module.state} />
          </button>
        ))}
      </nav>
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
    <aside className="studio-library" aria-label="Insert library">
      <div className="studio-panel-title"><div><span>Insert</span><strong>Elements</strong></div><Icon name="blocks" size={16} /></div>
      <label className="studio-search-field">
        <Icon name="search" size={14} />
        <input aria-label="Search elements" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search elements…" />
        <kbd>⌘K</kbd>
      </label>
      <div className="studio-category-tabs" aria-label="Element categories">
        <button type="button" data-active={activeCategory === 'all'} onClick={() => setActiveCategory('all')}>All</button>
        {categories.map((category) => (
          <button key={category} type="button" data-active={activeCategory === category} onClick={() => setActiveCategory(category)}>{categoryLabels[category] ?? category}</button>
        ))}
      </div>
      <div className="studio-widget-groups">
        {categories.map((category) => {
          const group = visible.filter((definition) => definition.metadata.category === category);
          if (group.length === 0) return null;
          return (
            <section className="studio-widget-group" key={category}>
              <div className="studio-widget-group-heading"><span><Icon name={categoryIcons[category] ?? 'blocks'} size={13} />{categoryLabels[category] ?? category}</span><small>{group.length}</small></div>
              <div className="studio-widget-grid">
                {group.map((definition) => {
                  const ready = definition.capabilities.local === 'production-ready';
                  return (
                    <button
                      key={`${definition.type}@${definition.version}`}
                      type="button"
                      className="studio-widget-tile"
                      title={`${definition.metadata.name} — ${definition.metadata.description}`}
                      onClick={() => onInsert(definition)}
                    >
                      <span className="studio-widget-icon"><Icon name={categoryIcons[definition.metadata.category] ?? 'blocks'} size={15} /></span>
                      <span>{definition.metadata.name}</span>
                      {ready ? null : <span className="studio-pending-dot" title="This widget is still being completed" aria-label="This widget is still being completed" />}
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
        {visible.length === 0 ? <div className="studio-empty-state"><Icon name="search" size={20} /><strong>No elements found</strong><span>Try another search or category.</span></div> : null}
      </div>
    </aside>
  );
}

function BuilderWorkspace() {
  const session = useProjectSession();
  const actions = useCanvasDocumentActions();
  const document = session.project.documents[session.activeDocumentId];
  const breakpoint = session.project.breakpoints.find((candidate) => candidate.id === session.activeBreakpointId);

  if (!document || !breakpoint) {
    return <div className="studio-empty-state studio-empty-state--fill"><Icon name="editor" size={26} /><strong>No active document</strong><span>Create or select a document to start building.</span></div>;
  }

  return (
    <div className="studio-builder-workspace">
      <WidgetLibrary onInsert={(definition) => actions.insertWidget(definition.type)} />
      <div className="studio-editor-region">
        <div className="studio-context-bar">
          <div className="studio-breadcrumb"><span>{document.name}</span><i>/</i><strong>Canvas</strong></div>
          <div className="studio-context-actions"><button type="button"><Icon name="grid" size={14} /> Grid</button><button type="button"><Icon name="layers" size={14} /> Layers</button><button type="button"><Icon name="command" size={14} /> Commands</button></div>
        </div>
        <EditorCanvas
          document={document}
          breakpointId={session.activeBreakpointId}
          breakpoints={session.project.breakpoints}
          viewportWidth={breakpoint.width}
          zoom={session.zoom}
          actions={actions}
        />
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, items }: PlannedFeatureGroup) {
  return (
    <article className="studio-feature-card">
      <div className="studio-feature-card-heading"><span className="studio-feature-icon"><Icon name={icon} size={17} /></span><strong>{title}</strong><PendingDot state="planned" /></div>
      <ul>{items.map((item) => <li key={item}><Icon name="check" size={12} /><span>{item}</span><span className="studio-pending-dot" aria-hidden="true" /></li>)}</ul>
    </article>
  );
}

function PlannedModuleWorkspace({ module }: { module: Exclude<StudioModuleId, 'builder' | 'themes'> }) {
  const definition = modules.find((item) => item.id === module);
  const groups = moduleFeatures[module];
  return (
    <section className="studio-module-surface" aria-label={`${definition?.label ?? module} workspace`}>
      <header className="studio-surface-header">
        <div><span className="studio-eyebrow">Production workspace</span><div className="studio-heading-row"><h2>{definition?.label ?? module}</h2><PendingDot state={definition?.state ?? 'planned'} /></div><p>This module is part of the permanent ElectroCMS interface. Its controls stay visible while implementation is activated progressively.</p></div>
        <button type="button" className="studio-secondary-button"><Icon name="more" size={15} /> Options</button>
      </header>
      <div className="studio-feature-grid">{groups.map((group) => <FeatureCard key={group.title} {...group} />)}</div>
      <section className="studio-readiness-panel"><div><Icon name="shield" size={18} /><div><strong>Module reserved in production UI</strong><span>The red dot means the underlying capability is not fully implemented yet. No fake completion state is reported.</span></div></div><button type="button" disabled>Activate when implementation is ready</button></section>
    </section>
  );
}

function ThemesWorkspace() {
  return (
    <section className="studio-module-surface studio-theme-surface" aria-label="Themes workspace">
      <header className="studio-surface-header"><div><span className="studio-eyebrow">Design systems</span><div className="studio-heading-row"><h2>Theme Studio</h2></div><p>Frontend and backend theme packages are already connected to the canonical project state.</p></div><span className="studio-ready-chip"><Icon name="check" size={13} /> Active</span></header>
      <div className="studio-theme-columns"><ProjectThemeControls scope="frontend" /><ProjectThemeControls scope="backend" /></div>
    </section>
  );
}

function PreviewWorkspace() {
  return (
    <section className="studio-module-surface studio-preview-workspace" aria-label="Preview workspace">
      <header className="studio-surface-header"><div><span className="studio-eyebrow">Frontend preview</span><div className="studio-heading-row"><h2>Preview</h2><PendingDot state="partial" /></div><p>Theme state is live. The full frontend renderer will activate here as its implementation reaches production readiness.</p></div><div className="studio-device-switch"><button type="button" data-active="true">Desktop</button><button type="button">Tablet</button><button type="button">Mobile</button></div></header>
      <div className="studio-preview-layout"><div className="studio-browser-frame"><div className="studio-browser-chrome"><span /><span /><span /><div>electrocms.local / preview</div></div><div className="studio-preview-placeholder"><Icon name="preview" size={30} /><strong>Frontend renderer surface</strong><span>The final site preview will render the same canonical document and dynamic data here.</span><PendingDot state="partial" /></div></div><aside><ProjectThemeControls scope="frontend" /></aside></div>
    </section>
  );
}

function BackendWorkspace() {
  return (
    <section className="studio-module-surface studio-backend-workspace" aria-label="Backend workspace">
      <header className="studio-surface-header"><div><span className="studio-eyebrow">Administrative experience</span><div className="studio-heading-row"><h2>Backend Builder</h2><PendingDot state="partial" /></div><p>The permanent admin-builder surface is reserved now; dashboard and CRUD components will activate as their backend contracts are completed.</p></div></header>
      <div className="studio-backend-layout"><div className="studio-admin-mock"><aside><strong>Northstar Admin</strong>{['Overview', 'Products', 'Orders', 'Customers', 'Inventory', 'Content', 'Reports'].map((item) => <button type="button" key={item}><Icon name={item === 'Overview' ? 'grid' : item === 'Products' ? 'content' : item === 'Customers' ? 'users' : 'list'} size={14} />{item}<PendingDot state="planned" /></button>)}</aside><main><div className="studio-admin-title"><span>Workspace / Overview</span><strong>Operations dashboard</strong></div><div className="studio-admin-metrics">{['Revenue', 'Orders', 'Average order', 'Low stock'].map((item) => <article key={item}><span>{item}</span><strong>—</strong><PendingDot state="planned" /></article>)}</div><div className="studio-admin-table"><div><strong>Recent records</strong><span className="studio-pending-dot" /></div>{['Primary table', 'Filters', 'Saved views', 'Bulk actions'].map((item) => <p key={item}><span>{item}</span><PendingDot state="planned" /></p>)}</div></main></div><aside><ProjectThemeControls scope="backend" /></aside></div>
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
  return (
    <section className="studio-module-surface" aria-label="Export workspace">
      <header className="studio-surface-header"><div><span className="studio-eyebrow">Publishing center</span><div className="studio-heading-row"><h2>Build & Export</h2><PendingDot state="planned" /></div><p>Every export target remains visible in the production shell and will become actionable only after compatibility gates exist.</p></div></header>
      <div className="studio-export-grid">{targets.map((target) => <article key={target.label}><span className="studio-feature-icon"><Icon name={target.icon} size={18} /></span><div><strong>{target.label}</strong><span>{target.detail}</span></div><PendingDot state="planned" /><button type="button" disabled>Not active yet</button></article>)}</div>
      <section className="studio-readiness-panel"><div><Icon name="check" size={18} /><div><strong>Export readiness</strong><span>Compatibility reports, deterministic packaging and destination-specific validators will appear here.</span></div></div><strong>0 / 4 active</strong></section>
    </section>
  );
}

function EditorModuleWorkspace({ module }: { module: StudioModuleId }) {
  if (module === 'builder') return <BuilderWorkspace />;
  if (module === 'themes') return <ThemesWorkspace />;
  return <PlannedModuleWorkspace module={module} />;
}

export function ProductionStudio({ workspaceId, onNavigate }: ProductionStudioProps) {
  const [activeModule, setActiveModule] = useState<StudioModuleId>('builder');
  const activeDefinition = modules.find((module) => module.id === activeModule) ?? modules[0];

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

  return (
    <main className="production-studio" id="workspace-main" tabIndex={-1} data-workspace={workspaceId}>
      <h1 className="sr-only">{workspaceLabel} workspace</h1>
      <StudioRail workspaceId={workspaceId} activeModule={activeModule} onNavigate={onNavigate} onSelectModule={selectModule} />
      <div className="studio-main-column">
        <div className="studio-module-bar">
          <div><span>{workspaceId === 'editor' ? 'Studio' : 'Workspace'}</span><strong>{workspaceId === 'editor' ? activeDefinition?.label ?? 'Builder' : workspaceLabel}</strong>{workspaceId === 'editor' ? <PendingDot state={activeDefinition?.state ?? 'ready'} /> : <PendingDot state={primaryWorkspaces.find((item) => item.id === workspaceId)?.state ?? 'ready'} />}</div>
          <div className="studio-module-actions"><button type="button"><Icon name="command" size={14} /> Command palette</button><button type="button"><Icon name="users" size={14} /> Share</button><button type="button" className="studio-primary-button" disabled={workspaceId === 'export'}><Icon name="export" size={14} /> Publish{workspaceId === 'export' ? <PendingDot state="planned" /> : null}</button></div>
        </div>
        <div className="studio-workspace-content">{content}</div>
      </div>
    </main>
  );
}
