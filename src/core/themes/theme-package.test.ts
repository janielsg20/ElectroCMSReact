import { describe, expect, it } from 'vitest';
import { BUILTIN_PROJECT_THEMES } from './builtin-project-themes';
import {
  MAX_THEME_PACKAGE_BYTES,
  parseProjectThemePackage,
  serializeProjectThemePackage,
} from './theme-package';

describe('theme package format', () => {
  it('roundtrips a validated theme package', () => {
    const theme = BUILTIN_PROJECT_THEMES[0]!;
    const serialized = serializeProjectThemePackage(theme);
    const parsed = parseProjectThemePackage(serialized);

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.value.theme).toEqual(theme);
    expect(parsed.value.kind).toBe('electrocms-theme-package');
    expect(parsed.value.schemaVersion).toBe(1);
  });

  it('rejects malformed, future and invalid theme packages', () => {
    expect(parseProjectThemePackage('{bad').ok).toBe(false);

    const future = parseProjectThemePackage(JSON.stringify({
      schemaVersion: 99,
      kind: 'electrocms-theme-package',
      theme: BUILTIN_PROJECT_THEMES[0],
    }));
    expect(future.ok).toBe(false);
    if (!future.ok) expect(future.error.code).toBe('UNSUPPORTED_SCHEMA');

    const invalidTheme = parseProjectThemePackage(JSON.stringify({
      schemaVersion: 1,
      kind: 'electrocms-theme-package',
      theme: { id: 'bad', version: 1, scope: 'frontend', label: 'Bad', description: 'Bad', tokens: {} },
    }));
    expect(invalidTheme.ok).toBe(false);
    if (!invalidTheme.ok) expect(invalidTheme.error.code).toBe('INVALID_THEME');
  });

  it('rejects packages over the configured size ceiling', () => {
    const oversized = 'x'.repeat(MAX_THEME_PACKAGE_BYTES + 1);
    const result = parseProjectThemePackage(oversized);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('PACKAGE_TOO_LARGE');
  });
});
