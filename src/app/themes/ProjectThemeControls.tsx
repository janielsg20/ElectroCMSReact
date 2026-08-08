import { useState, type CSSProperties } from 'react';
import { isJsonObject } from '../../core/domain';
import type { JsonObject } from '../../core/domain';
import type { ProjectThemeScope } from '../../core/themes';
import { useProjectSession } from '../project/project-session-context';
import { ProjectThemePackageTransfer } from './ProjectThemePackageTransfer';
import { ProjectThemeTokenEditor } from './ProjectThemeTokenEditor';
import {
  useProjectThemePackageLibrary,
  type ThemeLibraryMutationOutcome,
} from './project-theme-package-library-context';
import { useProjectThemeRegistry } from './project-theme-registry-context';
import './project-theme-controls.css';

export interface ProjectThemeControlsProps {
  scope: ProjectThemeScope;
}

interface PackageStatus {
  tone: 'success' | 'error';
  message: string;
}

function tokenString(tokens: JsonObject, group: string, name: string, fallback: string): string {
  const tokenGroup = tokens[group];
  if (!isJsonObject(tokenGroup)) return fallback;
  const value = tokenGroup[name];
  return typeof value === 'string' ? value : fallback;
}

function tokenNumber(tokens: JsonObject, group: string, name: string, fallback: number): number {
  const tokenGroup = tokens[group];
  if (!isJsonObject(tokenGroup)) return fallback;
  const value = tokenGroup[name];
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export function ProjectThemeControls({ scope }: ProjectThemeControlsProps) {
  const session = useProjectSession();
  const registry = useProjectThemeRegistry();
  const packageLibrary = useProjectThemePackageLibrary();
  const [packageStatus, setPackageStatus] = useState<PackageStatus | null>(null);
  const themeId = scope === 'frontend' ? session.project.frontendThemeId : session.project.backendThemeId;
  const themes = registry.list(scope);
  const theme = registry.get(themeId, scope) ?? themes[0] ?? null;
  const fieldLabel = scope === 'frontend' ? 'Frontend theme' : 'Backend theme';
  const imported = theme ? packageLibrary.importedThemeIds.includes(theme.id) : false;

  const previewStyle = theme
    ? ({
        '--theme-preview-background': tokenString(theme.tokens, 'color', 'background', '#f4f6f8'),
        '--theme-preview-surface': tokenString(theme.tokens, 'color', 'surface', '#ffffff'),
        '--theme-preview-text': tokenString(theme.tokens, 'color', 'text', '#111827'),
        '--theme-preview-muted': tokenString(theme.tokens, 'color', 'muted', '#64748b'),
        '--theme-preview-accent': tokenString(theme.tokens, 'color', 'accent', '#2563eb'),
        '--theme-preview-font': tokenString(theme.tokens, 'typography', 'fontFamily', 'system-ui, sans-serif'),
        '--theme-preview-radius': `${tokenNumber(theme.tokens, 'shape', 'radius', 8)}px`,
      } as CSSProperties)
    : undefined;

  const handleDuplicate = () => {
    if (!theme) return;
    const result = packageLibrary.duplicateTheme(theme.id);
    if (!result.ok) {
      setPackageStatus({ tone: 'error', message: result.message });
      return;
    }
    setPackageStatus({
      tone: 'success',
      message: `Created editable ${result.themeId} at version ${result.version}. Select it from the list to edit.`,
    });
  };

  const handleThemeMutation = (result: ThemeLibraryMutationOutcome) => {
    setPackageStatus(
      result.ok
        ? { tone: 'success', message: `Saved ${result.themeId} as version ${result.version}.` }
        : { tone: 'error', message: result.message },
    );
  };

  return (
    <section className="project-theme-controls" data-theme-scope={scope} aria-label={`${fieldLabel} settings`}>
      <div className="project-theme-controls-copy">
        <span className="project-theme-controls-eyebrow">Project theme package</span>
        <h3>{fieldLabel}</h3>
        <p>{theme?.description ?? 'No compatible theme package is registered.'}</p>
        {theme ? (
          <span className="project-theme-origin">
            {imported ? 'Imported' : 'Built-in'} · {theme.id} · v{theme.version}
          </span>
        ) : null}
      </div>

      <div className="project-theme-management">
        <label className="project-theme-select">
          <span>{fieldLabel}</span>
          <select
            aria-label={fieldLabel}
            value={themeId}
            onChange={(event) => session.setProjectTheme(scope, event.target.value)}
          >
            {themes.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.label} · v{candidate.version}
              </option>
            ))}
          </select>
        </label>

        <div className="project-theme-package-actions" aria-label={`${fieldLabel} theme actions`}>
          <button type="button" onClick={handleDuplicate} disabled={!theme}>
            Duplicate to edit
          </button>
        </div>

        <span
          className="project-theme-package-status"
          data-tone={packageStatus?.tone ?? 'idle'}
          aria-live="polite"
        >
          {packageStatus?.message ?? 'Built-ins are immutable. Duplicate one to create a versioned local theme.'}
        </span>
      </div>

      {theme ? (
        <div className="project-theme-preview" style={previewStyle} data-project-theme-id={theme.id}>
          <div className="project-theme-preview-bar">
            <span>{scope === 'frontend' ? 'Site preview tokens' : 'Admin preview tokens'}</span>
            <code>v{theme.version}</code>
          </div>
          <div className="project-theme-preview-surface">
            <span className="project-theme-preview-kicker">{theme.label}</span>
            <strong>{scope === 'frontend' ? 'Content surface' : 'Dashboard surface'}</strong>
            <span>Semantic colors, typography, shape and density resolve from this package.</span>
            <span className="project-theme-preview-action">Accent token</span>
          </div>
        </div>
      ) : null}

      {theme && imported ? (
        <ProjectThemeTokenEditor
          key={`${theme.id}@${theme.version}`}
          theme={theme}
          library={packageLibrary}
          onMutation={handleThemeMutation}
        />
      ) : null}

      {theme ? <ProjectThemePackageTransfer theme={theme} /> : null}
    </section>
  );
}
