import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { App } from '../App';
import { createInitialProject } from '../../core/project';
import { MemoryWorkspacePreferencesRepository } from '../workspace/workspace-preferences-repository';

function renderSettings() {
  window.history.replaceState({}, '', '/editor/settings');
  render(
    <App
      initialProject={createInitialProject({ name: 'Global Test' })}
      preferencesRepository={new MemoryWorkspacePreferencesRepository()}
    />,
  );
  return screen.getByRole('region', { name: 'Global systems studio' });
}

describe('GlobalSystemsWorkspace', () => {
  it('reads canonical project data and keeps project theme controls connected', async () => {
    const studio = renderSettings();
    const user = userEvent.setup();

    await user.click(within(studio).getByRole('tab', { name: 'Project' }));
    expect(within(studio).getByText('Canonical project')).toBeInTheDocument();
    expect(within(studio).getByText('Global Test')).toBeInTheDocument();

    await user.click(within(studio).getByRole('tab', { name: 'Themes' }));
    expect(within(studio).getByRole('region', { name: 'Frontend theme controls' })).toBeInTheDocument();
    expect(within(studio).getByRole('region', { name: 'Backend theme controls' })).toBeInTheDocument();
  });

  it('keeps blueprint capability honest while exposing the catalog', async () => {
    const studio = renderSettings();
    const user = userEvent.setup();

    await user.click(within(studio).getByRole('tab', { name: 'Blueprints' }));
    expect(within(studio).getByText('Online Store')).toBeInTheDocument();
    expect(within(studio).getAllByText('Catalog only').length).toBeGreaterThan(1);
  });

  it('changes editor-only appearance and density without exposing a visual preset selector', async () => {
    const studio = renderSettings();
    const user = userEvent.setup();

    await user.click(within(studio).getByRole('tab', { name: 'Editor' }));
    await user.selectOptions(within(studio).getByLabelText('Global editor theme mode'), 'dark');
    await user.selectOptions(within(studio).getByLabelText('Global workspace density'), 'comfortable');

    expect(within(studio).getByLabelText('Unified editor visual system')).toHaveTextContent('Studio Pro');
    expect(within(studio).queryByLabelText('Global editor preset')).not.toBeInTheDocument();

    const app = document.querySelector('.electrocms-app');
    expect(app).toHaveAttribute('data-theme-mode', 'dark');
    expect(app).toHaveAttribute('data-density', 'comfortable');
    expect(app).toHaveAttribute('data-editor-preset', 'studio-pro');
  });
});
