import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { createCanonicalProject } from '../core/project';
import { App } from './App';
import { MemoryWorkspacePreferencesRepository } from './workspace/workspace-preferences-repository';

function makeProject() {
  return createCanonicalProject({
    id: 'project_shell_test',
    name: 'Shell test project',
    now: '2026-08-07T20:00:00.000Z',
    randomUuid: (() => {
      let sequence = 0;
      return () => `00000000-0000-4000-8000-${String(++sequence).padStart(12, '0')}`;
    })(),
  });
}

describe('ElectroCMS editor shell', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/editor');
  });

  it('navigates between workspaces without resetting project session state', async () => {
    const user = userEvent.setup();
    const preferencesRepository = new MemoryWorkspacePreferencesRepository();
    render(<App initialProject={makeProject()} preferencesRepository={preferencesRepository} />);

    expect(screen.getByRole('heading', { name: 'Editor workspace' })).toBeInTheDocument();
    expect(screen.getByText('Shell test project', { selector: '.project-name' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Zoom in' }));
    expect(screen.getByLabelText('Zoom level')).toHaveTextContent('110%');

    const navigation = screen.getByRole('navigation', { name: 'Primary workspaces' });
    await user.click(within(navigation).getByRole('button', { name: 'Preview' }));

    expect(window.location.pathname).toBe('/preview');
    expect(screen.getByRole('heading', { name: 'Preview workspace' })).toBeInTheDocument();
    expect(screen.getByLabelText('Zoom level')).toHaveTextContent('110%');
  });

  it('persists editor theme mode through the workspace preference repository', async () => {
    const user = userEvent.setup();
    const preferencesRepository = new MemoryWorkspacePreferencesRepository();
    const { container } = render(
      <App initialProject={makeProject()} preferencesRepository={preferencesRepository} />,
    );

    await user.selectOptions(screen.getByLabelText('Editor theme mode'), 'dark');

    expect(container.querySelector('.electrocms-app')).toHaveAttribute('data-theme', 'dark');
    expect(preferencesRepository.load().editorThemeMode).toBe('dark');
  });

  it('activates undo and redo after a reversible document command', async () => {
    const user = userEvent.setup();
    render(
      <App
        initialProject={makeProject()}
        preferencesRepository={new MemoryWorkspacePreferencesRepository()}
      />,
    );

    const undo = screen.getByRole('button', { name: 'Undo' });
    const redo = screen.getByRole('button', { name: 'Redo' });
    expect(undo).toBeDisabled();
    expect(redo).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Insert container' }));
    expect(screen.getAllByText('core/container').length).toBeGreaterThan(0);
    expect(undo).toBeEnabled();
    expect(redo).toBeDisabled();

    await user.click(undo);
    expect(screen.queryByText('core/container')).not.toBeInTheDocument();
    expect(undo).toBeDisabled();
    expect(redo).toBeEnabled();

    await user.click(redo);
    expect(screen.getAllByText('core/container').length).toBeGreaterThan(0);
    expect(undo).toBeEnabled();
    expect(redo).toBeDisabled();
  });
});
