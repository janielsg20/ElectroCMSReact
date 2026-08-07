import {
  createDefaultWorkspacePreferences,
  normalizeWorkspacePreferences,
  type WorkspacePreferences,
} from './workspace-preferences';

export interface WorkspacePreferencesRepository {
  load(): WorkspacePreferences;
  save(preferences: WorkspacePreferences): void;
  clear(): void;
}

export const DEFAULT_WORKSPACE_PREFERENCES_KEY = 'electrocms:workspace-preferences:v1';

export class BrowserWorkspacePreferencesRepository implements WorkspacePreferencesRepository {
  constructor(
    private readonly storage: Storage = globalThis.localStorage,
    private readonly storageKey = DEFAULT_WORKSPACE_PREFERENCES_KEY,
  ) {}

  load(): WorkspacePreferences {
    try {
      const raw = this.storage.getItem(this.storageKey);
      if (!raw) return createDefaultWorkspacePreferences();
      return normalizeWorkspacePreferences(JSON.parse(raw) as unknown);
    } catch {
      return createDefaultWorkspacePreferences();
    }
  }

  save(preferences: WorkspacePreferences): void {
    this.storage.setItem(this.storageKey, JSON.stringify(normalizeWorkspacePreferences(preferences)));
  }

  clear(): void {
    this.storage.removeItem(this.storageKey);
  }
}

export class MemoryWorkspacePreferencesRepository implements WorkspacePreferencesRepository {
  private value: WorkspacePreferences;

  constructor(initial?: WorkspacePreferences) {
    this.value = structuredClone(initial ?? createDefaultWorkspacePreferences());
  }

  load(): WorkspacePreferences {
    return structuredClone(this.value);
  }

  save(preferences: WorkspacePreferences): void {
    this.value = structuredClone(normalizeWorkspacePreferences(preferences));
  }

  clear(): void {
    this.value = createDefaultWorkspacePreferences();
  }
}
