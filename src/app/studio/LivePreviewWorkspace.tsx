import { inspectDocumentTree } from '../../core/project';
import { Icon } from '../components/Icon';
import { CanvasRenderer } from '../editor/canvas/CanvasRenderer';
import { useProjectSession } from '../project/project-session-context';
import { ProjectThemeControls } from '../themes/ProjectThemeControls';
import { useEditorWidgetRegistry } from '../widgets/editor-widget-registry-context';

function Diagnostic({ label, value, tone = 'neutral' }: { label: string; value: string; tone?: 'neutral' | 'success' | 'warning' }) {
  const toneClass = tone === 'success' ? 'text-[var(--color-ec-success-600)]' : tone === 'warning' ? 'text-[var(--color-ec-warning-600)]' : 'text-[var(--color-ec-text)]';
  return <div className="flex items-center justify-between gap-3 border-b border-[var(--color-ec-border)] px-3 py-2.5 last:border-0"><span className="text-[8px] font-semibold text-[var(--color-ec-text-muted)]">{label}</span><strong className={`text-right text-[9px] font-semibold ${toneClass}`}>{value}</strong></div>;
}

export function LivePreviewWorkspace() {
  const session = useProjectSession();
  const registry = useEditorWidgetRegistry();
  const document = session.project.documents[session.activeDocumentId];
  const breakpoint = session.project.breakpoints.find((candidate) => candidate.id === session.activeBreakpointId) ?? session.project.breakpoints[0];

  if (!document || !breakpoint) {
    return <section className="grid min-h-0 flex-1 place-items-center bg-[var(--color-ec-app)] p-6" aria-label="Preview workspace"><div className="max-w-sm text-center"><Icon name="preview" size={22} /><h2 className="mt-3 text-lg font-semibold text-[var(--color-ec-text)]">Preview workspace</h2><p className="mt-2 text-[10px] leading-5 text-[var(--color-ec-text-muted)]">Select a valid document and breakpoint before opening live preview.</p></div></section>;
  }

  const inspection = inspectDocumentTree(document);
  const nodes = Object.values(document.nodes);
  const previewableNodes = nodes.filter((node) => node.type === 'core/root' || registry.hasPreview(node.type, node.version)).length;
  const unregisteredPreviewCount = Math.max(0, nodes.length - previewableNodes);
  const previewZoom = Math.min(session.zoom, 100);

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[var(--color-ec-app)]" aria-label="Preview workspace">
      <header className="shrink-0 border-b border-[var(--color-ec-border)] bg-[var(--color-ec-surface)] px-4 py-3 md:px-5">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-end justify-between gap-3">
          <div><span className="text-[8px] font-bold uppercase tracking-[.16em] text-[var(--color-ec-accent)]">Live preview</span><h2 className="mt-1 text-[18px] font-semibold tracking-[-.03em] text-[var(--color-ec-text)]">Preview workspace</h2><p className="mt-1 text-[9px] text-[var(--color-ec-text-muted)]">Render the active canonical document without editor selection, drag or mutation controls.</p></div>
          <label className="ec-control flex h-8 items-center gap-2 px-2.5 text-[9px] font-semibold text-[var(--color-ec-text-muted)]"><Icon name="preview" size={12} /><span className="sr-only">Preview device</span><select className="bg-transparent text-[9px] font-semibold text-[var(--color-ec-text)] outline-none" aria-label="Preview device" value={session.activeBreakpointId} onChange={(event) => session.setActiveBreakpointId(event.target.value)}>{session.project.breakpoints.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.label} · {candidate.width}px</option>)}</select></label>
        </div>
      </header>

      <div className="mx-auto grid min-h-0 w-full max-w-[1500px] flex-1 gap-3 p-3 lg:grid-cols-[minmax(0,1fr)_300px] md:p-4">
        <main className="min-h-0 overflow-auto rounded-[var(--ec-radius-lg)] border border-[var(--color-ec-border)] bg-[var(--color-ec-surface-subtle)] shadow-[var(--ec-shadow-panel)]" aria-label="Live document preview">
          <div className="sticky top-0 z-10 flex h-9 items-center justify-between gap-3 border-b border-[var(--color-ec-border)] bg-[var(--color-ec-surface)] px-3 text-[8px] text-[var(--color-ec-text-muted)]"><span className="truncate"><strong className="font-semibold text-[var(--color-ec-text)]">{document.name}</strong> · {breakpoint.label}</span><span className="shrink-0 font-mono tabular-nums">{breakpoint.width}px · {previewZoom}%</span></div>
          <div className="preview-canvas-host min-h-[560px] overflow-auto p-4 md:p-6"><CanvasRenderer document={document} breakpointId={breakpoint.id} viewportWidth={breakpoint.width} zoom={previewZoom} /></div>
        </main>

        <aside className="min-h-0 space-y-3 overflow-y-auto" aria-label="Preview diagnostics">
          <section className="overflow-hidden rounded-[var(--ec-radius-lg)] border border-[var(--color-ec-border)] bg-[var(--color-ec-surface)] shadow-[var(--ec-shadow-panel)]"><header className="border-b border-[var(--color-ec-border)] px-3 py-2.5"><span className="text-[8px] font-bold uppercase tracking-[.13em] text-[var(--color-ec-text-muted)]">Diagnostics</span></header><Diagnostic label="Document tree" value={inspection.valid ? 'Valid' : `${inspection.issues.length} issues`} tone={inspection.valid ? 'success' : 'warning'} /><Diagnostic label="Nodes" value={String(nodes.length)} /><Diagnostic label="Widget previews" value={`${previewableNodes}/${nodes.length}`} tone={unregisteredPreviewCount === 0 ? 'success' : 'warning'} /><Diagnostic label="Save state" value={session.saveState} tone={session.saveState === 'saved' ? 'success' : 'warning'} /><Diagnostic label="Breakpoint" value={`${breakpoint.label} · ${breakpoint.width}px`} /></section>
          <div className="rounded-[var(--ec-radius-lg)] border border-[var(--color-ec-border)] bg-[var(--color-ec-surface)] shadow-[var(--ec-shadow-panel)]"><ProjectThemeControls scope="frontend" /></div>
        </aside>
      </div>
    </section>
  );
}
