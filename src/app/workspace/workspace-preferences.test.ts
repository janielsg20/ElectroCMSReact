import { beforeEach, describe, expect, it } from 'vitest';
import {
  createDefaultWorkspacePreferences,
  normalizeWorkspacePreferences,
} from './workspace-preferences';
import { BrowserWorkspacePreferencesRepository } from './workspace-preferences-repository';

describe('workspace preferences', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('normalizes invalid layout data without accepting incomplete workspace orders', () => {
    const normalized = normalizeWorkspacePreferences({
      schemaVersion: 1,
      navigationPosition: 'right',
      navigationWidth: 999,
      navigationCollapsed: true,
      navigationDisplayMode: 'icons',
      workspaceOrder: ['editor', 'preview'],
      density: 'comfortable',
      lastWorkspace: 'backend',
      editorThemeMode: 'dark',
    });

    expect(normalized.navigationPosition).toBe('right');
    expect(normalized.navigationWidth).toBe(360);
    expect(normalized.navigationCollapsed).toBe(true);
    expect(normalized.workspaceOrder).toEqual(['editor', 'preview', 'backend', 'export']);
    expect(normalized.editorThemeMode).toBe('dark');
  });

  it('persists editor workspace preferences independently from project data', () => {
    const repository = new BrowserWorkspacePreferencesRepository(localStorage, 'test:workspace-preferences');
    const preferences = createDefaultWorkspacePreferences();
    preferences.navigationPosition = 'right';
    preferences.navigationWidth = 312;
    preferences.navigationCollapsed = true;
    preferences.lastWorkspace = 'preview';
    preferences.editorThemeMode = 'dark';

    repository.save(preferences);

    expect(repository.load()).toMatchObject({
      navigationPosition: 'right',
      navigationWidth: 312,
      navigationCollapsed: true,
      lastWorkspace: 'preview',
      editorThemeMode: 'dark',
    });
    const serialized = localStorage.getItem('test:workspace-preferences') ?? '';
    expect(serialized).not.toContain('documents');
    expect(serialized).not.toContain('contentTypes');
  });

  it('falls back to defaults when local storage is corrupted', () => {
    localStorage.setItem('test:corrupt', '{bad json');
    const repository = new BrowserWorkspacePreferencesRepository(localStorage, 'test:corrupt');

    expect(repository.load()).toEqual(createDefaultWorkspacePreferences());
  });
});
