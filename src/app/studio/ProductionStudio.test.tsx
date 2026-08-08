import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { createCanonicalProject } from '../../core/project';
import { App } from '../App';
import { MemoryWorkspacePreferencesRepository } from '../workspace/workspace-preferences-repository';

function makeProject() {
  return createCanonicalProject({
    id: 'production_studio_test',
    name: 'Production Studio project',
    now: '2026-08-08T18:40:00.000Z',
    randomUuid: (() => {
      let sequence = 0;
      return () => `00000000-0000-4000-8000-${String(++sequence).padStart(12, '0')}`;
    })(),
  });
}

function makeDynamicProject() {
  const project = makeProject();
  return {
    ...project,
    contentTypes: {
      product: { name: 'Products', slug: 'products', fields: ['title', 'price'] },
    },
    taxonomies: {
      category: { name: 'Categories', slug: 'category' },
    },
    fieldGroups: {
      commerce_fields: { name: 'Commerce fields', fields: ['price', 'sku'] },
    },
    records: {
      product_1: { title: 'Desk Lamp', price: 120 },
    },
    relations: {},
    queries: {
      featured_products: { name: 'Featured products', limit: 6 },
    },
  };
}

function makeWorkflowProject() {
  const project = makeDynamicProject();
  return {
    ...project,
    forms: {
      contact_form: {
        name: 'Contact form',
        fields: ['name', 'email', 'message'],
        conditions: { emailRequired: true },
        actions: ['create-record', 'email'],
      },
    },
    filters: {
      product_search: {
        name: 'Product search',
        source: 'featured_products',
        filters: ['search', 'category'],
        liveApply: true,
      },
    },
  };
}

function makeBackendProject() {
  const project = makeWorkflowProject();
  return {
    ...project,
    roles: {
      manager: { name: 'Manager', capabilities: ['view', 'edit', 'publish'] },
    },
    users: {
      user_1: { name: 'Alex Morgan', email: 'alex@example.test', role: 'manager' },
    },
    backend: {
      navigation: ['dashboard', 'content'],
      defaultDashboard: 'operations',
    },
    dashboards: {
      operations: { name: 'Operations', widgets: ['revenue', 'inventory'] },
    },
  };
}

describe('ProductionStudio', () => {
  it('uses the permanent Studio module rail and keeps the real builder available', async () => {
    window.history.replaceState({}, '', '/editor');
    const user = userEvent.setup();
    render(<App initialProject={makeProject()} preferencesRepository={new MemoryWorkspacePreferencesRepository()} />);

    const modules = screen.getByRole('navigation', { name: 'Studio modules' });
    expect(within(modules).getByRole('button', { name: 'Builder' })).toBeInTheDocument();
    expect(screen.getByRole('complementary', { name: 'Insert library' })).toBeInTheDocument();
    expect(screen.getByTestId('editor-canvas')).toBeInTheDocument();

    await user.click(within(modules).getByRole('button', { name: 'Pages' }));
    expect(screen.getByRole('heading', { name: 'Pages, templates & assets' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /pages/i })).toHaveAttribute('aria-selected', 'true');

    await user.click(within(modules).getByRole('button', { name: 'Builder' }));
    expect(screen.getByTestId('editor-canvas')).toBeInTheDocument();
  });

  it('opens a canonical page from Pages and returns to the real Builder', async () => {
    window.history.replaceState({}, '', '/editor');
    const user = userEvent.setup();
    render(<App initialProject={makeProject()} preferencesRepository={new MemoryWorkspacePreferencesRepository()} />);

    const modules = screen.getByRole('navigation', { name: 'Studio modules' });
    await user.click(within(modules).getByRole('button', { name: 'Pages' }));

    const resources = screen.getByRole('region', { name: 'Pages and assets workspace' });
    expect(within(resources).getByText('Home')).toBeInTheDocument();
    await user.click(within(resources).getByRole('button', { name: /Home/i }));

    expect(screen.getByTestId('editor-canvas')).toBeInTheDocument();
    expect(screen.getByLabelText('Active document')).toHaveDisplayValue('Home');
  });

  it('switches Media to the canonical Assets view without inventing resources', async () => {
    window.history.replaceState({}, '', '/editor');
    const user = userEvent.setup();
    render(<App initialProject={makeProject()} preferencesRepository={new MemoryWorkspacePreferencesRepository()} />);

    const modules = screen.getByRole('navigation', { name: 'Studio modules' });
    await user.click(within(modules).getByRole('button', { name: 'Media' }));

    expect(screen.getByRole('tab', { name: /assets/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('No assets found')).toBeInTheDocument();
    expect(screen.getByLabelText('Search project resources')).toHaveAttribute('placeholder', 'Search assets…');
  });

  it('uses canonical F05 maps in Dynamic Content Studio and opens Queries in context', async () => {
    window.history.replaceState({}, '', '/editor');
    const user = userEvent.setup();
    render(<App initialProject={makeDynamicProject()} preferencesRepository={new MemoryWorkspacePreferencesRepository()} />);

    const modules = screen.getByRole('navigation', { name: 'Studio modules' });
    await user.click(within(modules).getByRole('button', { name: 'Content' }));

    const studio = screen.getByRole('region', { name: 'Dynamic Content Studio' });
    expect(within(studio).getByRole('heading', { name: 'Dynamic Content Studio' })).toBeInTheDocument();
    expect(within(studio).getByRole('tab', { name: /Content Types/i })).toHaveAttribute('aria-selected', 'true');
    expect(within(studio).getByRole('button', { name: /Products/i })).toBeInTheDocument();
    expect(within(studio).getByRole('complementary', { name: 'Dynamic resource details' })).toHaveTextContent('Products');

    await user.click(within(studio).getByRole('tab', { name: /Relations/i }));
    expect(within(studio).getByText('No relations')).toBeInTheDocument();

    await user.click(within(modules).getByRole('button', { name: 'Queries' }));
    const queryStudio = screen.getByRole('region', { name: 'Dynamic Content Studio' });
    expect(within(queryStudio).getByRole('tab', { name: /Queries/i })).toHaveAttribute('aria-selected', 'true');
    expect(within(queryStudio).getByRole('button', { name: /Featured products/i })).toBeInTheDocument();
  });

  it('uses canonical forms filters and queries in the workflow studio', async () => {
    window.history.replaceState({}, '', '/editor');
    const user = userEvent.setup();
    render(<App initialProject={makeWorkflowProject()} preferencesRepository={new MemoryWorkspacePreferencesRepository()} />);

    const modules = screen.getByRole('navigation', { name: 'Studio modules' });
    await user.click(within(modules).getByRole('button', { name: 'Forms' }));

    const studio = screen.getByRole('region', { name: 'Forms Filters Workflow Studio' });
    expect(within(studio).getByRole('heading', { name: 'Forms, filters & workflow' })).toBeInTheDocument();
    expect(within(studio).getByRole('tab', { name: /Forms/i })).toHaveAttribute('aria-selected', 'true');
    expect(within(studio).getByRole('button', { name: /Contact form/i })).toBeInTheDocument();
    expect(within(studio).getByRole('main', { name: 'Workflow canvas' })).toHaveTextContent('conditions');
    expect(within(studio).getByRole('complementary', { name: 'Workflow details' })).toHaveTextContent('Featured products');

    await user.click(within(modules).getByRole('button', { name: 'Filters' }));
    const filterStudio = screen.getByRole('region', { name: 'Forms Filters Workflow Studio' });
    expect(within(filterStudio).getByRole('tab', { name: /Smart Filters/i })).toHaveAttribute('aria-selected', 'true');
    expect(within(filterStudio).getByRole('button', { name: /Product search/i })).toBeInTheDocument();
    expect(within(filterStudio).getByRole('main', { name: 'Workflow canvas' })).toHaveTextContent('featured_products');
  });

  it('uses canonical backend dashboards roles and users in the Backend Builder', async () => {
    window.history.replaceState({}, '', '/editor');
    const user = userEvent.setup();
    render(<App initialProject={makeBackendProject()} preferencesRepository={new MemoryWorkspacePreferencesRepository()} />);

    const navigation = screen.getByRole('navigation', { name: 'Primary workspaces' });
    await user.click(within(navigation).getByRole('button', { name: 'Backend' }));

    const backendStudio = screen.getByRole('region', { name: 'Backend and roles studio' });
    expect(within(backendStudio).getByRole('heading', { name: 'Backend Builder' })).toBeInTheDocument();
    expect(within(backendStudio).getByText('defaultDashboard')).toBeInTheDocument();
    expect(within(backendStudio).getByRole('tab', { name: 'Dashboards' })).toBeInTheDocument();
    expect(within(backendStudio).getByRole('tab', { name: 'Roles' })).toBeInTheDocument();
    expect(within(backendStudio).getByRole('tab', { name: 'Users' })).toBeInTheDocument();

    await user.click(within(backendStudio).getByRole('tab', { name: 'Roles' }));
    expect(within(backendStudio).getByRole('button', { name: /Manager/i })).toBeInTheDocument();
    expect(within(backendStudio).getByRole('complementary', { name: 'Backend resource details' })).toHaveTextContent('capabilities');

    await user.click(within(backendStudio).getByRole('tab', { name: 'Users' }));
    expect(within(backendStudio).getByRole('button', { name: /Alex Morgan/i })).toBeInTheDocument();
  });

  it('opens the canonical Roles studio from the editor module rail', async () => {
    window.history.replaceState({}, '', '/editor');
    const user = userEvent.setup();
    render(<App initialProject={makeBackendProject()} preferencesRepository={new MemoryWorkspacePreferencesRepository()} />);

    const modules = screen.getByRole('navigation', { name: 'Studio modules' });
    await user.click(within(modules).getByRole('button', { name: 'Roles' }));

    const studio = screen.getByRole('region', { name: 'Backend and roles studio' });
    expect(within(studio).getByRole('tab', { name: 'Roles' })).toHaveAttribute('aria-selected', 'true');
    expect(within(studio).getByRole('button', { name: /Manager/i })).toBeInTheDocument();
  });

  it('keeps Preview, Backend and Export in the real workspace navigation', async () => {
    window.history.replaceState({}, '', '/editor');
    const user = userEvent.setup();
    render(<App initialProject={makeProject()} preferencesRepository={new MemoryWorkspacePreferencesRepository()} />);

    const navigation = screen.getByRole('navigation', { name: 'Primary workspaces' });
    await user.click(within(navigation).getByRole('button', { name: 'Backend' }));
    expect(window.location.pathname).toBe('/backend');
    expect(screen.getByRole('heading', { name: 'Backend Builder' })).toBeInTheDocument();

    await user.click(within(navigation).getByRole('button', { name: 'Export' }));
    expect(window.location.pathname).toBe('/export');
    expect(screen.getAllByRole('heading', { name: 'Export workspace' }).length).toBeGreaterThan(0);
  });

  it('uses canonical layers for selection and exposes tabbed inspector surfaces', async () => {
    window.history.replaceState({}, '', '/editor');
    const user = userEvent.setup();
    render(<App initialProject={makeProject()} preferencesRepository={new MemoryWorkspacePreferencesRepository()} />);

    const canvasToolbar = screen.getByRole('toolbar', { name: 'Canvas commands' });
    await user.click(within(canvasToolbar).getByRole('button', { name: 'Insert container' }));
    await user.click(within(canvasToolbar).getByRole('button', { name: 'Layers' }));

    const layers = screen.getByRole('complementary', { name: 'Layers navigator' });
    const containerLayer = within(layers).getByRole('button', { name: 'Container 1' });
    await user.click(containerLayer);
    expect(containerLayer).toHaveAttribute('aria-pressed', 'true');

    const inspector = screen.getByRole('complementary', { name: 'Widget inspector' });
    expect(within(inspector).getByRole('tab', { name: 'Content' })).toHaveAttribute('aria-selected', 'true');
    await user.click(within(inspector).getByRole('tab', { name: 'Style' }));
    expect(within(inspector).getByRole('tabpanel', { name: 'Style inspector' })).toBeInTheDocument();
  });
});
