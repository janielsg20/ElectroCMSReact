import { useEffect, useMemo, useState } from 'react';
import { Icon, type IconName } from '../components/Icon';
import type { WorkspaceId } from '../routing/workspaces';

type ModuleCommandId = 'builder' | 'pages' | 'content' | 'queries' | 'forms' | 'filters' | 'media' | 'themes' | 'users' | 'blueprints' | 'settings';

interface StudioCommandPaletteProps {
  open: boolean;
  onOpenChange(open: boolean): void;
  onNavigate(workspaceId: WorkspaceId): void;
  onSelectModule(moduleId: ModuleCommandId): void;
}

interface CommandItem {
  id: string;
  label: string;
  detail: string;
  icon: IconName;
  shortcut?: string;
  run(): void;
}

export function StudioCommandPalette({ open, onOpenChange, onNavigate, onSelectModule }: StudioCommandPaletteProps) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        onOpenChange(!open);
      } else if (open && event.key === 'Escape') {
        event.preventDefault();
        onOpenChange(false);
      }
    };
    globalThis.addEventListener('keydown', handleKeyDown);
    return () => globalThis.removeEventListener('keydown', handleKeyDown);
  }, [onOpenChange, open]);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const commands = useMemo<CommandItem[]>(() => {
    const close = (run: () => void) => () => { run(); onOpenChange(false); };
    return [
      { id: 'workspace-editor', label: 'Open Editor', detail: 'Visual authoring workspace', icon: 'editor', shortcut: 'E', run: close(() => onNavigate('editor')) },
      { id: 'workspace-preview', label: 'Open Preview', detail: 'Canonical read-only live preview', icon: 'preview', shortcut: 'P', run: close(() => onNavigate('preview')) },
      { id: 'workspace-backend', label: 'Open Backend', detail: 'Administrative builder', icon: 'backend', shortcut: 'B', run: close(() => onNavigate('backend')) },
      { id: 'workspace-export', label: 'Open Publishing Center', detail: 'Export destinations and readiness', icon: 'export', shortcut: 'X', run: close(() => onNavigate('export')) },
      { id: 'module-builder', label: 'Builder', detail: 'Canvas, library, layers and inspector', icon: 'editor', run: close(() => onSelectModule('builder')) },
      { id: 'module-pages', label: 'Pages', detail: 'Pages, templates and assets', icon: 'pages', run: close(() => onSelectModule('pages')) },
      { id: 'module-content', label: 'Content', detail: 'Dynamic content studio', icon: 'database', run: close(() => onSelectModule('content')) },
      { id: 'module-forms', label: 'Forms', detail: 'Forms and workflow studio', icon: 'form', run: close(() => onSelectModule('forms')) },
      { id: 'module-themes', label: 'Themes', detail: 'Frontend and backend theme packages', icon: 'theme', run: close(() => onSelectModule('themes')) },
      { id: 'module-settings', label: 'Settings', detail: 'Project, storage and editor preferences', icon: 'settings', run: close(() => onSelectModule('settings')) },
    ];
  }, [onNavigate, onOpenChange, onSelectModule]);

  if (!open) return null;
  const normalized = query.trim().toLowerCase();
  const visible = commands.filter((command) => !normalized || `${command.label} ${command.detail}`.toLowerCase().includes(normalized));

  return (
    <div className="fixed inset-0 z-[90] grid place-items-start bg-black/35 px-3 pt-[10vh] backdrop-blur-[2px]" role="presentation" onPointerDown={(event) => { if (event.target === event.currentTarget) onOpenChange(false); }}>
      <section className="mx-auto w-full max-w-[620px] overflow-hidden rounded-[var(--ec-radius-xl)] border border-[var(--color-ec-border)] bg-[var(--color-ec-surface)] shadow-[var(--ec-shadow-float)]" role="dialog" aria-modal="true" aria-label="Command palette">
        <label className="flex h-12 items-center gap-2 border-b border-[var(--color-ec-border)] px-3 text-[var(--color-ec-text-muted)]"><Icon name="search" size={15} /><span className="sr-only">Search commands</span><input autoFocus className="min-w-0 flex-1 bg-transparent text-[11px] text-[var(--color-ec-text)] outline-none placeholder:text-[var(--color-ec-text-muted)]" aria-label="Search commands" placeholder="Search workspaces and tools…" value={query} onChange={(event) => setQuery(event.target.value)} /><kbd className="rounded border border-[var(--color-ec-border)] bg-[var(--color-ec-surface-subtle)] px-1.5 py-0.5 text-[8px]">Esc</kbd></label>
        <div className="max-h-[min(62vh,520px)] overflow-y-auto p-2" role="listbox" aria-label="Available commands">
          {visible.map((command) => <button key={command.id} type="button" className="ec-focus-ring flex min-h-11 w-full items-center gap-3 rounded-[var(--ec-radius-md)] px-2.5 text-left hover:bg-[var(--color-ec-surface-muted)]" onClick={command.run}><span className="grid size-7 shrink-0 place-items-center rounded-[var(--ec-radius-sm)] bg-[var(--color-ec-surface-subtle)] text-[var(--color-ec-text-muted)]"><Icon name={command.icon} size={13} /></span><span className="min-w-0 flex-1"><strong className="block truncate text-[9px] font-semibold text-[var(--color-ec-text)]">{command.label}</strong><small className="block truncate text-[8px] text-[var(--color-ec-text-muted)]">{command.detail}</small></span>{command.shortcut ? <kbd className="rounded border border-[var(--color-ec-border)] px-1.5 py-0.5 text-[8px] text-[var(--color-ec-text-muted)]">{command.shortcut}</kbd> : null}</button>)}
          {visible.length === 0 ? <div className="grid min-h-28 place-items-center text-center"><div><strong className="block text-[9px] text-[var(--color-ec-text)]">No commands found</strong><span className="mt-1 block text-[8px] text-[var(--color-ec-text-muted)]">Try another search.</span></div></div> : null}
        </div>
        <footer className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-[var(--color-ec-border)] bg-[var(--color-ec-surface-subtle)] px-3 py-2 text-[8px] text-[var(--color-ec-text-muted)]"><span><kbd>Ctrl/⌘ K</kbd> palette</span><span><kbd>Ctrl/⌘ Z</kbd> undo</span><span><kbd>Ctrl/⌘ Shift Z</kbd> redo</span><span><kbd>Esc</kbd> close</span></footer>
      </section>
    </div>
  );
}
