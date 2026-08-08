import { useProjectSession } from '../project/project-session-context';
import { useDocumentHistoryShortcuts } from '../project/use-document-history-shortcuts';
import type { WorkspaceId } from '../routing/workspaces';
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

const selectClass = 'ec-control ec-action h-8 min-w-0 border-0 bg-transparent px-2 text-[11px] font-semibold shadow-none';
const iconButtonClass = 'ec-control ec-focus-ring ec-action inline-grid size-8 shrink-0 place-items-center text-[var(--color-ec-text-muted)]';
const segmentButtonClass = 'ec-focus-ring ec-action grid size-7 place-items-center rounded-[var(--ec-radius-sm)] text-[var(--color-ec-text-muted)] disabled:cursor-not-allowed disabled:opacity-30';

export function AppHeader({ compactLayout, activeWorkspace, onOpenNavigation, onNavigate }: AppHeaderProps) {
  const session = useProjectSession();
  const activeDocument = session.project.documents[session.activeDocumentId];
  useDocumentHistoryShortcuts(session.undo, session.redo);

  return (
    <header className="app-header bento-topbar" data-testid="app-header">
      <div className="header-project">
        {compactLayout ? (
          <button className={iconButtonClass} type="button" aria-label="Open navigation" onClick={onOpenNavigation}>
            <Icon name="menu" size={16} />
          </button>
        ) : null}

        <div className="brand-mark" aria-hidden="true">
          <Icon name="bolt" size={16} />
        </div>

        <div className="project-identity">
          <div className="project-title-line">
            <strong className="project-name" title={session.project.name}>{session.project.name}</strong>
            <span className="project-mode">Bento Dense</span>
          </div>
          <span className="save-state" data-state={session.saveState}>
            <span className="save-dot" aria-hidden="true" />
            {saveLabels[session.saveState]}
          </span>
        </div>
      </div>

      <div className="header-controls" aria-label="Editor controls">
        <div className="header-control-group header-document-group">
          <span className="header-control-icon" aria-hidden="true"><Icon name="pages" size={12} /></span>
          <label className="compact-field shrink-0">
            <span className="sr-only">Active document</span>
            <select className={`${selectClass} min-w-[128px] max-w-[190px]`} aria-label="Active document" value={session.activeDocumentId} onChange={(event) => session.setActiveDocumentId(event.target.value)}>
              {session.project.documentOrder.map((documentId) => {
                const document = session.project.documents[documentId];
                return document ? <option key={document.id} value={document.id}>{document.name}</option> : null;
              })}
            </select>
          </label>
          <span className="header-divider" aria-hidden="true" />
          <span className="header-control-icon hidden sm:grid" aria-hidden="true"><Icon name="grid" size={12} /></span>
          <label className="compact-field breakpoint-field hidden shrink-0 sm:block">
            <span className="sr-only">Preview breakpoint</span>
            <select className={`${selectClass} min-w-[138px]`} aria-label="Preview breakpoint" value={session.activeBreakpointId} onChange={(event) => session.setActiveBreakpointId(event.target.value)}>
              {session.project.breakpoints.map((breakpoint) => <option key={breakpoint.id} value={breakpoint.id}>{breakpoint.label} · {breakpoint.width}px</option>)}
            </select>
          </label>
        </div>

        <div className="header-control-group" aria-label="Canvas zoom">
          <button className={segmentButtonClass} type="button" aria-label="Zoom out" disabled={session.zoom <= 50} onClick={() => session.setZoom(session.zoom - 10)}><Icon name="minus" size={13} /></button>
          <output className="header-zoom-output" aria-label="Zoom level">{session.zoom}%</output>
          <button className={segmentButtonClass} type="button" aria-label="Zoom in" disabled={session.zoom >= 200} onClick={() => session.setZoom(session.zoom + 10)}><Icon name="plus" size={13} /></button>
        </div>

        <div className="header-control-group" aria-label="Document history">
          <button className={segmentButtonClass} type="button" aria-label="Undo" disabled={!session.canUndo} title={session.canUndo ? 'Undo last document command' : 'Nothing to undo'} onClick={session.undo}><Icon name="undo" size={13} /></button>
          <button className={segmentButtonClass} type="button" aria-label="Redo" disabled={!session.canRedo} title={session.canRedo ? 'Redo last document command' : 'Nothing to redo'} onClick={session.redo}><Icon name="redo" size={13} /></button>
        </div>
      </div>

      <div className="header-actions">
        <button className="ec-focus-ring ec-action header-action-secondary" type="button" aria-pressed={activeWorkspace === 'preview'} onClick={() => onNavigate('preview')}>
          <Icon name="preview" size={13} />
          <span className="hidden sm:inline">Preview</span>
        </button>
        <button className="ec-focus-ring ec-action header-action-primary" type="button" aria-label="Export" aria-pressed={activeWorkspace === 'export'} onClick={() => onNavigate('export')}>
          <Icon name="export" size={13} />
          <span className="hidden sm:inline">Publish</span>
        </button>
      </div>

      <span className="sr-only" aria-live="polite">Active document: {activeDocument?.name ?? 'None'}. Zoom {session.zoom} percent.</span>
    </header>
  );
}
