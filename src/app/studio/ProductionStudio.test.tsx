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

  it('keeps Preview, Backend and Export in the real workspace navigation', async () => {
    window.history.replaceState({}, '', '/editor');
    const user = userEvent.setup();
    render(<App initialProject={makeProject()} preferencesRepository={new MemoryWorkspacePreferencesRepository()} />);

    const navigation = screen.getByRole('navigation', { name: 'Primary workspaces' });
    await user.click(within(navigation).getByRole('button', { name: 'Backend' }));
    expect(window.location.pathname).toBe('/backend');
    expect(screen.getAllByRole('heading', { name: 'Backend workspace' }).length).toBeGreaterThan(0);

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