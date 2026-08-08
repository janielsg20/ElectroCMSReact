import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { createCanonicalProject } from '../../../core/project';
import { App } from '../../App';
import { MemoryWorkspacePreferencesRepository } from '../../workspace/workspace-preferences-repository';

function makeProject() {
  return createCanonicalProject({
    id: 'builder_professional_test',
    name: 'Builder professional project',
    now: '2026-08-08T23:00:00.000Z',
    randomUuid: (() => {
      let sequence = 0;
      return () => `00000000-0000-4000-8000-${String(++sequence).padStart(12, '0')}`;
    })(),
  });
}

describe('professional Builder layers', () => {
  it('searches renames locks hides and reorders through canonical commands', async () => {
    window.history.replaceState({}, '', '/editor');
    const user = userEvent.setup();
    render(<App initialProject={makeProject()} preferencesRepository={new MemoryWorkspacePreferencesRepository()} />);

    const toolbar = screen.getByRole('toolbar', { name: 'Canvas commands' });
    await user.click(within(toolbar).getByRole('button', { name: 'Insert container' }));
    await user.click(within(toolbar).getByRole('button', { name: 'Insert container' }));
    await user.click(within(toolbar).getByRole('button', { name: 'Layers' }));

    const layers = screen.getByRole('complementary', { name: 'Layers navigator' });
    const search = within(layers).getByLabelText('Search layers');
    await user.type(search, 'Container 2');
    expect(within(layers).queryByRole('button', { name: 'Container 1' })).not.toBeInTheDocument();
    expect(within(layers).getByRole('button', { name: 'Container 2' })).toBeInTheDocument();

    await user.clear(search);
    await user.click(within(layers).getByRole('button', { name: 'Container 1' }));
    await user.click(within(layers).getByRole('button', { name: 'Rename Container 1' }));
    const renameInput = within(layers).getByRole('textbox', { name: 'Layer name for Container 1' });
    await user.clear(renameInput);
    await user.type(renameInput, 'Primary container{Enter}');
    expect(within(layers).getByRole('button', { name: 'Primary container' })).toBeInTheDocument();

    await user.click(within(layers).getByRole('button', { name: 'Lock Primary container' }));
    expect(within(layers).getByRole('button', { name: 'Unlock Primary container' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(within(layers).getByRole('button', { name: 'Hide Primary container' }));
    expect(within(layers).getByRole('button', { name: 'Show Primary container' })).toHaveAttribute('aria-pressed', 'true');

    const moveSecondUp = within(layers).getByRole('button', { name: 'Move Container 2 up' });
    expect(moveSecondUp).toBeEnabled();
    await user.click(moveSecondUp);
    expect(within(layers).getByRole('button', { name: 'Move Container 2 up' })).toBeDisabled();
  });
});
