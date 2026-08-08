import type { ProjectThemeDefinition } from './theme-system';
import { validateProjectThemeDefinition } from './theme-system';

export const THEME_PACKAGE_SCHEMA_VERSION = 1 as const;
export const THEME_PACKAGE_KIND = 'electrocms-theme-package' as const;
export const MAX_THEME_PACKAGE_BYTES = 256 * 1024;

export interface ProjectThemePackage {
  schemaVersion: typeof THEME_PACKAGE_SCHEMA_VERSION;
  kind: typeof THEME_PACKAGE_KIND;
  theme: ProjectThemeDefinition;
}

export type ThemePackageErrorCode =
  | 'PACKAGE_TOO_LARGE'
  | 'INVALID_JSON'
  | 'INVALID_PACKAGE'
  | 'UNSUPPORTED_SCHEMA'
  | 'INVALID_THEME';

export interface ThemePackageError {
  code: ThemePackageErrorCode;
  message: string;
}

export type ThemePackageParseResult =
  | { ok: true; value: ProjectThemePackage }
  | { ok: false; error: ThemePackageError };

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export function createProjectThemePackage(theme: ProjectThemeDefinition): ProjectThemePackage {
  const validation = validateProjectThemeDefinition(theme);
  if (!validation.valid) {
    throw new Error(validation.issues.map((issue) => issue.message).join(' '));
  }
  return {
    schemaVersion: THEME_PACKAGE_SCHEMA_VERSION,
    kind: THEME_PACKAGE_KIND,
    theme: structuredClone(validation.value),
  };
}

export function serializeProjectThemePackage(theme: ProjectThemeDefinition): string {
  return JSON.stringify(createProjectThemePackage(theme), null, 2);
}

export function parseProjectThemePackage(text: string): ThemePackageParseResult {
  const size = new TextEncoder().encode(text).byteLength;
  if (size > MAX_THEME_PACKAGE_BYTES) {
    return {
      ok: false,
      error: {
        code: 'PACKAGE_TOO_LARGE',
        message: `Theme package exceeds the ${MAX_THEME_PACKAGE_BYTES} byte limit.`,
      },
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    return { ok: false, error: { code: 'INVALID_JSON', message: 'Theme package is not valid JSON.' } };
  }

  if (!isPlainObject(parsed)) {
    return {
      ok: false,
      error: { code: 'INVALID_PACKAGE', message: 'Theme package must be a JSON object.' },
    };
  }
  if (parsed.schemaVersion !== THEME_PACKAGE_SCHEMA_VERSION) {
    return {
      ok: false,
      error: {
        code: 'UNSUPPORTED_SCHEMA',
        message: `Expected theme package schemaVersion ${THEME_PACKAGE_SCHEMA_VERSION}.`,
      },
    };
  }
  if (parsed.kind !== THEME_PACKAGE_KIND) {
    return {
      ok: false,
      error: { code: 'INVALID_PACKAGE', message: `Expected package kind ${THEME_PACKAGE_KIND}.` },
    };
  }

  const themeValidation = validateProjectThemeDefinition(parsed.theme);
  if (!themeValidation.valid) {
    return {
      ok: false,
      error: {
        code: 'INVALID_THEME',
        message: themeValidation.issues.map((issue) => issue.message).join(' '),
      },
    };
  }

  return {
    ok: true,
    value: {
      schemaVersion: THEME_PACKAGE_SCHEMA_VERSION,
      kind: THEME_PACKAGE_KIND,
      theme: structuredClone(themeValidation.value),
    },
  };
}
