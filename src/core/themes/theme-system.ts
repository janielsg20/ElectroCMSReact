import { isJsonObject, type JsonObject } from '../domain';

export type ProjectThemeScope = 'frontend' | 'backend';

export interface ProjectThemeDefinition {
  id: string;
  version: number;
  scope: ProjectThemeScope;
  label: string;
  description: string;
  tokens: JsonObject;
}

export interface ProjectThemeValidationIssue {
  code:
    | 'INVALID_ID'
    | 'INVALID_VERSION'
    | 'INVALID_SCOPE'
    | 'INVALID_LABEL'
    | 'INVALID_DESCRIPTION'
    | 'INVALID_TOKENS';
  message: string;
}

export type ProjectThemeValidation =
  | { valid: true; value: ProjectThemeDefinition }
  | { valid: false; issues: readonly ProjectThemeValidationIssue[] };

const THEME_ID_PATTERN = /^(frontend|backend)\.[a-z0-9]+(?:-[a-z0-9]+)*$/;

function cloneTheme(theme: ProjectThemeDefinition): ProjectThemeDefinition {
  return structuredClone(theme);
}

export function validateProjectThemeDefinition(input: unknown): ProjectThemeValidation {
  const issues: ProjectThemeValidationIssue[] = [];
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    return {
      valid: false,
      issues: [{ code: 'INVALID_TOKENS', message: 'Theme definition must be an object.' }],
    };
  }

  const value = input as Record<string, unknown>;
  const id = typeof value.id === 'string' ? value.id.trim() : '';
  const scope = value.scope;
  const label = typeof value.label === 'string' ? value.label.trim() : '';
  const description = typeof value.description === 'string' ? value.description.trim() : '';

  if (!THEME_ID_PATTERN.test(id)) {
    issues.push({
      code: 'INVALID_ID',
      message: 'Theme id must use frontend.* or backend.* with kebab-case segments.',
    });
  }
  if (!Number.isInteger(value.version) || Number(value.version) < 1) {
    issues.push({ code: 'INVALID_VERSION', message: 'Theme version must be a positive integer.' });
  }
  if (scope !== 'frontend' && scope !== 'backend') {
    issues.push({ code: 'INVALID_SCOPE', message: 'Theme scope must be frontend or backend.' });
  } else if (id && !id.startsWith(`${scope}.`)) {
    issues.push({ code: 'INVALID_SCOPE', message: `Theme id ${id} does not match ${scope} scope.` });
  }
  if (!label) issues.push({ code: 'INVALID_LABEL', message: 'Theme label is required.' });
  if (!description) {
    issues.push({ code: 'INVALID_DESCRIPTION', message: 'Theme description is required.' });
  }
  if (!isJsonObject(value.tokens)) {
    issues.push({ code: 'INVALID_TOKENS', message: 'Theme tokens must be a JSON object.' });
  }

  if (issues.length > 0 || (scope !== 'frontend' && scope !== 'backend') || !isJsonObject(value.tokens)) {
    return { valid: false, issues };
  }

  return {
    valid: true,
    value: {
      id,
      version: Number(value.version),
      scope,
      label,
      description,
      tokens: structuredClone(value.tokens),
    },
  };
}

export class ProjectThemeRegistry {
  readonly #themes = new Map<string, ProjectThemeDefinition>();

  constructor(definitions: readonly ProjectThemeDefinition[] = []) {
    for (const definition of definitions) this.register(definition);
  }

  register(definition: ProjectThemeDefinition): void {
    const validation = validateProjectThemeDefinition(definition);
    if (!validation.valid) {
      throw new Error(validation.issues.map((issue) => issue.message).join(' '));
    }
    if (this.#themes.has(validation.value.id)) {
      throw new Error(`Theme ${validation.value.id} is already registered.`);
    }
    this.#themes.set(validation.value.id, cloneTheme(validation.value));
  }

  has(id: string, scope?: ProjectThemeScope): boolean {
    const theme = this.#themes.get(id);
    return Boolean(theme && (scope === undefined || theme.scope === scope));
  }

  get(id: string, scope?: ProjectThemeScope): ProjectThemeDefinition | null {
    const theme = this.#themes.get(id);
    if (!theme || (scope !== undefined && theme.scope !== scope)) return null;
    return cloneTheme(theme);
  }

  list(scope?: ProjectThemeScope): ProjectThemeDefinition[] {
    return [...this.#themes.values()]
      .filter((theme) => scope === undefined || theme.scope === scope)
      .map(cloneTheme)
      .sort((a, b) => a.label.localeCompare(b.label));
  }
}
