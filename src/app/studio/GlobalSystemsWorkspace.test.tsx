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
  it('opens the canonical theme package controls from Themes', async () => {
    window.history.replaceState({}, '', '/editor');
    const user = userEvent.setup();
    render(<App initialProject={makeProject()} preferencesRepository={new MemoryWorkspacePreferencesRepository()} />);

    const modules = screen.getByRole('navigation', { name: 'Studio modules' });
    await user.click(within(modules).getByRole('button', { name: 'Themes' }));

    const studio = screen.getByRole('region', { name: 'Global systems studio' });
    expect(within(studio).getByRole('heading', { name: 'Themes, blueprints & settings' })).toBeInTheDocument();
    expect(within(studio).getByRole('tab', { name: 'Themes' })).toHaveAttribute('aria-selected', 'true');
    expect(within(studio).getByLabelText('Frontend theme')).toBeInTheDocument();
    expect(within(studio).getByLabelText('Backend theme')).toBeInTheDocument();
  });

  it('opens Blueprints without pretending an application runtime exists', async () => {
    window.history.replaceState({}, '', '/editor');
    const user = userEvent.setup();
    render(<App initialProject={makeProject()} preferencesRepository={new MemoryWorkspacePreferencesRepository()} />);

    const modules = screen.getByRole('navigation', { name: 'Studio modules' });
    await user.click(within(modules).getByRole('button', { name: 'Blueprints' }));

    const studio = screen.getByRole('region', { name: 'Global systems studio' });
    expect(within(studio).getByRole('tab', { name: 'Blueprints' })).toHaveAttribute('aria-selected', 'true');
    expect(within(studio).getByText('Online Store')).toBeInTheDocument();
    expect(within(studio).getByText('Tattoo Studio')).toBeInTheDocument();
    for (const button of within(studio).getAllByRole('button', { name: 'Apply' })) {
      expect(button).toBeDisabled();
    }
  });

  it('uses real workspace preferences from Settings and keeps project data canonical', async () => {
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

    await user.click(within(studio).getByRole('tab', { name: 'Editor' }));
    await user.selectOptions(within(studio).getByLabelText('Global editor theme mode'), 'dark');
    await user.selectOptions(within(studio).getByLabelText('Global workspace density'), 'comfortable');
    await user.selectOptions(within(studio).getByLabelText('Global editor preset'), 'developer-console');

    const app = document.querySelector('.electrocms-app');
    expect(app).toHaveAttribute('data-theme-mode', 'dark');
    expect(app).toHaveAttribute('data-density', 'comfortable');
    expect(app).toHaveAttribute('data-editor-preset', 'developer-console');
  });
});
