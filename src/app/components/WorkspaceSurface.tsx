import { ContentTypeEditor } from '../content/ContentTypeEditor';
import { EditorCanvas } from '../editor/canvas/EditorCanvas';
import { useCanvasDocumentActions } from '../editor/canvas/use-canvas-document-actions';
import { useProjectSession } from '../project/project-session-context';
import { getWorkspaceDefinition, type WorkspaceId } from '../routing/workspaces';
import { ProjectThemeControls } from '../themes/ProjectThemeControls';

export interface WorkspaceSurfaceProps {
  workspaceId: WorkspaceId;
}

const workspaceNotes: Record<WorkspaceId, string> = {
  editor: 'Document editing canvas',
  preview: 'Preview shell',
  backend: 'Administrative shell',
  export: 'Publishing shell',
};

export function WorkspaceSurface({ workspaceId }: WorkspaceSurfaceProps) {
  const session = useProjectSession();
  const canvasActions = useCanvasDocumentActions();
  const definition = getWorkspaceDefinition(workspaceId);
  const document = session.project.documents[session.activeDocumentId];
  const breakpoint = session.project.breakpoints.find(
    (candidate) => candidate.id === session.activeBreakpointId,
  );

  return (
    <main className="workspace-surface" id="workspace-main" tabIndex={-1}>
      <div className="surface-toolbar">
        <div>
          <span className="surface-eyebrow">{workspaceNotes[workspaceId]}</span>
          <h1>{definition.label} workspace</h1>
        </div>
        <div className="surface-context" aria-label="Active workspace context">
          <span>{document?.name ?? 'No document'}</span>
          <span>{breakpoint?.label ?? 'No breakpoint'}</span>
          <span>{session.zoom}%</span>
        </div>
      </div>

      {workspaceId === 'editor' && document && breakpoint ? (
        <EditorCanvas
          document={document}
          breakpointId={session.activeBreakpointId}
          breakpoints={session.project.breakpoints}
          viewportWidth={breakpoint.width}
          zoom={session.zoom}
          actions={canvasActions}
        />
      ) : (
        <section className="workspace-stage" aria-label={`${definition.label} workspace stage`}>
          <div className="stage-ruler stage-ruler-horizontal" aria-hidden="true" />
          <div className="stage-ruler stage-ruler-vertical" aria-hidden="true" />
          <article className="stage-document">
            <div className="stage-document-header">
              <div>
                <span className="stage-status-dot" aria-hidden="true" />
                <span>{definition.label}</span>
              </div>
              <code>{workspaceId}</code>
            </div>
            <div className="stage-document-body">
              <p className="stage-kicker">Active project context</p>
              <h2>{session.project.name}</h2>
              <dl className="stage-facts">
                <div><dt>Document</dt><dd>{document?.name ?? 'None'}</dd></div>
                <div><dt>Viewport</dt><dd>{breakpoint ? `${breakpoint.width}px` : '—'}</dd></div>
                <div><dt>Zoom</dt><dd>{session.zoom}%</dd></div>
                <div><dt>Storage</dt><dd>Local-first</dd></div>
              </dl>
              {workspaceId === 'preview' ? <ProjectThemeControls scope="frontend" /> : null}
              {workspaceId === 'backend' ? (
                <>
                  <ContentTypeEditor />
                  <ProjectThemeControls scope="backend" />
                </>
              ) : null}
              <p className="stage-boundary-note">
                {workspaceId === 'backend'
                  ? 'Content model configuration is active; records, taxonomies and final backend rendering arrive in later F05/F06 microphases.'
                  : 'This workspace remains a shell until its dedicated renderer is implemented.'}
              </p>
            </div>
          </article>
        </section>
      )}
    </main>
  );
}
