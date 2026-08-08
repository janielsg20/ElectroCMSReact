import { useMemo, useState, type ReactNode } from 'react';
import type { WorkspaceId } from '../routing/workspaces';
import './final-product-demo.css';

type DemoStatus = 'Demo' | 'Modelled' | 'Planned';
type StudioModule =
  | 'builder'
  | 'pages'
  | 'content'
  | 'queries'
  | 'forms'
  | 'filters'
  | 'backend'
  | 'media'
  | 'themes'
  | 'users'
  | 'blueprints'
  | 'settings';
type LibraryMode = 'elements' | 'layers' | 'templates';
type InspectorMode = 'content' | 'style' | 'advanced';

interface FinalProductDemoProps { workspaceId: WorkspaceId }
interface ModuleDefinition { id: StudioModule; label: string; glyph: string; status: DemoStatus }

const BUILDER_MODULE: ModuleDefinition = { id: 'builder', label: 'Builder', glyph: 'B', status: 'Demo' };
const modules: readonly ModuleDefinition[] = [
  BUILDER_MODULE,
  { id: 'pages', label: 'Pages', glyph: 'P', status: 'Demo' },
  { id: 'content', label: 'Content', glyph: 'D', status: 'Modelled' },
  { id: 'queries', label: 'Queries', glyph: 'Q', status: 'Planned' },
  { id: 'forms', label: 'Forms', glyph: 'F', status: 'Planned' },
  { id: 'filters', label: 'Filters', glyph: 'S', status: 'Planned' },
  { id: 'backend', label: 'Backend', glyph: 'A', status: 'Demo' },
  { id: 'media', label: 'Media', glyph: 'M', status: 'Planned' },
  { id: 'themes', label: 'Themes', glyph: 'T', status: 'Demo' },
  { id: 'users', label: 'Roles', glyph: 'U', status: 'Planned' },
  { id: 'blueprints', label: 'Blueprints', glyph: 'G', status: 'Planned' },
  { id: 'settings', label: 'Settings', glyph: 'C', status: 'Demo' },
];

const products = [
  { name: 'Halo Desk Lamp', type: 'Lighting · Aluminum', price: '$142', thumb: 'thumb-1' },
  { name: 'Form Side Table', type: 'Furniture · Oak', price: '$290', thumb: 'thumb-2' },
  { name: 'Drift Lounge', type: 'Seating · Wool', price: '$720', thumb: 'thumb-3' },
  { name: 'Mono Vessel', type: 'Objects · Ceramic', price: '$88', thumb: 'thumb-4' },
] as const;

const elementGroups = [
  { label: 'Layout', items: ['Section', 'Container', 'Flex', 'Grid', 'Columns', 'Stack', 'Tabs', 'Accordion'] },
  { label: 'Basic', items: ['Heading', 'Text', 'Image', 'Button', 'Icon', 'Video', 'Gallery', 'Logo'] },
  { label: 'Content', items: ['Card', 'FAQ', 'Timeline', 'Metrics', 'Pricing', 'Carousel', 'CTA', 'Popup'] },
  { label: 'Dynamic', items: ['Dynamic Field', 'Listing Grid', 'Relation', 'Query Result', 'Repeater', 'Conditional'] },
  { label: 'Commerce', items: ['Product Card', 'Product Grid', 'Price', 'Inventory', 'Cart', 'Checkout'] },
] as const;

const blueprints = [
  'Online Store', 'Blog & Magazine', 'Real Estate', 'LMS Academy', 'Appointments',
  'CRM Pipeline', 'Business Directory', 'Creative Portfolio', 'Inventory', 'Restaurant',
  'Events', 'Memberships', 'Marketplace', 'Job Board', 'Clinic', 'Property Management',
  'Help Desk', 'NGO & Donations', 'Vehicle Catalog', 'Tattoo Studio',
] as const;

function StatusBadge({ status }: { status: DemoStatus }) {
  return <span className={`fpd-status fpd-status--${status.toLowerCase()}`}>{status}</span>;
}
function Glyph({ children }: { children: ReactNode }) {
  return <span className="fpd-glyph" aria-hidden="true">{children}</span>;
}
function MiniThumb({ variant = 'mini-1' }: { variant?: string }) {
  return <span className={`fpd-mini-thumb ${variant}`} aria-hidden="true" />;
}
function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function ProductGrid() {
  return <div className="fpd-product-grid">{products.map((product) => (
    <article className="fpd-product-card" key={product.name}>
      <div className={`fpd-product-thumb ${product.thumb}`} />
      <div className="fpd-product-copy"><strong>{product.name}</strong><span>{product.price}</span></div>
      <small>{product.type}</small>
    </article>
  ))}</div>;
}

function SiteHeader() {
  return <header className="fpd-site-header">
    <div className="fpd-store-logo"><span className="fpd-logo-bolt">E</span><strong>Northstar</strong></div>
    <nav><span>Shop</span><span>Collections</span><span>Journal</span><span>About</span></nav>
    <div className="fpd-site-actions"><span>Search</span><span>Cart · 2</span></div>
  </header>;
}

function BuilderCanvas() {
  return <div className="fpd-canvas-shell">
    <div className="fpd-canvas-toolbar">
      <div className="fpd-breadcrumb"><span>Home</span><i>/</i><span>Hero</span><i>/</i><strong>Heading</strong></div>
      <div className="fpd-canvas-tools"><button type="button">Grid</button><button type="button">Guides</button><button type="button">Snap</button></div>
    </div>
    <div className="fpd-ruler fpd-ruler--horizontal" aria-hidden="true" />
    <div className="fpd-ruler fpd-ruler--vertical" aria-hidden="true" />
    <div className="fpd-canvas-stage">
      <div className="fpd-artboard" aria-label="Storefront page canvas">
        <SiteHeader />
        <section className="fpd-hero">
          <div className="fpd-hero-copy">
            <span className="fpd-eyebrow">NEW SEASON · 2026</span>
            <div className="fpd-selected-node">
              <span className="fpd-node-label">Heading · H1</span>
              <span className="fpd-handle fpd-handle--tl" /><span className="fpd-handle fpd-handle--tr" />
              <span className="fpd-handle fpd-handle--bl" /><span className="fpd-handle fpd-handle--br" />
              <h1>Objects for a quieter everyday.</h1>
            </div>
            <p>Thoughtful essentials, designed to last. Built from durable materials and a simpler point of view.</p>
            <div className="fpd-hero-buttons"><button type="button">Shop collection</button><button type="button" className="is-quiet">Explore story</button></div>
            <div className="fpd-hero-meta"><span>Free shipping over $120</span><span>30-day returns</span></div>
          </div>
          <div className="fpd-hero-media">
            <div className="fpd-product-sculpture"><span className="fpd-product-orb" /><span className="fpd-product-base" /></div>
            <div className="fpd-media-chip"><strong>Arc Lamp 02</strong><span>$186</span></div>
          </div>
        </section>
        <section className="fpd-product-section">
          <div className="fpd-section-heading"><div><span>CURATED OBJECTS</span><h2>Built for the spaces you live in.</h2></div><button type="button">View all 24</button></div>
          <ProductGrid />
        </section>
        <section className="fpd-feature-band">
          <div><strong>Local materials</strong><span>Chosen for durability and repairability.</span></div>
          <div><strong>Small-batch</strong><span>Made in considered production runs.</span></div>
          <div><strong>Designed to last</strong><span>Timeless forms, replaceable parts.</span></div>
        </section>
        <footer className="fpd-site-footer"><strong>Northstar / Objects</strong><span>Newsletter</span><span>Instagram</span><span>© 2026</span></footer>
      </div>
      <div className="fpd-guide fpd-guide--v" aria-hidden="true"><span>50%</span></div>
      <div className="fpd-guide fpd-guide--h" aria-hidden="true"><span>32px</span></div>
    </div>
    <div className="fpd-canvas-footer"><span>Desktop · 1440px</span><span>Selected: Heading / hero-title</span><span>12 columns · 24px gutter</span></div>
  </div>;
}

function ElementsPanel({ mode, onModeChange }: { mode: LibraryMode; onModeChange(mode: LibraryMode): void }) {
  const layerRows = [
    { depth: '', glyph: 'H', label: 'Header' }, { depth: '', glyph: 'S', label: 'Hero Section' },
    { depth: 'is-child', glyph: 'C', label: 'Hero Container' }, { depth: 'is-grandchild is-selected', glyph: 'H', label: 'Heading' },
    { depth: 'is-grandchild', glyph: 'T', label: 'Description' }, { depth: 'is-grandchild', glyph: 'B', label: 'Button Group' },
    { depth: '', glyph: 'S', label: 'Products Section' }, { depth: '', glyph: 'F', label: 'Footer' },
  ] as const;
  return <aside className="fpd-library" aria-label="Insert library">
    <div className="fpd-panel-heading"><div><span className="fpd-panel-kicker">Insert</span><strong>{mode === 'elements' ? 'Elements' : mode === 'layers' ? 'Navigator' : 'Templates'}</strong></div><button type="button" aria-label="Collapse insert library">‹</button></div>
    <div className="fpd-panel-tabs" role="tablist">
      {(['elements', 'layers', 'templates'] as const).map((tab) => <button key={tab} type="button" aria-selected={mode === tab} onClick={() => onModeChange(tab)}>{tab === 'templates' ? 'Blocks' : titleCase(tab)}</button>)}
    </div>
    {mode === 'elements' ? <>
      <label className="fpd-search"><span className="sr-only">Search elements</span><input placeholder="Search 80+ elements…" /><kbd>⌘K</kbd></label>
      <div className="fpd-category-pills"><button className="is-active" type="button">All</button><button type="button">Layout</button><button type="button">Dynamic</button><button type="button">Commerce</button></div>
      <div className="fpd-library-scroll">{elementGroups.map((group) => <section className="fpd-element-group" key={group.label}>
        <div className="fpd-group-title"><strong>{group.label}</strong><span>{group.items.length}</span></div>
        <div className="fpd-element-grid">{group.items.map((item) => <button className="fpd-element-tile" type="button" key={item}><Glyph>{item.slice(0, 1)}</Glyph><span>{item}</span>{group.label === 'Dynamic' ? <i>●</i> : null}</button>)}</div>
      </section>)}</div>
    </> : mode === 'layers' ? <div className="fpd-layer-tree">{layerRows.map((row) => <button className={row.depth} type="button" key={row.label}><span>›</span><Glyph>{row.glyph}</Glyph><strong>{row.label}</strong><i>◉</i></button>)}</div> : <div className="fpd-template-list">
      {['Hero · Split Commerce', 'Product Grid · Editorial', 'Newsletter · Minimal', 'Footer · 4 columns', 'FAQ · Compact'].map((item) => <button type="button" key={item}><span className="fpd-template-preview" /><strong>{item}</strong><small>Reusable block</small></button>)}
    </div>}
  </aside>;
}

function InspectorSection({ title, children, open = false }: { title: string; children: ReactNode; open?: boolean }) {
  return <details className="fpd-inspector-section" open={open}><summary><strong>{title}</strong><span>⌄</span></summary><div className="fpd-inspector-section-body">{children}</div></details>;
}

function Inspector({ mode, onModeChange }: { mode: InspectorMode; onModeChange(mode: InspectorMode): void }) {
  return <aside className="fpd-inspector" aria-label="Contextual inspector">
    <div className="fpd-inspector-heading"><div><span className="fpd-panel-kicker">Selected</span><strong>Heading</strong><code>hero-title</code></div><button type="button" aria-label="More element actions">•••</button></div>
    <div className="fpd-panel-tabs fpd-panel-tabs--inspector" role="tablist">{(['content', 'style', 'advanced'] as const).map((tab) => <button key={tab} type="button" aria-selected={mode === tab} onClick={() => onModeChange(tab)}>{titleCase(tab)}</button>)}</div>
    <div className="fpd-inspector-scroll">
      {mode === 'content' ? <>
        <InspectorSection title="Content" open><label><span>Text</span><textarea rows={3} defaultValue="Objects for a quieter everyday." /></label><div className="fpd-inline-grid"><label><span>HTML tag</span><select defaultValue="h1"><option>h1</option><option>h2</option></select></label><label><span>Alignment</span><select><option>Left</option><option>Center</option></select></label></div></InspectorSection>
        <InspectorSection title="Dynamic data"><button type="button" className="fpd-wide-action">＋ Connect dynamic source</button><small>Record, Query, User or site option.</small></InspectorSection>
        <InspectorSection title="Conditions"><div className="fpd-condition-row"><span>If</span><strong>Device</strong><span>is</span><strong>Desktop</strong></div><button className="fpd-text-action" type="button">+ Add condition</button></InspectorSection>
      </> : mode === 'style' ? <>
        <InspectorSection title="Typography" open><div className="fpd-inline-grid"><label><span>Family</span><select><option>Inter</option></select></label><label><span>Weight</span><select><option>600</option></select></label></div><div className="fpd-quad-grid"><label><span>Size</span><input defaultValue="72" /></label><label><span>Line</span><input defaultValue="0.98" /></label><label><span>Track</span><input defaultValue="-3" /></label><label><span>Unit</span><select><option>px</option><option>rem</option></select></label></div></InspectorSection>
        <InspectorSection title="Color & surface" open><div className="fpd-color-row"><button className="fpd-swatch" type="button" aria-label="Text color" /><input defaultValue="#11120F" /><button type="button">Global</button></div><label><span>Opacity</span><div className="fpd-slider-row"><input type="range" defaultValue="100" /><output>100%</output></div></label></InspectorSection>
        <InspectorSection title="Effects"><div className="fpd-toggle-row"><span>Text shadow</span><input type="checkbox" /></div><div className="fpd-toggle-row"><span>Blend mode</span><select><option>Normal</option></select></div></InspectorSection>
      </> : <>
        <InspectorSection title="Layout" open><div className="fpd-quad-grid"><label><span>Width</span><input defaultValue="Auto" /></label><label><span>Max W</span><input defaultValue="680" /></label><label><span>Position</span><select><option>Relative</option></select></label><label><span>Z</span><input defaultValue="1" /></label></div></InspectorSection>
        <InspectorSection title="Responsive" open><div className="fpd-breakpoint-values"><button className="is-active" type="button">D</button><button type="button">L</button><button type="button">T</button><button type="button">M</button></div><div className="fpd-inheritance-row"><span>Font size</span><strong>72px</strong><small>Explicit</small></div><div className="fpd-inheritance-row"><span>Margin</span><strong>0</strong><small>Inherited</small></div></InspectorSection>
        <InspectorSection title="Accessibility"><label><span>ARIA label</span><input placeholder="Optional accessible label" /></label><label><span>Tab index</span><input defaultValue="Auto" /></label></InspectorSection>
      </>}
    </div>
  </aside>;
}

function BuilderWorkspace() {
  const [libraryMode, setLibraryMode] = useState<LibraryMode>('elements');
  const [inspectorMode, setInspectorMode] = useState<InspectorMode>('style');
  return <div className="fpd-builder"><ElementsPanel mode={libraryMode} onModeChange={setLibraryMode} /><BuilderCanvas /><Inspector mode={inspectorMode} onModeChange={setInspectorMode} /></div>;
}

function DataWorkspace({ title, eyebrow, status, description, children }: { title: string; eyebrow: string; status: DemoStatus; description: string; children: ReactNode }) {
  return <div className="fpd-data-workspace"><header className="fpd-data-header"><div><span className="fpd-data-eyebrow">{eyebrow}</span><div className="fpd-title-row"><h2>{title}</h2><StatusBadge status={status} /></div><p>{description}</p></div><div className="fpd-data-actions"><button type="button">•••</button><button type="button">Help</button></div></header><div className="fpd-data-body">{children}</div></div>;
}

function PagesWorkspace() {
  const pages = ['Home', 'Shop', 'Collections', 'About', 'Journal', 'Contact'] as const;
  return <DataWorkspace title="Pages & Templates" eyebrow="Site structure" status="Demo" description="Documents, templates, reusable components and display conditions in one visual hierarchy.">
    <div className="fpd-split-browser"><aside className="fpd-collection-list"><button className="is-active" type="button"><strong>Pages</strong><span>6</span></button><button type="button"><strong>Templates</strong><span>6</span></button><button type="button"><strong>Global components</strong><span>12</span></button><button type="button"><strong>Saved widgets</strong><span>8</span></button></aside><div className="fpd-table-panel"><div className="fpd-table-toolbar"><label className="fpd-search"><input placeholder="Search pages…" /></label><button type="button">Filter</button><button className="is-primary" type="button">+ New page</button></div><table><thead><tr><th>Name</th><th>Type</th><th>Status</th><th>Theme</th><th>Updated</th></tr></thead><tbody>{pages.map((page) => <tr key={page}><td><strong>{page}</strong><small>/{page.toLowerCase()}</small></td><td>Page</td><td><span className="fpd-dot-status"><i />Published</span></td><td>Northstar</td><td>Today</td></tr>)}</tbody></table></div></div>
  </DataWorkspace>;
}

function ContentWorkspace() {
  const records = [
    { name: 'Arc Lamp 02', collection: 'Lighting', price: '$186', stock: '14', thumb: 'mini-1' },
    { name: 'Form Side Table', collection: 'Furniture', price: '$290', stock: '8', thumb: 'mini-2' },
    { name: 'Drift Lounge', collection: 'Seating', price: '$720', stock: '3', thumb: 'mini-3' },
    { name: 'Mono Vessel', collection: 'Objects', price: '$88', stock: '26', thumb: 'mini-4' },
    { name: 'Line Shelf 01', collection: 'Furniture', price: '$410', stock: '6', thumb: 'mini-5' },
  ] as const;
  return <DataWorkspace title="Dynamic Content" eyebrow="Content engine" status="Modelled" description="CPTs, taxonomies, custom fields, records and relations share one canonical project model.">
    <div className="fpd-content-layout"><aside className="fpd-content-sidebar"><div className="fpd-content-group"><span>Models</span><button className="is-active" type="button">Products <b>24</b></button><button type="button">Collections <b>6</b></button><button type="button">Journal <b>18</b></button></div><div className="fpd-content-group"><span>Schema</span><button type="button">Taxonomies <b>4</b></button><button type="button">Field Groups <b>7</b></button><button type="button">Relations <b>3</b></button></div></aside><div className="fpd-records-panel"><div className="fpd-records-head"><div><strong>Products</strong><span>24 records · 21 published</span></div><button type="button">Import</button><button className="is-primary" type="button">+ New product</button></div><div className="fpd-filter-line"><input placeholder="Search products…" /><select><option>All statuses</option></select><select><option>All collections</option></select><button type="button">Columns</button></div><table><thead><tr><th>Product</th><th>Status</th><th>Collection</th><th>Price</th><th>Stock</th></tr></thead><tbody>{records.map((record) => <tr key={record.name}><td><MiniThumb variant={record.thumb} /><strong>{record.name}</strong></td><td><span className="fpd-dot-status"><i />Published</span></td><td>{record.collection}</td><td>{record.price}</td><td>{record.stock}</td></tr>)}</tbody></table></div><aside className="fpd-schema-panel"><div className="fpd-schema-title"><span>Schema</span><strong>Product Fields</strong><button type="button">Edit</button></div>{['Product details · 8 fields', 'Commerce · 6 fields', 'Inventory · 5 fields', 'Shipping · 4 fields', 'Editorial · 3 fields'].map((item) => <div className="fpd-schema-card" key={item}><Glyph>F</Glyph><div><strong>{item}</strong><span>Reusable Field Group</span></div><span>›</span></div>)}<div className="fpd-schema-relations"><span>Relations</span><div><strong>Product → Collection</strong><small>many → one</small></div><div><strong>Product ↔ Related</strong><small>many ↔ many</small></div></div></aside></div>
  </DataWorkspace>;
}

function QueriesWorkspace() {
  return <DataWorkspace title="Query Studio" eyebrow="Dynamic data" status="Planned" description="Reusable visual data sources for listings, filters and dynamic widgets with result preview.">
    <div className="fpd-query-grid"><section className="fpd-query-builder"><div className="fpd-query-source"><span>01</span><div><small>SOURCE</small><strong>Products</strong><p>Content Type · published</p></div><button type="button">Change</button></div><div className="fpd-query-connector" /><div className="fpd-query-node"><div className="fpd-query-node-head"><span>02 · FILTER</span><button type="button">•••</button></div><div className="fpd-query-condition"><select><option>Collection</option></select><select><option>is</option></select><select><option>Lighting</option></select></div><div className="fpd-query-condition"><select><option>Stock</option></select><select><option>greater than</option></select><input defaultValue="0" /></div><button className="fpd-text-action" type="button">+ Add AND condition</button></div><div className="fpd-query-connector" /><div className="fpd-query-node"><div className="fpd-query-node-head"><span>03 · SORT & LIMIT</span></div><div className="fpd-query-condition"><select><option>Updated date</option></select><select><option>Descending</option></select><input defaultValue="12" /></div></div><button className="fpd-query-add" type="button">+ Add query step</button></section><aside className="fpd-query-preview"><div><span>Live preview</span><strong>12 results</strong><button type="button">Refresh</button></div>{products.map((product) => <article key={product.name}><MiniThumb /><div><strong>{product.name}</strong><span>{product.type}</span></div><b>{product.price}</b></article>)}</aside></div>
  </DataWorkspace>;
}

function FormsWorkspace() {
  const fields = ['Text', 'Email', 'Phone', 'Select', 'Checkbox', 'Date', 'File', 'Repeater', 'Submit'] as const;
  const actions = ['Create Lead record', 'Send notification', 'Update relation', 'Show success message'] as const;
  return <DataWorkspace title="Form Builder" eyebrow="Workflow" status="Planned" description="Visual forms, validation, conditions, multi-step flows and post-submit actions.">
    <div className="fpd-form-builder"><aside className="fpd-form-elements"><strong>Fields</strong>{fields.map((field) => <button type="button" key={field}><Glyph>{field.slice(0, 1)}</Glyph>{field}</button>)}</aside><section className="fpd-form-canvas"><div className="fpd-form-card"><div className="fpd-form-step"><span>Step 1 of 2</span><strong>Request a consultation</strong><p>Tell us what you are looking for and our team will follow up.</p></div><div className="fpd-two-fields"><label><span>First name</span><input placeholder="Jane" /></label><label><span>Last name</span><input placeholder="Smith" /></label></div><label><span>Email address</span><input placeholder="jane@example.com" /></label><label className="is-selected"><span>Project type</span><select><option>Website redesign</option></select><i>Selected · Select field</i></label><label><span>Notes</span><textarea rows={4} placeholder="Tell us about your project…" /></label><button type="button">Continue →</button></div></section><aside className="fpd-action-stack"><div className="fpd-action-head"><span>After submit</span><button type="button">+ Action</button></div>{actions.map((action) => <div className="fpd-action-node" key={action}><span>→</span><div><strong>{action}</strong><small>Configured workflow action</small></div><b>•••</b></div>)}</aside></div>
  </DataWorkspace>;
}

function FiltersWorkspace() {
  const filters = [
    { name: 'Collection', type: 'Taxonomy' }, { name: 'Price Range', type: 'Range' },
    { name: 'In stock', type: 'Checkbox' }, { name: 'Sort products', type: 'Sorting' }, { name: 'Material', type: 'Select' },
  ] as const;
  return <DataWorkspace title="Smart Filters" eyebrow="Discovery" status="Planned" description="Faceted search, sorting and pagination connected to queries, listings, directories and commerce.">
    <div className="fpd-filter-studio"><section className="fpd-filter-catalog"><div className="fpd-table-toolbar"><input placeholder="Search filters…" /><button className="is-primary" type="button">+ New filter</button></div>{filters.map((filter) => <button className={filter.name === 'Price Range' ? 'is-active' : ''} type="button" key={filter.name}><Glyph>F</Glyph><div><strong>{filter.name}</strong><span>{filter.type} · Products Query</span></div><i>›</i></button>)}</section><section className="fpd-filter-config"><div className="fpd-config-title"><div><span>Filter configuration</span><strong>Price Range</strong></div><StatusBadge status="Planned" /></div><div className="fpd-config-grid"><label><span>Data source</span><select><option>Product price</option></select></label><label><span>Apply mode</span><select><option>Live / AJAX</option></select></label><label><span>Min value</span><input defaultValue="0" /></label><label><span>Max value</span><input defaultValue="1200" /></label><label><span>Step</span><input defaultValue="10" /></label><label><span>URL key</span><input defaultValue="price" /></label></div><div className="fpd-filter-preview"><span>Preview</span><div className="fpd-price-slider"><i /><b /></div><div><strong>$120</strong><strong>$860</strong></div></div><div className="fpd-toggle-row"><span>Show result count</span><input type="checkbox" defaultChecked /></div><div className="fpd-toggle-row"><span>Persist in URL</span><input type="checkbox" defaultChecked /></div></section><aside className="fpd-connections"><span>Connected to</span>{['Products Query', 'Product Grid', 'Shop Archive'].map((item) => <div key={item}><Glyph>C</Glyph><strong>{item}</strong><small>Live connection</small></div>)}</aside></div>
  </DataWorkspace>;
}

function BackendWorkspace() {
  const metrics = [
    { label: 'Revenue', value: '$48,290', trend: '+12.4%' }, { label: 'Orders', value: '382', trend: '+8.2%' },
    { label: 'Avg. order', value: '$126.41', trend: '+3.1%' }, { label: 'Low stock', value: '7', trend: 'Needs attention' },
  ] as const;
  const adminNav = ['Overview', 'Products', 'Orders', 'Customers', 'Inventory', 'Content', 'Reports'] as const;
  return <DataWorkspace title="Backend Builder" eyebrow="Administrative experience" status="Demo" description="Role-aware dashboards, CRUD tables, forms, kanban, calendars and operational views built visually.">
    <div className="fpd-backend-builder"><aside className="fpd-admin-sidebar"><div className="fpd-admin-brand"><span>N</span><strong>Northstar Admin</strong></div>{adminNav.map((item) => <button className={item === 'Overview' ? 'is-active' : ''} type="button" key={item}><Glyph>{item.slice(0, 1)}</Glyph>{item}</button>)}<div className="fpd-admin-bottom"><button type="button"><Glyph>S</Glyph>Settings</button><div><span>AR</span><strong>Alex Rivera</strong></div></div></aside><section className="fpd-admin-canvas"><div className="fpd-admin-top"><div><small>Workspace / Overview</small><strong>Good morning, Alex.</strong></div><div><button type="button">Last 30 days</button><button className="is-primary" type="button">+ New product</button></div></div><div className="fpd-metric-grid">{metrics.map((metric) => <article className={metric.label === 'Orders' ? 'is-selected' : ''} key={metric.label}><div><span>{metric.label}</span><button type="button">•••</button></div><strong>{metric.value}</strong><small>{metric.trend}</small>{metric.label === 'Orders' ? <i>Selected · Metric Card</i> : null}</article>)}</div><div className="fpd-admin-panels"><article className="fpd-chart-card"><div><strong>Revenue</strong><span>Jul 10 — Aug 08</span></div><div className="fpd-chart">{Array.from({ length: 10 }, (_, index) => <i key={index} />)}</div></article><article className="fpd-stock-card"><div><strong>Inventory alerts</strong><button type="button">View all</button></div>{['Drift Lounge', 'Line Shelf 01', 'Arc Lamp 02'].map((item) => <div key={item}><MiniThumb /><span><strong>{item}</strong><small>Low inventory</small></span><b>Low</b></div>)}</article></div><div className="fpd-orders-card"><div><strong>Recent orders</strong><button type="button">Saved view · Today</button><button type="button">Columns</button></div><table><thead><tr><th>Order</th><th>Customer</th><th>Status</th><th>Total</th></tr></thead><tbody><tr><td>#1048</td><td>Mia Chen</td><td>Paid</td><td>$386</td></tr><tr><td>#1047</td><td>James Hall</td><td>Packing</td><td>$142</td></tr><tr><td>#1046</td><td>Sofia Reed</td><td>Shipped</td><td>$808</td></tr></tbody></table></div></section><aside className="fpd-backend-inspector"><span>Dashboard widget</span><strong>Orders metric</strong><div className="fpd-panel-tabs"><button aria-selected="true" type="button">Content</button><button type="button">Style</button><button type="button">Access</button></div><label><span>Metric</span><select><option>Order count</option></select></label><label><span>Time range</span><select><option>Last 30 days</option></select></label><div className="fpd-toggle-row"><span>Show trend</span><input type="checkbox" defaultChecked /></div><div className="fpd-role-chips"><span>Visible to</span><button type="button">Administrator ×</button><button type="button">Manager ×</button></div></aside></div>
  </DataWorkspace>;
}

function MediaWorkspace() {
  const media = ['arc-lamp.webp', 'drift-chair.webp', 'northstar-logo.svg', 'journal-01.webp', 'line-shelf.webp', 'material-oak.webp', 'collection-dark.webp', 'product-hero.webp', 'studio-02.webp', 'mono-vessel.webp', 'texture-paper.webp', 'icon-set.svg'] as const;
  return <DataWorkspace title="Media Library" eyebrow="Local asset manager" status="Planned" description="Images, SVG, video, audio, documents, fonts and icons with usage tracking and safe reuse.">
    <div className="fpd-media-layout"><aside className="fpd-media-folders"><button className="is-active" type="button">All media <b>286</b></button><button type="button">Images <b>198</b></button><button type="button">Videos <b>14</b></button><button type="button">Documents <b>22</b></button><hr /><span>Folders</span>{['Products', 'Lifestyle', 'Journal', 'Icons', 'Fonts'].map((folder) => <button type="button" key={folder}>▢ {folder}</button>)}</aside><section className="fpd-media-main"><div className="fpd-table-toolbar"><input placeholder="Search media…" /><button type="button">Type</button><button type="button">Used in</button><button className="is-primary" type="button">Upload media</button></div><div className="fpd-media-grid">{media.map((item) => <button className={item === 'drift-chair.webp' ? 'is-selected' : ''} type="button" key={item}><span className={`fpd-media-preview ${item === 'drift-chair.webp' ? 'media-2' : ''}`} /><strong>{item}</strong><small>1200 × 1200 · local</small></button>)}</div></section><aside className="fpd-media-inspector"><div className="fpd-media-large media-2" /><strong>drift-chair.webp</strong><span>Image · 1200 × 1200 · 196 KB</span><label><span>Alt text</span><textarea rows={3} defaultValue="Drift Lounge chair in natural wool" /></label><label><span>Tags</span><input defaultValue="product, seating, wool" /></label><div className="fpd-usage"><span>Used in 4 places</span><button type="button">Home / Products</button><button type="button">Product Single</button><button type="button">Drift Lounge record</button></div><button className="fpd-wide-action" type="button">Optimize asset</button></aside></div>
  </DataWorkspace>;
}

function ThemesWorkspace() {
  const themes = [
    { name: 'High Density', style: 'theme-1' }, { name: 'Bento Grid', style: 'theme-2' },
    { name: 'Minimal Clean', style: 'theme-3' }, { name: 'Elegant Editorial', style: 'theme-4' },
    { name: 'Sophisticated Dark', style: 'theme-5' }, { name: 'SaaS Glass', style: 'theme-6' },
    { name: 'Material Neutral', style: 'theme-7' }, { name: 'Neobrutalist', style: 'theme-8' },
    { name: 'Corporate Pro', style: 'theme-9' },
  ] as const;
  return <DataWorkspace title="Theme Studio" eyebrow="Design systems" status="Demo" description="Independent editor, frontend and backend themes driven by reusable design tokens and packages.">
    <div className="fpd-theme-studio"><div className="fpd-theme-top"><div className="fpd-panel-tabs"><button aria-selected="true" type="button">Frontend themes</button><button type="button">Backend themes</button><button type="button">Editor presets</button><button type="button">Theme packages</button></div><button className="is-primary" type="button">+ Create theme</button></div><div className="fpd-theme-grid">{themes.map((theme) => <button className={theme.name === 'Minimal Clean' ? 'is-active' : ''} type="button" key={theme.name}><span className={`fpd-theme-preview ${theme.style}`}><i /><i /><i /><i /></span><div><strong>{theme.name}</strong>{theme.name === 'Minimal Clean' ? <StatusBadge status="Demo" /> : <span>Built-in</span>}</div><small>Token-driven visual system</small></button>)}</div><aside className="fpd-theme-token-panel"><div><span>Active theme</span><strong>Minimal Clean</strong><button type="button">Duplicate to edit</button></div><section><strong>Color tokens</strong><label><span>Primary</span><i style={{ background: '#151713' }} /><input defaultValue="#151713" /></label><label><span>Surface</span><i style={{ background: '#ffffff' }} /><input defaultValue="#FFFFFF" /></label><label><span>Accent</span><i style={{ background: '#8d9a5b' }} /><input defaultValue="#8D9A5B" /></label></section><section><strong>System</strong><label><span>Radius</span><input defaultValue="10px" /></label><label><span>Density</span><select><option>Compact</option></select></label></section></aside></div>
  </DataWorkspace>;
}

function UsersWorkspace() {
  const roles = ['Administrator', 'Designer', 'Editor', 'Author', 'Manager', 'Contributor', 'Client', 'Registered User'] as const;
  const capabilities = ['Settings', 'Themes', 'Content', 'Publish', 'Delete', 'Export', 'Dashboards', 'Users'] as const;
  return <DataWorkspace title="Roles & Permissions" eyebrow="Access control" status="Planned" description="Role capabilities, content access, field visibility and backend routes with least-privilege controls.">
    <div className="fpd-role-layout"><aside className="fpd-role-list"><div><strong>Roles</strong><button type="button">+</button></div>{roles.map((role) => <button className={role === 'Manager' ? 'is-active' : ''} type="button" key={role}><span>{role.slice(0, 2).toUpperCase()}</span><div><strong>{role}</strong><small>Configured users</small></div></button>)}</aside><section className="fpd-permission-panel"><div className="fpd-permission-head"><div><span>Custom role</span><strong>Manager</strong><small>Operational access without system configuration.</small></div><button type="button">Duplicate role</button><button className="is-primary" type="button">Save changes</button></div><table><thead><tr><th>Capability</th><th>View</th><th>Create</th><th>Edit</th><th>Delete</th><th>Publish</th></tr></thead><tbody>{capabilities.map((capability) => <tr key={capability}><td><strong>{capability}</strong><small>Explicit permission scope</small></td><td><input type="checkbox" defaultChecked /></td><td><input type="checkbox" defaultChecked={capability !== 'Settings'} /></td><td><input type="checkbox" defaultChecked={capability !== 'Settings'} /></td><td><input type="checkbox" /></td><td><input type="checkbox" defaultChecked={capability === 'Content'} /></td></tr>)}</tbody></table><div className="fpd-field-access"><strong>Field-level access</strong><span>Products</span><button type="button">Price · Edit</button><button type="button">Inventory · Edit</button><button type="button">Internal margin · Hidden</button><button type="button">+ Add override</button></div></section></div>
  </DataWorkspace>;
}

function BlueprintsWorkspace() {
  return <DataWorkspace title="Project Blueprints" eyebrow="Start from a system" status="Planned" description="Complete presets with pages, content models, backend, roles, forms, filters, queries and demo content.">
    <div className="fpd-blueprint-toolbar"><input placeholder="Search 20 blueprints…" /><button className="is-active" type="button">All</button><button type="button">Commerce</button><button type="button">Services</button><button type="button">Content</button><button type="button">Operations</button></div><div className="fpd-blueprint-grid">{blueprints.map((name) => <button type="button" key={name}><span className="fpd-blueprint-preview"><i>{name.slice(0, 2).toUpperCase()}</i></span><div><strong>{name}</strong><StatusBadge status="Planned" /></div><small>Pages · models · dashboard · workflows</small></button>)}</div>
  </DataWorkspace>;
}

function SettingsWorkspace() {
  return <DataWorkspace title="Project Settings" eyebrow="Local-first control center" status="Demo" description="Project configuration, storage, recovery, accessibility, performance, import and project health.">
    <div className="fpd-settings-layout"><aside className="fpd-settings-nav">{['General', 'Localization', 'Breakpoints', 'Storage & recovery', 'Performance', 'Accessibility', 'Custom code', 'Import', 'Project health'].map((item) => <button className={item === 'Storage & recovery' ? 'is-active' : ''} type="button" key={item}>{item}</button>)}</aside><section className="fpd-settings-panel"><div><span>Storage & recovery</span><strong>Local project persistence</strong><p>ElectroCMS keeps the editable project on this device and maintains bounded recovery snapshots.</p></div><div className="fpd-health-card"><div><Glyph>✓</Glyph><span><strong>Project data healthy</strong><small>Last verified 2 minutes ago · schema v1</small></span><button type="button">Run check</button></div></div><div className="fpd-settings-grid"><label><span>Autosave delay</span><select><option>500 ms</option></select><small>Debounced after canonical mutations.</small></label><label><span>Recovery snapshots</span><select><option>Keep latest 10</option></select><small>Stored separately from project data.</small></label><label><span>Workspace storage</span><input defaultValue="IndexedDB · electrocms" disabled /><small>Primary browser adapter.</small></label><label><span>Portable project files</span><select><option>Ask before writing</option></select><small>File System Access when available.</small></label></div><div className="fpd-recovery-list"><div><strong>Recovery history</strong><button type="button">Export backup</button></div>{['Today · 10:12 AM', 'Today · 9:48 AM', 'Yesterday · 6:31 PM'].map((item) => <div key={item}><span><strong>{item}</strong><small>Valid project snapshot</small></span><button type="button">Inspect</button><button type="button">Restore…</button></div>)}</div></section></div>
  </DataWorkspace>;
}

function PreviewWorkspace() {
  return <div className="fpd-preview-workspace"><div className="fpd-preview-bar"><div><StatusBadge status="Demo" /><strong>Live Preview</strong><span>Same project state · Frontend theme: Minimal Clean</span></div><div className="fpd-device-switch"><button className="is-active" type="button">Desktop</button><button type="button">Tablet</button><button type="button">Mobile</button></div><div><button type="button">Open in new window</button><button className="is-primary" type="button">Publish</button></div></div><div className="fpd-preview-stage"><div className="fpd-preview-browser"><div className="fpd-browser-chrome"><span /><span /><span /><div>northstar.local /</div></div><div className="fpd-preview-site"><SiteHeader /><section className="fpd-hero fpd-preview-hero"><div className="fpd-hero-copy"><span className="fpd-eyebrow">NEW SEASON · 2026</span><h1>Objects for a quieter everyday.</h1><p>Thoughtful essentials, designed to last. Built from durable materials and a simpler point of view.</p><div className="fpd-hero-buttons"><button type="button">Shop collection</button><button className="is-quiet" type="button">Explore story</button></div></div><div className="fpd-hero-media"><div className="fpd-product-sculpture"><span className="fpd-product-orb" /><span className="fpd-product-base" /></div></div></section><section className="fpd-product-section"><div className="fpd-section-heading"><div><span>CURATED OBJECTS</span><h2>Built for the spaces you live in.</h2></div><button type="button">View all 24</button></div><ProductGrid /></section></div></div></div><aside className="fpd-preview-insights"><div><span>Preview diagnostics</span><strong>Ready</strong></div><p><i />No unsupported widgets on current page.</p><p><i />6 responsive breakpoints resolved.</p><p><i />Accessibility outline: 0 blocking issues.</p><p><i />Local data source connected.</p><button type="button">View compatibility report</button></aside></div>;
}

function PublishWorkspace() {
  const targets = [
    { name: 'Local', glyph: 'L', subtitle: 'Offline package', detail: 'Portable project + local runtime', status: 'Demo' as const },
    { name: 'React', glyph: 'R', subtitle: 'Deployable app', detail: 'Vite project · SPA/static', status: 'Demo' as const },
    { name: 'LAMP', glyph: 'L', subtitle: 'Server package', detail: 'PHP · MySQL/MariaDB · Admin', status: 'Planned' as const },
    { name: 'WordPress', glyph: 'W', subtitle: 'Theme + plugin', detail: 'Native WP APIs · no required plugins', status: 'Planned' as const },
  ];
  return <div className="fpd-publish-workspace"><header className="fpd-publish-header"><div><span className="fpd-data-eyebrow">Publishing center</span><div className="fpd-title-row"><h2>Build & Export</h2><StatusBadge status="Demo" /></div><p>Validate capability parity, choose a destination and generate a deterministic project package.</p></div><button type="button">Export history</button></header><div className="fpd-publish-layout"><section className="fpd-targets"><div className="fpd-target-intro"><strong>Choose destination</strong><span>All targets consume the same canonical project and renderer contracts.</span></div><div className="fpd-target-grid">{targets.map((target) => <button className={target.name === 'React' ? 'is-active' : ''} type="button" key={target.name}><Glyph>{target.glyph}</Glyph><div><strong>{target.name}</strong><span>{target.subtitle}</span><small>{target.detail}</small></div><StatusBadge status={target.status} /></button>)}</div><div className="fpd-export-config"><div className="fpd-config-title"><div><span>React export</span><strong>Production configuration</strong></div><span className="fpd-dot-status"><i />Compatible</span></div><div className="fpd-config-grid"><label><span>Output mode</span><select><option>SPA + static assets</option></select></label><label><span>Package manager</span><select><option>npm</option></select></label><label><span>Admin route</span><input defaultValue="/admin" /></label><label><span>Base path</span><input defaultValue="/" /></label></div><div className="fpd-export-options"><label><input type="checkbox" defaultChecked /> Include demo content</label><label><input type="checkbox" defaultChecked /> Include local admin</label><label><input type="checkbox" defaultChecked /> Generate README</label><label><input type="checkbox" defaultChecked /> Run clean build verification</label></div></div></section><aside className="fpd-publish-summary"><div className="fpd-score"><span>Export readiness</span><strong>94</strong><small>/ 100</small></div><div className="fpd-check-list"><p><i>✓</i><span><strong>Project schema</strong><small>Valid · v1</small></span></p><p><i>✓</i><span><strong>Widgets</strong><small>34 compatible · 0 blocked</small></span></p><p><i>✓</i><span><strong>Dynamic content</strong><small>4 models · 51 records</small></span></p><p className="is-warning"><i>!</i><span><strong>Planned capabilities</strong><small>Clearly excluded from this visual demo</small></span></p></div><div className="fpd-build-estimate"><span>Package</span><strong>northstar-react.zip</strong><small>Estimated 8.4 MB · no secrets</small></div><button className="fpd-publish-button" type="button">Generate React package</button><button className="fpd-wide-action" type="button">View detailed compatibility</button></aside></div></div>;
}

function moduleForWorkspace(workspaceId: WorkspaceId): StudioModule {
  return workspaceId === 'backend' ? 'backend' : 'builder';
}

export function FinalProductDemo({ workspaceId }: FinalProductDemoProps) {
  const [activeModule, setActiveModule] = useState<StudioModule>(() => moduleForWorkspace(workspaceId));
  const effectiveModule: StudioModule = workspaceId === 'backend' ? 'backend' : activeModule;
  const selectedModule = useMemo(() => modules.find((item) => item.id === effectiveModule) ?? BUILDER_MODULE, [effectiveModule]);

  let content: ReactNode;
  if (workspaceId === 'preview') content = <PreviewWorkspace />;
  else if (workspaceId === 'export') content = <PublishWorkspace />;
  else if (effectiveModule === 'builder') content = <BuilderWorkspace />;
  else if (effectiveModule === 'pages') content = <PagesWorkspace />;
  else if (effectiveModule === 'content') content = <ContentWorkspace />;
  else if (effectiveModule === 'queries') content = <QueriesWorkspace />;
  else if (effectiveModule === 'forms') content = <FormsWorkspace />;
  else if (effectiveModule === 'filters') content = <FiltersWorkspace />;
  else if (effectiveModule === 'backend') content = <BackendWorkspace />;
  else if (effectiveModule === 'media') content = <MediaWorkspace />;
  else if (effectiveModule === 'themes') content = <ThemesWorkspace />;
  else if (effectiveModule === 'users') content = <UsersWorkspace />;
  else if (effectiveModule === 'blueprints') content = <BlueprintsWorkspace />;
  else content = <SettingsWorkspace />;

  return <section className="final-product-demo" data-workspace={workspaceId} data-testid="final-product-demo">
    <div className="fpd-demo-notice"><div><StatusBadge status="Demo" /><strong>Final Product Demo</strong><span>Visual prototype of the completed ElectroCMS product · not phase-completion evidence.</span></div><div><span className="fpd-notice-chip">UI/UX Pro Max</span><span className="fpd-notice-chip">No-code builder</span><span className="fpd-notice-chip">High density</span></div></div>
    <div className="fpd-studio">
      {workspaceId === 'editor' || workspaceId === 'backend' ? <nav className="fpd-module-rail" aria-label="ElectroCMS Studio modules"><div className="fpd-rail-mark" title="ElectroCMS Studio">E</div><div className="fpd-rail-scroll">{modules.map((module) => <button key={module.id} type="button" aria-label={module.label} title={`${module.label} · ${module.status}`} data-active={effectiveModule === module.id ? 'true' : 'false'} onClick={() => setActiveModule(module.id)}><Glyph>{module.glyph}</Glyph><span>{module.label}</span>{module.status !== 'Demo' ? <i /> : null}</button>)}</div><button className="fpd-rail-help" type="button" title="Help and command palette"><Glyph>?</Glyph><span>Help</span></button></nav> : null}
      <div className="fpd-studio-main">{workspaceId === 'editor' ? <div className="fpd-context-bar"><div><strong>{selectedModule.label}</strong><StatusBadge status={selectedModule.status} /></div><div className="fpd-context-actions"><button type="button">Command palette</button><button type="button">Share</button><button className="is-primary" type="button">Publish</button></div></div> : null}{content}</div>
    </div>
  </section>;
}
