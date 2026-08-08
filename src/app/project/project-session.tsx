import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
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
  createBrowserEditorProjectPersistence,
  type EditorProjectPersistence,
} from './editor-project-persistence';
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

function projectContentFingerprint(project: CanonicalProject): string {
  const clone = structuredClone(project);
  clone.metadata.updatedAt = '';
  clone.historyMetadata = { revision: 0 };
  return JSON.stringify(clone);
}

function mergeSavedMetadata(
  current: CanonicalProject,
  saved: CanonicalProject,
): CanonicalProject {
  if (current.id !== saved.id) return current;
  return {
    ...current,
    metadata: {
      ...current.metadata,
      updatedAt: saved.metadata.updatedAt,
    },
    historyMetadata: {
      ...current.historyMetadata,
      revision: Math.max(current.historyMetadata.revision, saved.historyMetadata.revision),
      ...(saved.historyMetadata.lastSavedAt === undefined
        ? {}
        : { lastSavedAt: saved.historyMetadata.lastSavedAt }),
    },
  };
}

export interface ProjectSessionProviderProps {
  children: ReactNode;
  initialProject?: CanonicalProject;
  persistence?: EditorProjectPersistence | null;
}

export function ProjectSessionProvider({
  children,
  initialProject,
  persistence,
}: ProjectSessionProviderProps) {
  const [initialSessionProject] = useState<CanonicalProject>(() =>
    structuredClone(initialProject ?? createDefaultSessionProject()),
  );
  const [resolvedPersistence] = useState<EditorProjectPersistence | null>(() => {
    if (persistence !== undefined) return persistence;
    if (initialProject) return null;
    return createBrowserEditorProjectPersistence();
  });
  const [project, setProject] = useState<CanonicalProject>(() => structuredClone(initialSessionProject));
  const projectRef = useRef(project);
  const [activeDocumentId, setActiveDocumentIdState] = useState(
    () => project.documentOrder[0] ?? '',
  );
  const [activeBreakpointId, setActiveBreakpointIdState] = useState(
    () => project.breakpoints[0]?.id ?? 'desktop',
  );
  const [zoom, setZoomState] = useState(100);
  const [saveState, setSaveState] = useState<ProjectSaveState>('saved');
  const [historyByDocument, setHistoryByDocument] = useState<Record<string, DocumentHistoryState>>(
    {},
  );

  const commitProject = useCallback((nextProject: CanonicalProject) => {
    projectRef.current = nextProject;
    setProject(nextProject);
  }, []);

  const queueAutosave = useCallback(
    (nextProject: CanonicalProject) => {
      setSaveState('dirty');
      resolvedPersistence?.queue(nextProject);
    },
    [resolvedPersistence],
  );

  useEffect(() => {
    if (!resolvedPersistence) return;
    let cancelled = false;

    const unsubscribe = resolvedPersistence.subscribe((event) => {
      if (cancelled) return;
      if (event.state === 'saving') {
        setSaveState('saving');
        return;
      }
      if (event.state === 'error') {
        setSaveState('error');
        return;
      }
      if (!event.project) return;

      const current = projectRef.current;
      const contentWasSaved =
        projectContentFingerprint(current) === projectContentFingerprint(event.project);
      const merged = mergeSavedMetadata(current, event.project);
      commitProject(merged);
      setSaveState(contentWasSaved ? 'saved' : 'dirty');
    });

    void resolvedPersistence
      .hydrate(initialSessionProject)
      .then((hydrated) => {
        if (cancelled) return;
        commitProject(hydrated);
        setActiveDocumentIdState(hydrated.documentOrder[0] ?? '');
        setActiveBreakpointIdState(hydrated.breakpoints[0]?.id ?? 'desktop');
        setHistoryByDocument({});
        setSaveState('saved');
      })
      .catch(() => {
        if (!cancelled) setSaveState('error');
      });

    const flushIfHidden = () => {
      if (document.visibilityState === 'hidden') void resolvedPersistence.flush();
    };
    const flushOnPageHide = () => {
      void resolvedPersistence.flush();
    };
    document.addEventListener('visibilitychange', flushIfHidden);
    globalThis.addEventListener('pagehide', flushOnPageHide);

    return () => {
      cancelled = true;
      unsubscribe();
      document.removeEventListener('visibilitychange', flushIfHidden);
      globalThis.removeEventListener('pagehide', flushOnPageHide);
      void resolvedPersistence.flush().finally(() => resolvedPersistence.dispose());
    };
  }, [commitProject, initialSessionProject, resolvedPersistence]);

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

      commitProject(nextProject);
      setHistoryByDocument((current) => ({
        ...current,
        [command.documentId]: recordDocumentCommand(
          current[command.documentId] ?? EMPTY_DOCUMENT_HISTORY,
          command,
        ),
      }));
      queueAutosave(nextProject);
      return true;
    },
    [commitProject, project, queueAutosave],
  );

  const undo = useCallback((): boolean => {
    const history = historyByDocument[activeDocumentId] ?? EMPTY_DOCUMENT_HISTORY;
    const transition = undoDocumentCommand(history);
    if (!transition) return false;
    const nextProject = replaceProjectDocument(project, transition.document);
    if (!nextProject) return false;

    commitProject(nextProject);
    setHistoryByDocument((current) => ({
      ...current,
      [activeDocumentId]: transition.history,
    }));
    queueAutosave(nextProject);
    return true;
  }, [activeDocumentId, commitProject, historyByDocument, project, queueAutosave]);

  const redo = useCallback((): boolean => {
    const history = historyByDocument[activeDocumentId] ?? EMPTY_DOCUMENT_HISTORY;
    const transition = redoDocumentCommand(history);
    if (!transition) return false;
    const nextProject = replaceProjectDocument(project, transition.document);
    if (!nextProject) return false;

    commitProject(nextProject);
    setHistoryByDocument((current) => ({
      ...current,
      [activeDocumentId]: transition.history,
    }));
    queueAutosave(nextProject);
    return true;
  }, [activeDocumentId, commitProject, historyByDocument, project, queueAutosave]);

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
