import { useCallback, useMemo, useState, type ReactNode } from 'react';
import {
  createCanonicalProject,
  validateCanonicalProject,
  type CanonicalDocument,
  type CanonicalProject,
} from '../../core/project';
import {
  EMPTY_DOCUMENT_HISTORY,
  recordDocumentCommand,
  redoDocumentCommand,
  undoDocumentCommand,
  type DocumentCommand,
  type DocumentHistoryState,
} from './document-command-history';
import {
  ProjectSessionContext,
  type ProjectSaveState,
  type ProjectSessionState,
} from './project-session-context';

function createDefaultSessionProject(): CanonicalProject {
  return createCanonicalProject({
    id: 'project_local_workspace',
    name: 'Untitled project',
  });
}

function clampZoom(value: number): number {
  const stepped = Math.round(value / 10) * 10;
  return Math.min(200, Math.max(50, stepped));
}

function replaceProjectDocument(
  project: CanonicalProject,
  document: CanonicalDocument,
): CanonicalProject | null {
  if (!(document.id in project.documents)) return null;
  const nextProject: CanonicalProject = {
    ...project,
    metadata: {
      ...project.metadata,
      updatedAt: new Date().toISOString(),
    },
    documents: {
      ...project.documents,
      [document.id]: structuredClone(document),
    },
  };
  const validation = validateCanonicalProject(nextProject);
  return validation.ok ? validation.value : null;
}

export interface ProjectSessionProviderProps {
  children: ReactNode;
  initialProject?: CanonicalProject;
}

export function ProjectSessionProvider({ children, initialProject }: ProjectSessionProviderProps) {
  const [project, setProject] = useState<CanonicalProject>(() =>
    structuredClone(initialProject ?? createDefaultSessionProject()),
  );
  const [activeDocumentId, setActiveDocumentIdState] = useState(() => project.documentOrder[0] ?? '');
  const [activeBreakpointId, setActiveBreakpointIdState] = useState(
    () => project.breakpoints[0]?.id ?? 'desktop',
  );
  const [zoom, setZoomState] = useState(100);
  const [saveState, setSaveState] = useState<ProjectSaveState>('saved');
  const [historyByDocument, setHistoryByDocument] = useState<Record<string, DocumentHistoryState>>(
    {},
  );

  const setActiveDocumentId = useCallback(
    (documentId: string) => {
      if (!(documentId in project.documents)) return;
      setActiveDocumentIdState(documentId);
    },
    [project.documents],
  );

  const setActiveBreakpointId = useCallback(
    (breakpointId: string) => {
      if (!project.breakpoints.some((breakpoint) => breakpoint.id === breakpointId)) return;
      setActiveBreakpointIdState(breakpointId);
    },
    [project.breakpoints],
  );

  const setZoom = useCallback((nextZoom: number) => {
    setZoomState(clampZoom(nextZoom));
  }, []);

  const executeDocumentCommand = useCallback(
    (command: DocumentCommand): boolean => {
      const currentDocument = project.documents[command.documentId];
      if (!currentDocument || currentDocument.id !== command.before.id) return false;
      const nextProject = replaceProjectDocument(project, command.after);
      if (!nextProject) return false;

      setProject(nextProject);
      setHistoryByDocument((current) => ({
        ...current,
        [command.documentId]: recordDocumentCommand(
          current[command.documentId] ?? EMPTY_DOCUMENT_HISTORY,
          command,
        ),
      }));
      setSaveState('dirty');
      return true;
    },
    [project],
  );

  const undo = useCallback((): boolean => {
    const history = historyByDocument[activeDocumentId] ?? EMPTY_DOCUMENT_HISTORY;
    const transition = undoDocumentCommand(history);
    if (!transition) return false;
    const nextProject = replaceProjectDocument(project, transition.document);
    if (!nextProject) return false;

    setProject(nextProject);
    setHistoryByDocument((current) => ({
      ...current,
      [activeDocumentId]: transition.history,
    }));
    setSaveState('dirty');
    return true;
  }, [activeDocumentId, historyByDocument, project]);

  const redo = useCallback((): boolean => {
    const history = historyByDocument[activeDocumentId] ?? EMPTY_DOCUMENT_HISTORY;
    const transition = redoDocumentCommand(history);
    if (!transition) return false;
    const nextProject = replaceProjectDocument(project, transition.document);
    if (!nextProject) return false;

    setProject(nextProject);
    setHistoryByDocument((current) => ({
      ...current,
      [activeDocumentId]: transition.history,
    }));
    setSaveState('dirty');
    return true;
  }, [activeDocumentId, historyByDocument, project]);

  const activeHistory = historyByDocument[activeDocumentId] ?? EMPTY_DOCUMENT_HISTORY;
  const canUndo = activeHistory.past.length > 0;
  const canRedo = activeHistory.future.length > 0;

  const value = useMemo<ProjectSessionState>(
    () => ({
      project,
      activeDocumentId,
      activeBreakpointId,
      zoom,
      saveState,
      canUndo,
      canRedo,
      setActiveDocumentId,
      setActiveBreakpointId,
      setZoom,
      executeDocumentCommand,
      undo,
      redo,
    }),
    [
      activeBreakpointId,
      activeDocumentId,
      canRedo,
      canUndo,
      executeDocumentCommand,
      project,
      redo,
      saveState,
      setActiveBreakpointId,
      setActiveDocumentId,
      setZoom,
      undo,
      zoom,
    ],
  );

  return <ProjectSessionContext.Provider value={value}>{children}</ProjectSessionContext.Provider>;
}
