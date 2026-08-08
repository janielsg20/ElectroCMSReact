import { useProjectSession } from '../project/project-session-context';
import { useDocumentHistoryShortcuts } from '../project/use-document-history-shortcuts';
import type { WorkspaceId } from '../routing/workspaces';
import { EDITOR_THEME_PRESETS, type EditorThemePresetId } from '../workspace/editor-theme-presets';
import { useWorkspacePreferences } from '../workspace/workspace-preferences-store';
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

const selectClass = 'ec-control h-8 min-w-0 px-2.5 text-[11px] font-semibold';
const iconButtonClass = 'ec-control ec-focus-ring inline-grid size-8 shrink-0 place-items-center text-[var(--color-ec-text-muted)] hover:text-[var(--color-ec-text)]';
const segmentButtonClass = 'ec-focus-ring grid size-7 place-items-center rounded-[var(--ec-radius-sm)] text-[var(--color-ec-text-muted)] transition-colors hover:bg-[var(--color-ec-surface-muted)] hover:text-[var(--color-ec-text)] disabled:cursor-not-allowed disabled:opacity-30';

export function AppHeader({ compactLayout, activeWorkspace, onOpenNavigation, onNavigate }: AppHeaderProps) {
  const session = useProjectSession();
  const { preferences, setEditorThemeMode, setEditorThemePresetId } = useWorkspacePreferences();
  const activeDocument = session.project.documents[session.activeDocumentId];
  useDocumentHistoryShortcuts(session.undo, session.redo);

  return (
    <header
      className="app-header relative z-40 flex min-h-[54px] items-center gap-2 border-b border-[var(--color-ec-border)] bg-[color:var(--color-ec-surface)] px-2.5 shadow-[0_1px_0_rgb(16_19_18_/_0.03)]"
      data-testid="app-header"
    >
      <div className="header-project flex min-w-0 shrink-0 items-center gap-2.5 lg:w-[236px]">
        {compactLayout ? (
          <button className={iconButtonClass} type="button" aria-label="Open navigation" onClick={onOpenNavigation}>
            <Icon name="menu" size={16} />
          </button>
        ) : null}

        <div
          className="brand-mark grid size-8 shrink-0 place-items-center rounded-[var(--ec-radius-md)] bg-[var(--color-ec-chrome)] text-[var(--color-ec-accent)] shadow-sm"
          aria-hidden="true"
        >
          <Icon name="bolt" size={16} />
        </div>

        <div className="project-identity min-w-0 leading-tight">
          <div className="flex min-w-0 items-center gap-1.5">
            <strong
              className="project-name block truncate text-[12px] font-semibold tracking-[-.01em] text-[var(--color-ec-text)]"
              title={session.project.name}
            >
              {session.project.name}
            </strong>
            <span className="hidden text-[9px] font-semibold uppercase tracking-[.14em] text-[var(--color-ec-text-muted)] xl:inline">Local</span>
          </div>
          <span
            className="save-state mt-0.5 flex items-center gap-1.5 text-[9px] font-medium text-[var(--color-ec-text-muted)]"
            data-state={session.saveState}
          >
            <span
              className={`save-dot size-1.5 rounded-full ${session.saveState === 'error' ? 'bg-[var(--color-ec-danger-600)]' : session.saveState === 'dirty' ? 'bg-[var(--color-ec-warning-600)]' : session.saveState === 'saving' ? 'bg-[var(--color-ec-violet-600)]' : 'bg-[var(--color-ec-success-600)]'}`}
              aria-hidden="true"
            />
            {saveLabels[session.saveState]}
          </span>
        </div>
      </div>

      <div
        className="header-controls flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Editor controls"
      >
        <div className="flex h-9 shrink-0 items-center gap-1 rounded-[var(--ec-radius-md)] border border-[var(--color-ec-border)] bg-[var(--color-ec-surface-subtle)] p-0.5">
          <label className="compact-field shrink-0">
            <span className="sr-only">Active document</span>
            <select
              className={`${selectClass} min-w-[126px] max-w-[190px] border-0 bg-transparent shadow-none`}
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

          <span className="h-4 w-px bg-[var(--color-ec-border)]" aria-hidden="true" />

          <label className="compact-field breakpoint-field hidden shrink-0 sm:block">
            <span className="sr-only">Preview breakpoint</span>
            <select
              className={`${selectClass} min-w-[138px] border-0 bg-transparent shadow-none`}
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

        <div
          className="segmented-control zoom-control flex h-8 shrink-0 items-center rounded-[var(--ec-radius-md)] border border-[var(--color-ec-border)] bg-[var(--color-ec-surface)] p-0.5"
          aria-label="Canvas zoom"
        >
          <button className={segmentButtonClass} type="button" aria-label="Zoom out" disabled={session.zoom <= 50} onClick={() => session.setZoom(session.zoom - 10)}>
            <Icon name="minus" size={13} />
          </button>
          <output className="min-w-11 px-1 text-center text-[10px] font-semibold tabular-nums text-[var(--color-ec-text)]" aria-label="Zoom level">{session.zoom}%</output>
          <button className={segmentButtonClass} type="button" aria-label="Zoom in" disabled={session.zoom >= 200} onClick={() => session.setZoom(session.zoom + 10)}>
            <Icon name="plus" size={13} />
          </button>
        </div>

        <div
          className="segmented-control history-control flex h-8 shrink-0 items-center rounded-[var(--ec-radius-md)] border border-[var(--color-ec-border)] bg-[var(--color-ec-surface)] p-0.5"
          aria-label="Document history"
        >
          <button className={segmentButtonClass} type="button" aria-label="Undo" disabled={!session.canUndo} title={session.canUndo ? 'Undo last document command' : 'Nothing to undo'} onClick={session.undo}>
            <Icon name="undo" size={13} />
          </button>
          <button className={segmentButtonClass} type="button" aria-label="Redo" disabled={!session.canRedo} title={session.canRedo ? 'Redo last document command' : 'Nothing to redo'} onClick={session.redo}>
            <Icon name="redo" size={13} />
          </button>
        </div>

        <div className="hidden h-8 shrink-0 items-center gap-1 rounded-[var(--ec-radius-md)] border border-[var(--color-ec-border)] bg-[var(--color-ec-surface)] p-0.5 lg:flex">
          <label className="compact-field theme-field hidden shrink-0 xl:block">
            <span className="sr-only">Editor theme preset</span>
            <select
              className={`${selectClass} max-w-[150px] border-0 bg-transparent shadow-none`}
              aria-label="Editor theme preset"
              value={preferences.editorThemePresetId}
              onChange={(event) => setEditorThemePresetId(event.target.value as EditorThemePresetId)}
            >
              {EDITOR_THEME_PRESETS.map((preset) => <option key={preset.id} value={preset.id}>{preset.label}</option>)}
            </select>
          </label>

          <label className="compact-field theme-field shrink-0">
            <span className="sr-only">Editor theme mode</span>
            <select
              className={`${selectClass} border-0 bg-transparent shadow-none`}
              aria-label="Editor theme mode"
              value={preferences.editorThemeMode}
              onChange={(event) => setEditorThemeMode(event.target.value as 'light' | 'dark' | 'auto')}
            >
              <option value="auto">Auto</option>
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </label>
        </div>
      </div>

      <div className="header-actions ml-auto flex shrink-0 items-center gap-1">
        <button
          className="ec-focus-ring inline-flex h-8 items-center gap-1.5 rounded-[var(--ec-radius-md)] px-2.5 text-[10px] font-semibold text-[var(--color-ec-text-muted)] transition-colors hover:bg-[var(--color-ec-surface-muted)] hover:text-[var(--color-ec-text)]"
          type="button"
          aria-pressed={activeWorkspace === 'preview'}
          onClick={() => onNavigate('preview')}
        >
          <Icon name="preview" size={13} />
          <span className="hidden sm:inline">Preview</span>
        </button>
        <button
          className="ec-focus-ring inline-flex h-8 items-center gap-1.5 rounded-[var(--ec-radius-md)] bg-[var(--color-ec-accent)] px-3 text-[10px] font-semibold text-white shadow-sm transition-[filter,transform] hover:brightness-95 active:translate-y-px"
          type="button"
          aria-label="Export"
          aria-pressed={activeWorkspace === 'export'}
          onClick={() => onNavigate('export')}
        >
          <Icon name="export" size={13} />
          <span className="hidden sm:inline">Publish</span>
        </button>
      </div>

      <span className="sr-only" aria-live="polite">Active document: {activeDocument?.name ?? 'None'}. Zoom {session.zoom} percent.</span>
    </header>
  );
}
