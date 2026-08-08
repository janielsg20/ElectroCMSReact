import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { createCanonicalProject } from '../../core/project';
import { App } from '../App';
import { MemoryWorkspacePreferencesRepository } from '../workspace/workspace-preferences-repository';

function makeProject() {
  return createCanonicalProject({
    id: 'global_systems_test',
    name: 'Global Systems project',
    now: '2026-08-08T20:52:00.000Z',
    randomUuid: (() => {
      let sequence = 0;
      return () => `00000000-0000-4000-8000-${String(++sequence).padStart(12, '0')}`;
    })(),
  });
}

describe('GlobalSystemsWorkspace', () => {
  it('opens canonical site-design package controls without exposing application UI themes', async () => {
    window.history.replaceState({}, '', '/editor');
    const user = userEvent.setup();
    render(<App initialProject={makeProject()} preferencesRepository={new MemoryWorkspacePreferencesRepository()} />);

    const modules = screen.getByRole('navigation', { name: 'Studio modules' });
    await user.click(within(modules).getByRole('button', { name: 'Site Design' }));

    const studio = screen.getByRole('region', { name: 'Global systems studio' });
    expect(within(studio).getByRole('heading', { name: 'Site design, blueprints & settings' })).toBeInTheDocument();
    expect(within(studio).getByRole('tab', { name: 'Site Design' })).toHaveAttribute('aria-selected', 'true');
    expect(within(studio).getByLabelText('Frontend theme')).toBeInTheDocument();
    expect(within(studio).getByLabelText('Backend theme')).toBeInTheDocument();
    expect(within(studio).queryByLabelText('Global editor theme mode')).not.toBeInTheDocument();
    expect(within(studio).queryByLabelText('Global editor preset')).not.toBeInTheDocument();
  });

  it('opens Blueprints as an explicit catalog without pretending an application runtime exists', async () => {
    window.history.replaceState({}, '', '/editor');
    const user = userEvent.setup();
    render(<App initialProject={makeProject()} preferencesRepository={new MemoryWorkspacePreferencesRepository()} />);

    const modules = screen.getByRole('navigation', { name: 'Studio modules' });
    await user.click(within(modules).getByRole('button', { name: 'Blueprints' }));

    const studio = screen.getByRole('region', { name: 'Global systems studio' });
    expect(within(studio).getByRole('tab', { name: 'Blueprints' })).toHaveAttribute('aria-selected', 'true');
    expect(within(studio).getByText('Online Store')).toBeInTheDocument();
    expect(within(studio).getByText('Tattoo Studio')).toBeInTheDocument();
    expect(within(studio).getAllByText('Catalog only').length).toBeGreaterThan(1);
    expect(within(studio).queryByRole('button', { name: 'Apply' })).not.toBeInTheDocument();
    expect(within(studio).getByLabelText(/Catalog only\. Blueprint application is not available/i)).toBeInTheDocument();
  });

  it('shows project state and the fixed Bento Density interface contract from Settings', async () => {
    window.history.replaceState({}, '', '/editor');
    const user = userEvent.setup();
    render(<App initialProject={makeProject()} preferencesRepository={new MemoryWorkspacePreferencesRepository()} />);

    const modules = screen.getByRole('navigation', { name: 'Studio modules' });
    await user.click(within(modules).getByRole('button', { name: 'Settings' }));

    const studio = screen.getByRole('region', { name: 'Global systems studio' });
    expect(within(studio).getByRole('tab', { name: 'Project' })).toHaveAttribute('aria-selected', 'true');
    expect(within(studio).getByText('Global Systems project')).toBeInTheDocument();
    expect(within(studio).getByText('global_systems_test')).toBeInTheDocument();

    await user.click(within(studio).getByRole('tab', { name: 'Storage' }));
    expect(within(studio).getByText('Save state')).toBeInTheDocument();
    expect(within(studio).getByText('Revision')).toBeInTheDocument();

    await user.click(within(studio).getByRole('tab', { name: 'Interface' }));
    expect(within(studio).getByText('Bento Density')).toBeInTheDocument();
    expect(within(studio).getByText('Responsive by default')).toBeInTheDocument();

    const app = document.querySelector('.electrocms-app');
    expect(app).toHaveAttribute('data-ui-theme', 'bento-density');
    expect(app).toHaveAttribute('data-density', 'compact');
    expect(app).not.toHaveAttribute('data-editor-preset');
    expect(app).not.toHaveAttribute('data-theme-mode');
  });
});
