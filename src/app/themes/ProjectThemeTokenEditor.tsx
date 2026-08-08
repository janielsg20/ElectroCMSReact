import { useEffect, useState, type FormEvent } from 'react';
import { isJsonObject, type JsonObject } from '../../core/domain';
import type { ProjectThemeDefinition } from '../../core/themes';
import type {
  ProjectThemePackageLibraryState,
  ThemeLibraryMutationOutcome,
} from './project-theme-package-library-context';

export interface ProjectThemeTokenEditorProps {
  theme: ProjectThemeDefinition;
  library: ProjectThemePackageLibraryState;
  onMutation(result: ThemeLibraryMutationOutcome): void;
}

interface ThemeDraft {
  label: string;
  description: string;
  background: string;
  surface: string;
  text: string;
  muted: string;
  accent: string;
  radius: string;
  spacingBase: string;
}

function objectGroup(tokens: JsonObject, key: string): JsonObject {
  const value = tokens[key];
  return isJsonObject(value) ? value : {};
}

function stringToken(tokens: JsonObject, group: string, key: string, fallback: string): string {
  const value = objectGroup(tokens, group)[key];
  return typeof value === 'string' ? value : fallback;
}

function numberToken(tokens: JsonObject, group: string, key: string, fallback: number): number {
  const value = objectGroup(tokens, group)[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function draftFromTheme(theme: ProjectThemeDefinition): ThemeDraft {
  return {
    label: theme.label,
    description: theme.description,
    background: stringToken(theme.tokens, 'color', 'background', '#ffffff'),
    surface: stringToken(theme.tokens, 'color', 'surface', '#ffffff'),
    text: stringToken(theme.tokens, 'color', 'text', '#111827'),
    muted: stringToken(theme.tokens, 'color', 'muted', '#64748b'),
    accent: stringToken(theme.tokens, 'color', 'accent', '#2563eb'),
    radius: String(numberToken(theme.tokens, 'shape', 'radius', 8)),
    spacingBase: String(numberToken(theme.tokens, 'spacing', 'base', 8)),
  };
}

function finiteNumber(value: string, fallback: number, min: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function buildTokens(theme: ProjectThemeDefinition, draft: ThemeDraft): JsonObject {
  const color = objectGroup(theme.tokens, 'color');
  const shape = objectGroup(theme.tokens, 'shape');
  const spacing = objectGroup(theme.tokens, 'spacing');
  return {
    ...structuredClone(theme.tokens),
    color: {
      ...structuredClone(color),
      background: draft.background.trim(),
      surface: draft.surface.trim(),
      text: draft.text.trim(),
      muted: draft.muted.trim(),
      accent: draft.accent.trim(),
    },
    shape: {
      ...structuredClone(shape),
      radius: finiteNumber(draft.radius, numberToken(theme.tokens, 'shape', 'radius', 8), 0, 64),
    },
    spacing: {
      ...structuredClone(spacing),
      base: finiteNumber(draft.spacingBase, numberToken(theme.tokens, 'spacing', 'base', 8), 2, 32),
    },
  };
}

export function ProjectThemeTokenEditor({
  theme,
  library,
  onMutation,
}: ProjectThemeTokenEditorProps) {
  const [draft, setDraft] = useState<ThemeDraft>(() => draftFromTheme(theme));

  useEffect(() => {
    setDraft(draftFromTheme(theme));
  }, [theme.id, theme.version, theme]);

  const update = <K extends keyof ThemeDraft>(key: K, value: ThemeDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onMutation(
      library.updateImportedTheme(theme.id, {
        label: draft.label,
        description: draft.description,
        tokens: buildTokens(theme, draft),
      }),
    );
  };

  return (
    <form className="project-theme-token-editor" onSubmit={handleSubmit}>
      <div className="project-theme-token-editor-header">
        <div>
          <span>Editable local theme</span>
          <strong>Version {theme.version}</strong>
        </div>
        <button type="submit">Save as v{theme.version + 1}</button>
      </div>

      <label className="project-theme-token-field project-theme-token-field--wide">
        <span>Theme label</span>
        <input
          aria-label="Theme label"
          value={draft.label}
          onChange={(event) => update('label', event.target.value)}
        />
      </label>

      <label className="project-theme-token-field project-theme-token-field--wide">
        <span>Description</span>
        <textarea
          aria-label="Theme description"
          rows={2}
          value={draft.description}
          onChange={(event) => update('description', event.target.value)}
        />
      </label>

      <div className="project-theme-token-grid" aria-label="Theme visual tokens">
        {([
          ['background', 'Background'],
          ['surface', 'Surface'],
          ['text', 'Text'],
          ['muted', 'Muted'],
          ['accent', 'Accent'],
        ] as const).map(([key, label]) => (
          <label className="project-theme-token-field" key={key}>
            <span>{label}</span>
            <div className="project-theme-color-input">
              <span aria-hidden="true" style={{ background: draft[key] }} />
              <input
                aria-label={`${label} token`}
                value={draft[key]}
                onChange={(event) => update(key, event.target.value)}
              />
            </div>
          </label>
        ))}
        <label className="project-theme-token-field">
          <span>Radius</span>
          <input
            aria-label="Radius token"
            inputMode="decimal"
            value={draft.radius}
            onChange={(event) => update('radius', event.target.value)}
          />
        </label>
        <label className="project-theme-token-field">
          <span>Base spacing</span>
          <input
            aria-label="Base spacing token"
            inputMode="decimal"
            value={draft.spacingBase}
            onChange={(event) => update('spacingBase', event.target.value)}
          />
        </label>
      </div>
    </form>
  );
}
