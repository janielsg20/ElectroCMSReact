import { useEffect, useRef, useState } from 'react';
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

const iconButtonClass = 'header-icon-button ec-focus-ring group inline-grid size-8 shrink-0 place-items-center text-[var(--color-ec-text-muted)] hover:text-[var(--color-ec-text)] max-[720px]:size-11';
const segmentButtonClass = 'header-segment-button ec-focus-ring group grid size-7 place-items-center text-[var(--color-ec-text-muted)] transition-colors hover:bg-[var(--color-ec-surface-muted)] hover:text-[var(--color-ec-text)] disabled:cursor-not-allowed disabled:opacity-30';

function breakpointIcon(width: number): IconName {
  if (width >= 1100) return 'desktop';
  if (width >= 700) return 'tablet';
  return 'mobile';
}

export function AppHeader({ compactLayout, activeWorkspace, onOpenNavigation, onNavigate }: AppHeaderProps) {
  const session = useProjectSession();
  const { preferences, setEditorThemeMode } = useWorkspacePreferences();
  const [pageMenuOpen, setPageMenuOpen] = useState(false);
  const pageMenuRef = useRef<HTMLDivElement>(null);
  const pageTriggerRef = useRef<HTMLButtonElement>(null);
  const activeDocument = session.project.documents[session.activeDocumentId];
  useDocumentHistoryShortcuts(session.undo, session.redo);

  useEffect(() => {
    if (!pageMenuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && !pageMenuRef.current?.contains(target)) {
        setPageMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      setPageMenuOpen(false);
      pageTriggerRef.current?.focus();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [pageMenuOpen]);

  const focusPageOption = (index: number) => {
    const options = [...(pageMenuRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]') ?? [])];
    if (options.length === 0) return;
    const nextIndex = (index + options.length) % options.length;
    options[nextIndex]?.focus();
  };

  const openPageMenuAndFocus = (index: number) => {
    setPageMenuOpen(true);
    requestAnimationFrame(() => focusPageOption(index));
  };

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
          <div className="header-page-picker" ref={pageMenuRef}>
            <button
              ref={pageTriggerRef}
              className="header-page-trigger ec-focus-ring"
              type="button"
              aria-label="Active document"
              aria-haspopup="listbox"
              aria-expanded={pageMenuOpen}
              aria-controls="header-page-menu"
              onClick={() => setPageMenuOpen((open) => !open)}
              onKeyDown={(event) => {
                if (event.key === 'ArrowDown') {
                  event.preventDefault();
                  openPageMenuAndFocus(0);
                }
                if (event.key === 'ArrowUp') {
                  event.preventDefault();
                  openPageMenuAndFocus(-1);
                }
              }}
            >
              <span className="header-control-icon" aria-hidden="true"><Icon name="pages" size={14} /></span>
              <span className="header-page-name">{activeDocument?.name ?? 'No page'}</span>
              <Icon name="arrow-down" size={12} className="header-page-chevron" />
            </button>

            {pageMenuOpen ? (
              <div id="header-page-menu" className="header-page-menu" role="listbox" aria-label="Pages">
                <div className="header-menu-label">Pages</div>
                <div className="header-page-options">
                  {session.project.documentOrder.map((documentId, index) => {
                    const document = session.project.documents[documentId];
                    if (!document) return null;
                    const selected = document.id === session.activeDocumentId;
                    return (
                      <button
                        key={document.id}
                        className="header-page-option ec-focus-ring"
                        type="button"
                        role="option"
                        aria-selected={selected}
                        onClick={() => {
                          session.setActiveDocumentId(document.id);
                          setPageMenuOpen(false);
                          pageTriggerRef.current?.focus();
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'ArrowDown') {
                            event.preventDefault();
                            focusPageOption(index + 1);
                          } else if (event.key === 'ArrowUp') {
                            event.preventDefault();
                            focusPageOption(index - 1);
                          } else if (event.key === 'Home') {
                            event.preventDefault();
                            focusPageOption(0);
                          } else if (event.key === 'End') {
                            event.preventDefault();
                            focusPageOption(session.project.documentOrder.length - 1);
                          }
                        }}
                      >
                        <span className="header-page-option-icon" aria-hidden="true"><Icon name="pages" size={13} /></span>
                        <span className="header-page-option-name">{document.name}</span>
                        {selected ? <Icon name="check" size={13} className="header-page-option-check" /> : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>

          <span className="header-control-divider" aria-hidden="true" />

          <div className="header-breakpoint-picker" role="group" aria-label="Preview breakpoint">
            {session.project.breakpoints.map((breakpoint) => (
              <button
                key={breakpoint.id}
                className="header-breakpoint-button ec-focus-ring"
                type="button"
                aria-label={`${breakpoint.label} breakpoint ${breakpoint.width}px`}
                aria-pressed={session.activeBreakpointId === breakpoint.id}
                title={`${breakpoint.label} · ${breakpoint.width}px`}
                onClick={() => session.setActiveBreakpointId(breakpoint.id)}
              >
                <Icon name={breakpointIcon(breakpoint.width)} size={14} />
                <span className="header-breakpoint-width">{breakpoint.width}</span>
              </button>
            ))}
          </div>
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
