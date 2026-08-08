import { describe, expect, it } from 'vitest';
import { BUILTIN_PROJECT_THEMES } from './builtin-project-themes';
import { ProjectThemeRegistry, validateProjectThemeDefinition } from './theme-system';

describe('project theme system', () => {
  it('registers and lists built-in themes by independent scope', () => {
    const registry = new ProjectThemeRegistry(BUILTIN_PROJECT_THEMES);
    const frontend = registry.list('frontend');
    const backend = registry.list('backend');

    expect(frontend.length).toBeGreaterThanOrEqual(8);
    expect(backend.length).toBeGreaterThanOrEqual(7);
    expect(frontend.every((theme) => theme.id.startsWith('frontend.'))).toBe(true);
    expect(backend.every((theme) => theme.id.startsWith('backend.'))).toBe(true);
    expect(registry.has('frontend.minimal-clean', 'frontend')).toBe(true);
    expect(registry.has('frontend.minimal-clean', 'backend')).toBe(false);
    expect(registry.has('backend.high-density', 'backend')).toBe(true);
  });

  it('returns defensive copies so consumers cannot mutate registry definitions', () => {
    const registry = new ProjectThemeRegistry(BUILTIN_PROJECT_THEMES);
    const first = registry.get('frontend.minimal-clean', 'frontend');
    if (!first) throw new Error('Expected built-in frontend theme.');
    first.tokens.color = { background: 'mutated' };

    const second = registry.get('frontend.minimal-clean', 'frontend');
    expect(second?.tokens.color).not.toEqual({ background: 'mutated' });
  });

  it('rejects invalid ids, scope mismatches and non-json tokens', () => {
    const result = validateProjectThemeDefinition({
      id: 'frontend.Bad Theme',
      version: 0,
      scope: 'backend',
      label: '',
      description: '',
      tokens: new Date(),
    });

    expect(result.valid).toBe(false);
    if (result.valid) return;
    const codes = result.issues.map((issue) => issue.code);
    expect(codes).toContain('INVALID_ID');
    expect(codes).toContain('INVALID_VERSION');
    expect(codes).toContain('INVALID_SCOPE');
    expect(codes).toContain('INVALID_LABEL');
    expect(codes).toContain('INVALID_DESCRIPTION');
    expect(codes).toContain('INVALID_TOKENS');
  });

  it('rejects duplicate registrations', () => {
    const theme = BUILTIN_PROJECT_THEMES[0]!;
    const registry = new ProjectThemeRegistry([theme]);
    expect(() => registry.register(theme)).toThrow(/already registered/i);
  });
});
