import type { WorkspaceId } from '../routing/workspaces';
import { useProjectSession } from '../project/project-session';
import { useWorkspacePreferences } from '../workspace/workspace-preferences-context';
import { Icon } from './Icon';

export interface AppHeaderProps {
  compactLayout: boolean;
  activeWorkspace: WorkspaceId;
  onOpenNavigation(): void;
  onNavigate(workspaceId: WorkspaceId): void;
}

const saveLabels = {
  saved: 'Saved locally',
  dirty: 'Unsaved changes',
  saving: 'Saving…',
  error: 'Save error',
} as const;

export function AppHeader({
  compactLayout,
  activeWorkspace,
  onOpenNavigation,
  onNavigate,
}: AppHeaderProps) {
  const session = useProjectSession();
  const { preferences, setEditorThemeMode } = useWorkspacePreferences();
  const activeDocument = session.project.documents[session.activeDocumentId];

  return (
    <header className="app-header" data-testid="app-header">
      <div className="header-project">
        {compactLayout ? (
          <button
            className="icon-button header-menu-button"
            type="button"
            aria-label="Open navigation"
            onClick={onOpenNavigation}
          >
            <Icon name="menu" />
          </button>
        ) : null}
        <div className="brand-mark" aria-hidden="true">
          <Icon name="bolt" size={15} />
        </div>
        <div className="project-identity">
          <strong className="project-name" title={session.project.name}>
            {session.project.name}
          </strong>
          <span className="save-state" data-state={session.saveState}>
            <span className="save-dot" aria-hidden="true" />
            {saveLabels[session.saveState]}
          </span>
        </div>
      </div>

      <div className="header-controls" aria-label="Editor controls">
        <label className="compact-field">
          <span className="sr-only">Active document</span>
          <select
            aria-label="Active document"
            value={session.activeDocumentId}
            onChange={(event) => session.setActiveDocumentId(event.target.value)}
          >
            {session.project.documentOrder.map((documentId) => {
              const document = session.project.documents[documentId];
              return document ? (
                <option key={document.id} value={document.id}>
                  {document.name}
                </option>
              ) : null;
            })}
          </select>
        </label>

        <label className="compact-field breakpoint-field">
          <span className="sr-only">Preview breakpoint</span>
          <select
            aria-label="Preview breakpoint"
            value={session.activeBreakpointId}
            onChange={(event) => session.setActiveBreakpointId(event.target.value)}
          >
            {session.project.breakpoints.map((breakpoint) => (
              <option key={breakpoint.id} value={breakpoint.id}>
                {breakpoint.label} · {breakpoint.width}px
              </option>
            ))}
          </select>
        </label>

        <div className="segmented-control zoom-control" aria-label="Canvas zoom">
          <button
            type="button"
            aria-label="Zoom out"
            disabled={session.zoom <= 50}
            onClick={() => session.setZoom(session.zoom - 10)}
          >
            <Icon name="minus" size={14} />
          </button>
          <output aria-label="Zoom level">{session.zoom}%</output>
          <button
            type="button"
            aria-label="Zoom in"
            disabled={session.zoom >= 200}
            onClick={() => session.setZoom(session.zoom + 10)}
          >
            <Icon name="plus" size={14} />
          </button>
        </div>

        <div className="segmented-control history-control" aria-label="Document history">
          <button type="button" aria-label="Undo" disabled={!session.canUndo} title="Nothing to undo">
            <Icon name="undo" size={14} />
          </button>
          <button type="button" aria-label="Redo" disabled={!session.canRedo} title="Nothing to redo">
            <Icon name="redo" size={14} />
          </button>
        </div>

        <label className="compact-field theme-field">
          <span className="sr-only">Editor theme mode</span>
          <select
            aria-label="Editor theme mode"
            value={preferences.editorThemeMode}
            onChange={(event) =>
              setEditorThemeMode(event.target.value as 'light' | 'dark' | 'auto')
            }
          >
            <option value="auto">Theme: Auto</option>
            <option value="dark">Theme: Dark</option>
            <option value="light">Theme: Light</option>
          </select>
        </label>
      </div>

      <div className="header-actions">
        <span className="local-badge" title="Project data remains on this device">
          <Icon name="local" size={14} />
          <span>Local</span>
        </span>
        <button
          className="toolbar-button"
          type="button"
          aria-pressed={activeWorkspace === 'preview'}
          onClick={() => onNavigate('preview')}
        >
          Preview
        </button>
        <button
          className="toolbar-button toolbar-button-primary"
          type="button"
          aria-pressed={activeWorkspace === 'export'}
          onClick={() => onNavigate('export')}
        >
          Export
        </button>
      </div>

      <span className="sr-only" aria-live="polite">
        Active document: {activeDocument?.name ?? 'None'}. Zoom {session.zoom} percent.
      </span>
    </header>
  );
}
