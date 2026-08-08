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

const controlClass = 'h-8 rounded-lg border border-slate-200/90 bg-white px-2.5 text-[12px] font-medium text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800';
const iconButtonClass = 'inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-slate-200/90 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-35 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white';

export function AppHeader({ compactLayout, activeWorkspace, onOpenNavigation, onNavigate }: AppHeaderProps) {
  const session = useProjectSession();
  const { preferences, setEditorThemeMode, setEditorThemePresetId } = useWorkspacePreferences();
  const activeDocument = session.project.documents[session.activeDocumentId];
  useDocumentHistoryShortcuts(session.undo, session.redo);

  return (
    <header
      className="app-header relative z-40 flex min-h-[52px] items-center gap-2 border-b border-slate-200/80 bg-white/95 px-2.5 shadow-[0_1px_2px_rgba(15,23,42,.03)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95"
      data-testid="app-header"
    >
      <div className="header-project flex min-w-0 items-center gap-2.5 lg:w-[230px] lg:shrink-0">
        {compactLayout ? (
          <button className={iconButtonClass} type="button" aria-label="Open navigation" onClick={onOpenNavigation}>
            <Icon name="menu" size={16} />
          </button>
        ) : null}
        <div className="brand-mark grid size-8 shrink-0 place-items-center rounded-[10px] bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-600/20" aria-hidden="true">
          <Icon name="bolt" size={16} />
        </div>
        <div className="project-identity min-w-0 leading-tight">
          <strong className="project-name block truncate text-[13px] font-semibold tracking-[-.01em] text-slate-900 dark:text-white" title={session.project.name}>{session.project.name}</strong>
          <span className="save-state mt-0.5 flex items-center gap-1.5 text-[10px] font-medium text-slate-500 dark:text-slate-400" data-state={session.saveState}>
            <span className={`save-dot size-1.5 rounded-full ${session.saveState === 'error' ? 'bg-rose-500' : session.saveState === 'dirty' ? 'bg-amber-500' : session.saveState === 'saving' ? 'bg-blue-500' : 'bg-emerald-500'}`} aria-hidden="true" />
            {saveLabels[session.saveState]}
          </span>
        </div>
      </div>

      <div className="header-controls flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Editor controls">
        <label className="compact-field shrink-0">
          <span className="sr-only">Active document</span>
          <select className={`${controlClass} min-w-[128px] max-w-[190px]`} aria-label="Active document" value={session.activeDocumentId} onChange={(event) => session.setActiveDocumentId(event.target.value)}>
            {session.project.documentOrder.map((documentId) => {
              const document = session.project.documents[documentId];
              return document ? <option key={document.id} value={document.id}>{document.name}</option> : null;
            })}
          </select>
        </label>

        <label className="compact-field breakpoint-field hidden shrink-0 sm:block">
          <span className="sr-only">Preview breakpoint</span>
          <select className={`${controlClass} min-w-[132px]`} aria-label="Preview breakpoint" value={session.activeBreakpointId} onChange={(event) => session.setActiveBreakpointId(event.target.value)}>
            {session.project.breakpoints.map((breakpoint) => <option key={breakpoint.id} value={breakpoint.id}>{breakpoint.label} · {breakpoint.width}px</option>)}
          </select>
        </label>

        <div className="segmented-control zoom-control flex h-8 shrink-0 items-center rounded-lg border border-slate-200/90 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-900" aria-label="Canvas zoom">
          <button className="grid size-7 place-items-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 disabled:opacity-30 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white" type="button" aria-label="Zoom out" disabled={session.zoom <= 50} onClick={() => session.setZoom(session.zoom - 10)}><Icon name="minus" size={13} /></button>
          <output className="min-w-11 px-1 text-center text-[11px] font-semibold tabular-nums text-slate-600 dark:text-slate-300" aria-label="Zoom level">{session.zoom}%</output>
          <button className="grid size-7 place-items-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 disabled:opacity-30 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white" type="button" aria-label="Zoom in" disabled={session.zoom >= 200} onClick={() => session.setZoom(session.zoom + 10)}><Icon name="plus" size={13} /></button>
        </div>

        <div className="segmented-control history-control flex h-8 shrink-0 items-center rounded-lg border border-slate-200/90 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-900" aria-label="Document history">
          <button className="grid size-7 place-items-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 disabled:opacity-30 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white" type="button" aria-label="Undo" disabled={!session.canUndo} title={session.canUndo ? 'Undo last document command' : 'Nothing to undo'} onClick={session.undo}><Icon name="undo" size={13} /></button>
          <button className="grid size-7 place-items-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 disabled:opacity-30 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white" type="button" aria-label="Redo" disabled={!session.canRedo} title={session.canRedo ? 'Redo last document command' : 'Nothing to redo'} onClick={session.redo}><Icon name="redo" size={13} /></button>
        </div>

        <label className="compact-field theme-field hidden shrink-0 xl:block">
          <span className="sr-only">Editor theme preset</span>
          <select className={`${controlClass} max-w-[150px]`} aria-label="Editor theme preset" value={preferences.editorThemePresetId} onChange={(event) => setEditorThemePresetId(event.target.value as EditorThemePresetId)}>
            {EDITOR_THEME_PRESETS.map((preset) => <option key={preset.id} value={preset.id}>{preset.label}</option>)}
          </select>
        </label>

        <label className="compact-field theme-field hidden shrink-0 lg:block">
          <span className="sr-only">Editor theme mode</span>
          <select className={controlClass} aria-label="Editor theme mode" value={preferences.editorThemeMode} onChange={(event) => setEditorThemeMode(event.target.value as 'light' | 'dark' | 'auto')}>
            <option value="auto">Auto</option>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </label>
      </div>

      <div className="header-actions ml-auto flex shrink-0 items-center gap-1.5">
        <span className="local-badge hidden h-8 items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 text-[11px] font-semibold text-emerald-700 md:flex dark:border-emerald-900/70 dark:bg-emerald-950/50 dark:text-emerald-400" title="Project data remains on this device"><Icon name="local" size={13} /><span>Local</span></span>
        <button className="toolbar-button inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white" type="button" aria-pressed={activeWorkspace === 'preview'} onClick={() => onNavigate('preview')}>
          <Icon name="preview" size={13} /><span className="hidden sm:inline">Preview</span>
        </button>
        <button className="toolbar-button toolbar-button-primary inline-flex h-8 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-[11px] font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:ring-offset-2 dark:ring-offset-slate-950" type="button" aria-label="Export" aria-pressed={activeWorkspace === 'export'} onClick={() => onNavigate('export')}>
          <Icon name="export" size={13} /><span className="hidden sm:inline">Publish</span>
        </button>
      </div>

      <span className="sr-only" aria-live="polite">Active document: {activeDocument?.name ?? 'None'}. Zoom {session.zoom} percent.</span>
    </header>
  );
}
