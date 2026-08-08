import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { createCanonicalProject } from '../../core/project';
import { App } from '../App';
import { MemoryWorkspacePreferencesRepository } from '../workspace/workspace-preferences-repository';

function makeProject() {
  return createCanonicalProject({
    id: 'editor_module_route_test',
    name: 'Editor module route project',
    now: '2026-08-08T22:30:00.000Z',
    randomUuid: (() => {
      let sequence = 0;
      return () => `00000000-0000-4000-8000-${String(++sequence).padStart(12, '0')}`;
    })(),
  });
}

describe('editor module navigation', () => {
  it('hydrates the requested editor module directly from a deep link', () => {
    window.history.replaceState({}, '', '/editor/content');
    render(<App initialProject={makeProject()} preferencesRepository={new MemoryWorkspacePreferencesRepository()} />);

    expect(screen.getByRole('heading', { name: 'Dynamic Content Studio' })).toBeInTheDocument();
    const modules = screen.getByRole('navigation', { name: 'Studio modules' });
    expect(within(modules).getByRole('button', { name: 'Content' })).toHaveAttribute('data-active', 'true');
    expect(window.location.pathname).toBe('/editor/content');
  });

  it('writes module selection to the canonical editor URL', async () => {
    window.history.replaceState({}, '', '/editor');
    const user = userEvent.setup();
    render(<App initialProject={makeProject()} preferencesRepository={new MemoryWorkspacePreferencesRepository()} />);

    const modules = screen.getByRole('navigation', { name: 'Studio modules' });
    await user.click(within(modules).getByRole('button', { name: 'Forms' }));

    expect(window.location.pathname).toBe('/editor/forms');
    expect(screen.getByRole('heading', { name: 'Forms, filters & workflow' })).toBeInTheDocument();
  });
});
