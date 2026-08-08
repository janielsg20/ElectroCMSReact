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
    render(
      <App
        initialProject={makeProject()}
        preferencesRepository={new MemoryWorkspacePreferencesRepository()}
      />,
    );

    const modules = screen.getByRole('navigation', { name: 'Studio modules' });
    expect(within(modules).getByRole('button', { name: 'Builder' })).toBeInTheDocument();
    expect(screen.getByRole('complementary', { name: 'Insert library' })).toBeInTheDocument();
    expect(screen.getByTestId('editor-canvas')).toBeInTheDocument();

    await user.click(within(modules).getByRole('button', { name: 'Pages' }));
    expect(screen.getByRole('heading', { name: 'Pages' })).toBeInTheDocument();
    expect(screen.getByText('Display conditions')).toBeInTheDocument();

    await user.click(within(modules).getByRole('button', { name: 'Builder' }));
    expect(screen.getByTestId('editor-canvas')).toBeInTheDocument();
  });

  it('keeps Preview, Backend and Export in the real workspace navigation', async () => {
    window.history.replaceState({}, '', '/editor');
    const user = userEvent.setup();
    render(
      <App
        initialProject={makeProject()}
        preferencesRepository={new MemoryWorkspacePreferencesRepository()}
      />,
    );

    const navigation = screen.getByRole('navigation', { name: 'Primary workspaces' });
    await user.click(within(navigation).getByRole('button', { name: 'Backend' }));
    expect(window.location.pathname).toBe('/backend');
    expect(screen.getByRole('heading', { name: 'Backend Builder' })).toBeInTheDocument();

    await user.click(within(navigation).getByRole('button', { name: 'Export' }));
    expect(window.location.pathname).toBe('/export');
    expect(screen.getByRole('heading', { name: 'Build & Export' })).toBeInTheDocument();
  });
});
