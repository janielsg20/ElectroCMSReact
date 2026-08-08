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

  it('migrates legacy appearance preferences while preserving structural layout choices', () => {
    const normalized = normalizeWorkspacePreferences({
      schemaVersion: 1,
      navigationPosition: 'right',
      navigationWidth: 999,
      navigationCollapsed: true,
      navigationDisplayMode: 'labels',
      workspaceOrder: ['editor', 'preview'],
      density: 'comfortable',
      lastWorkspace: 'backend',
      editorThemeMode: 'dark',
      editorThemePresetId: 'developer-console',
    });

    expect(normalized.schemaVersion).toBe(2);
    expect(normalized.navigationPosition).toBe('right');
    expect(normalized.navigationWidth).toBe(344);
    expect(normalized.navigationCollapsed).toBe(true);
    expect(normalized.workspaceOrder).toEqual(['editor', 'preview', 'backend', 'export']);
    expect(normalized.navigationDisplayMode).toBe('both');
    expect(normalized.density).toBe('compact');
    expect(normalized).not.toHaveProperty('editorThemeMode');
    expect(normalized).not.toHaveProperty('editorThemePresetId');
  });

  it('persists structural workspace preferences independently from project data', () => {
    const repository = new BrowserWorkspacePreferencesRepository(localStorage, 'test:workspace-preferences');
    const preferences = createDefaultWorkspacePreferences();
    preferences.navigationPosition = 'right';
    preferences.navigationWidth = 312;
    preferences.navigationCollapsed = true;
    preferences.lastWorkspace = 'preview';

    repository.save(preferences);

    expect(repository.load()).toMatchObject({
      schemaVersion: 2,
      navigationPosition: 'right',
      navigationWidth: 312,
      navigationCollapsed: true,
      navigationDisplayMode: 'both',
      density: 'compact',
      lastWorkspace: 'preview',
    });
    const serialized = localStorage.getItem('test:workspace-preferences') ?? '';
    expect(serialized).not.toContain('editorTheme');
    expect(serialized).not.toContain('documents');
    expect(serialized).not.toContain('contentTypes');
  });

  it('keeps the fixed Bento Density layout contract on current payloads', () => {
    const defaults = createDefaultWorkspacePreferences();
    const normalized = normalizeWorkspacePreferences({
      ...defaults,
      navigationDisplayMode: 'icons',
      density: 'comfortable',
    });

    expect(normalized.navigationDisplayMode).toBe('both');
    expect(normalized.density).toBe('compact');
  });

  it('falls back to defaults when local storage is corrupted', () => {
    localStorage.setItem('test:corrupt', '{bad json');
    const repository = new BrowserWorkspacePreferencesRepository(localStorage, 'test:corrupt');

    expect(repository.load()).toEqual(createDefaultWorkspacePreferences());
  });
});
