import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { createCanonicalProject } from '../../core/project';
import { App } from '../App';
import { MemoryWorkspacePreferencesRepository } from '../workspace/workspace-preferences-repository';

function makeProject() {
  return createCanonicalProject({
    id: 'preview_publish_test',
    name: 'Preview Publish project',
    now: '2026-08-08T21:10:00.000Z',
    randomUuid: (() => {
      let sequence = 0;
      return () => `00000000-0000-4000-8000-${String(++sequence).padStart(12, '0')}`;
    })(),
  });
}

describe('UI-08 preview and publishing', () => {
  it('renders the active canonical document in read-only live preview and changes the real breakpoint', async () => {
    const project = makeProject();
    window.history.replaceState({}, '', '/editor');
    const user = userEvent.setup();
    render(<App initialProject={project} preferencesRepository={new MemoryWorkspacePreferencesRepository()} />);

    const navigation = screen.getByRole('navigation', { name: 'Primary workspaces' });
    await user.click(within(navigation).getByRole('button', { name: 'Preview' }));

    const preview = screen.getByRole('region', { name: 'Preview workspace' });
    expect(within(preview).getByRole('heading', { name: 'Preview workspace' })).toBeInTheDocument();
    expect(within(preview).getByRole('main', { name: 'Live document preview' })).toBeInTheDocument();
    const renderer = within(preview).getByTestId('canvas-renderer');
    expect(renderer).toHaveAttribute('data-document-id', project.documentOrder[0]);
    expect(renderer).not.toHaveAttribute('role', 'listbox');

    const nextBreakpoint = project.breakpoints[1];
    expect(nextBreakpoint).toBeDefined();
    await user.selectOptions(within(preview).getByLabelText('Preview device'), nextBreakpoint!.id);
    expect(renderer).toHaveAttribute('data-breakpoint-id', nextBreakpoint!.id);
    expect(within(preview).getByText('Document tree')).toBeInTheDocument();
    expect(within(preview).getByText('Widget previews')).toBeInTheDocument();
  });

  it('shows publishing destinations without simulating unavailable exporters', async () => {
    window.history.replaceState({}, '', '/editor');
    const user = userEvent.setup();
    render(<App initialProject={makeProject()} preferencesRepository={new MemoryWorkspacePreferencesRepository()} />);

    const header = screen.getByTestId('app-header');
    await user.click(within(header).getByRole('button', { name: 'Export' }));
    const publishing = screen.getByRole('region', { name: 'Export workspace' });
    expect(within(publishing).getByRole('heading', { name: 'Export workspace' })).toBeInTheDocument();
    expect(within(publishing).getByText('No simulated publishing')).toBeInTheDocument();
    expect(within(publishing).getByText('Exporter runtime')).toBeInTheDocument();

    for (const destination of ['Local', 'React', 'LAMP', 'WordPress']) {
      expect(within(publishing).getByRole('button', { name: `Configure ${destination} export` })).toBeDisabled();
    }
  });

  it('opens a functional command palette and routes existing Studio commands', async () => {
    window.history.replaceState({}, '', '/editor');
    const user = userEvent.setup();
    render(<App initialProject={makeProject()} preferencesRepository={new MemoryWorkspacePreferencesRepository()} />);

    await user.keyboard('{Control>}k{/Control}');
    const palette = screen.getByRole('dialog', { name: 'Command palette' });
    expect(within(palette).getByLabelText('Search commands')).toBeInTheDocument();
    expect(within(palette).getByText('Ctrl/⌘ Z')).toBeInTheDocument();

    await user.click(within(palette).getByRole('button', { name: /Settings/ }));
    const systems = screen.getByRole('region', { name: 'Global systems studio' });
    expect(within(systems).getByRole('tab', { name: 'Project' })).toHaveAttribute('aria-selected', 'true');
  });
});
