import { useProjectSession } from '../project/project-session-context';
import { getWorkspaceDefinition, type WorkspaceId } from '../routing/workspaces';

export interface WorkspaceSurfaceProps {
  workspaceId: WorkspaceId;
}

const workspaceNotes: Record<WorkspaceId, string> = {
  editor: 'Document editing shell',
  preview: 'Preview shell',
  backend: 'Administrative shell',
  export: 'Publishing shell',
};

export function WorkspaceSurface({ workspaceId }: WorkspaceSurfaceProps) {
  const session = useProjectSession();
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
              <div>
                <dt>Document</dt>
                <dd>{document?.name ?? 'None'}</dd>
              </div>
              <div>
                <dt>Viewport</dt>
                <dd>{breakpoint ? `${breakpoint.width}px` : '—'}</dd>
              </div>
              <div>
                <dt>Zoom</dt>
                <dd>{session.zoom}%</dd>
              </div>
              <div>
                <dt>Storage</dt>
                <dd>Local-first</dd>
              </div>
            </dl>
            <p className="stage-boundary-note">
              This phase validates the editor workspace shell and preserves project context between routes.
            </p>
          </div>
        </article>
      </section>
    </main>
  );
}
