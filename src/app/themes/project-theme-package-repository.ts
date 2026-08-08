import {
  parseProjectThemePackage,
  serializeProjectThemePackage,
  validateProjectThemeDefinition,
  type ProjectThemeDefinition,
} from '../../core/themes';

export const DEFAULT_PROJECT_THEME_LIBRARY_KEY = 'electrocms:project-theme-packages:v1';

export interface ProjectThemePackageRepository {
  load(): ProjectThemeDefinition[];
  save(themes: readonly ProjectThemeDefinition[]): void;
  clear(): void;
}

function normalizeImportedThemes(input: unknown): ProjectThemeDefinition[] {
  if (!Array.isArray(input)) return [];
  const result: ProjectThemeDefinition[] = [];
  const ids = new Set<string>();

  for (const entry of input) {
    const validation = validateProjectThemeDefinition(entry);
    if (!validation.valid || ids.has(validation.value.id)) continue;
    ids.add(validation.value.id);
    result.push(structuredClone(validation.value));
  }

  return result;
}

export class BrowserProjectThemePackageRepository implements ProjectThemePackageRepository {
  constructor(
    private readonly storage: Storage = globalThis.localStorage,
    private readonly storageKey = DEFAULT_PROJECT_THEME_LIBRARY_KEY,
  ) {}

  load(): ProjectThemeDefinition[] {
    try {
      const raw = this.storage.getItem(this.storageKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as unknown;
      return normalizeImportedThemes(parsed);
    } catch {
      return [];
    }
  }

  save(themes: readonly ProjectThemeDefinition[]): void {
    const normalized = normalizeImportedThemes(themes);
    this.storage.setItem(this.storageKey, JSON.stringify(normalized));
  }

  clear(): void {
    this.storage.removeItem(this.storageKey);
  }
}

export class MemoryProjectThemePackageRepository implements ProjectThemePackageRepository {
  private value: ProjectThemeDefinition[];

  constructor(initial: readonly ProjectThemeDefinition[] = []) {
    this.value = normalizeImportedThemes(initial);
  }

  load(): ProjectThemeDefinition[] {
    return structuredClone(this.value);
  }

  save(themes: readonly ProjectThemeDefinition[]): void {
    this.value = normalizeImportedThemes(themes);
  }

  clear(): void {
    this.value = [];
  }
}

export function importSerializedThemePackage(text: string): ProjectThemeDefinition | null {
  const parsed = parseProjectThemePackage(text);
  return parsed.ok ? structuredClone(parsed.value.theme) : null;
}

export function exportSerializedThemePackage(theme: ProjectThemeDefinition): string {
  return serializeProjectThemePackage(theme);
}
