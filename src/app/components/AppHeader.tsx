import { useProjectSession } from '../project/project-session-context';
import { useDocumentHistoryShortcuts } from '../project/use-document-history-shortcuts';
import type { WorkspaceId } from '../routing/workspaces';
import { useWorkspacePreferences } from '../workspace/workspace-preferences-store';
import { Icon, type IconName } from './Icon';

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

type AppearanceMode = 'light' | 'dark' | 'auto';

const appearanceModes: readonly { id: AppearanceMode; label: string; icon: IconName }[] = [
  { id: 'light', label: 'Light', icon: 'sun' },
  { id: 'dark', label: 'Dark', icon: 'moon' },
  { id: 'auto', label: 'System', icon: 'system' },
];

const selectClass = 'header-select min-w-0 bg-transparent px-2 text-[11px] font-semibold text-[var(--color-ec-text)] outline-none';
const iconButtonClass = 'header-icon-button ec-focus-ring group inline-grid size-8 shrink-0 place-items-center text-[var(--color-ec-text-muted)] hover:text-[var(--color-ec-text)] max-[720px]:size-11';
const segmentButtonClass = 'header-segment-button ec-focus-ring group grid size-7 place-items-center text-[var(--color-ec-text-muted)] transition-colors hover:bg-[var(--color-ec-surface-muted)] hover:text-[var(--color-ec-text)] disabled:cursor-not-allowed disabled:opacity-30';

export function AppHeader({ compactLayout, activeWorkspace, onOpenNavigation, onNavigate }: AppHeaderProps) {
  const session = useProjectSession();
  const { preferences, setEditorThemeMode } = useWorkspacePreferences();
  const activeDocument = session.project.documents[session.activeDocumentId];
  useDocumentHistoryShortcuts(session.undo, session.redo);

  return (
    <header className="app-header" data-testid="app-header">
      <div className="header-project">
        {compactLayout ? (
          <button className={iconButtonClass} type="button" aria-label="Open navigation" onClick={onOpenNavigation}>
            <Icon name="menu" size={17} />
          </button>
        ) : null}

        <div className="brand-mark" aria-hidden="true">
          <Icon name="bolt" size={16} />
        </div>

        <div className="project-identity">
          <div className="project-title-row">
            <strong className="project-name" title={session.project.name}>{session.project.name}</strong>
            <span className="project-local-label">Local</span>
          </div>
          <span className="save-state" data-state={session.saveState} role="status" aria-live="polite">
            <span
              className={`save-dot ${session.saveState === 'error' ? 'bg-[var(--color-ec-danger-600)]' : session.saveState === 'dirty' ? 'bg-[var(--color-ec-warning-600)]' : session.saveState === 'saving' ? 'bg-[var(--color-ec-violet-600)]' : 'bg-[var(--color-ec-success-600)]'}`}
              aria-hidden="true"
            />
            {saveLabels[session.saveState]}
          </span>
        </div>
      </div>

      <div className="header-controls" role="toolbar" aria-label="Editor controls">
        <div className="header-document-group" role="group" aria-label="Document and breakpoint">
          <span className="header-control-icon" aria-hidden="true"><Icon name="pages" size={14} /></span>
          <label className="compact-field header-document-field">
            <span className="sr-only">Active document</span>
            <select
              className={`${selectClass} header-document-select`}
              aria-label="Active document"
              value={session.activeDocumentId}
              onChange={(event) => session.setActiveDocumentId(event.target.value)}
            >
              {session.project.documentOrder.map((documentId) => {
                const document = session.project.documents[documentId];
                return document ? <option key={document.id} value={document.id}>{document.name}</option> : null;
              })}
            </select>
          </label>

          <span className="header-control-divider" aria-hidden="true" />

          <label className="compact-field breakpoint-field">
            <span className="sr-only">Preview breakpoint</span>
            <select
              className={`${selectClass} header-breakpoint-select`}
              aria-label="Preview breakpoint"
              value={session.activeBreakpointId}
              onChange={(event) => session.setActiveBreakpointId(event.target.value)}
            >
              {session.project.breakpoints.map((breakpoint) => (
                <option key={breakpoint.id} value={breakpoint.id}>{breakpoint.label} · {breakpoint.width}px</option>
              ))}
            </select>
          </label>
        </div>

        <div className="segmented-control zoom-control" role="group" aria-label="Canvas zoom">
          <button className={segmentButtonClass} type="button" aria-label="Zoom out" disabled={session.zoom <= 50} onClick={() => session.setZoom(session.zoom - 10)}>
            <Icon name="minus" size={13} />
          </button>
          <output className="header-zoom-output" aria-label="Zoom level">{session.zoom}%</output>
          <button className={segmentButtonClass} type="button" aria-label="Zoom in" disabled={session.zoom >= 200} onClick={() => session.setZoom(session.zoom + 10)}>
            <Icon name="plus" size={13} />
          </button>
        </div>

        <div className="segmented-control history-control" role="group" aria-label="Document history">
          <button className={segmentButtonClass} type="button" aria-label="Undo" disabled={!session.canUndo} title={session.canUndo ? 'Undo last document command' : 'Nothing to undo'} onClick={session.undo}>
            <Icon name="undo" size={13} />
          </button>
          <button className={segmentButtonClass} type="button" aria-label="Redo" disabled={!session.canRedo} title={session.canRedo ? 'Redo last document command' : 'Nothing to redo'} onClick={session.redo}>
            <Icon name="redo" size={13} />
          </button>
        </div>
      </div>

      <div className="header-actions">
        <div className="appearance-toggle" role="group" aria-label="Editor appearance">
          {appearanceModes.map((mode) => (
            <button
              key={mode.id}
              className={`appearance-toggle-button ${mode.id === 'auto' ? 'appearance-system' : ''}`}
              type="button"
              aria-label={`Use ${mode.label.toLowerCase()} appearance`}
              aria-pressed={preferences.editorThemeMode === mode.id}
              title={`${mode.label} appearance`}
              onClick={() => setEditorThemeMode(mode.id)}
            >
              <Icon name={mode.icon} size={14} />
              <span>{mode.label}</span>
            </button>
          ))}
        </div>

        <span className="header-actions-divider" aria-hidden="true" />

        <button
          className="header-preview-button ec-focus-ring group"
          type="button"
          aria-pressed={activeWorkspace === 'preview'}
          onClick={() => onNavigate('preview')}
        >
          <Icon name="preview" size={14} />
          <span>Preview</span>
        </button>

        <button
          className="header-publish-button ec-focus-ring group"
          type="button"
          aria-label="Export"
          aria-pressed={activeWorkspace === 'export'}
          onClick={() => onNavigate('export')}
        >
          <Icon name="export" size={14} />
          <span>Publish</span>
        </button>
      </div>

      <span className="sr-only">Active document: {activeDocument?.name ?? 'None'}. Zoom {session.zoom} percent.</span>
    </header>
  );
}
