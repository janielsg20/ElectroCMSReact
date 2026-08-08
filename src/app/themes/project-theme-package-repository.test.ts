import { beforeEach, describe, expect, it } from 'vitest';
import { BUILTIN_PROJECT_THEMES } from '../../core/themes';
import {
  BrowserProjectThemePackageRepository,
  MemoryProjectThemePackageRepository,
} from './project-theme-package-repository';

describe('project theme package repository', () => {
  beforeEach(() => localStorage.clear());

  it('persists imported themes with defensive copies', () => {
    const theme = {
      ...BUILTIN_PROJECT_THEMES[0]!,
      id: 'frontend.custom-local',
      label: 'Custom Local',
    };
    const repository = new BrowserProjectThemePackageRepository(localStorage, 'test:theme-library');
    repository.save([theme]);

    const first = repository.load();
    expect(first).toHaveLength(1);
    expect(first[0]?.id).toBe('frontend.custom-local');
    if (first[0]) first[0].label = 'Mutated';
    expect(repository.load()[0]?.label).toBe('Custom Local');
  });

  it('falls back to an empty library for corrupt or invalid storage', () => {
    localStorage.setItem('test:corrupt-themes', '{bad json');
    expect(new BrowserProjectThemePackageRepository(localStorage, 'test:corrupt-themes').load()).toEqual([]);

    localStorage.setItem('test:invalid-themes', JSON.stringify([{ id: 'bad' }]));
    expect(new BrowserProjectThemePackageRepository(localStorage, 'test:invalid-themes').load()).toEqual([]);
  });

  it('memory repository normalizes duplicate theme ids', () => {
    const theme = {
      ...BUILTIN_PROJECT_THEMES[0]!,
      id: 'frontend.memory-theme',
      label: 'Memory Theme',
    };
    const repository = new MemoryProjectThemePackageRepository([theme, theme]);
    expect(repository.load()).toHaveLength(1);
    repository.clear();
    expect(repository.load()).toEqual([]);
  });
});
