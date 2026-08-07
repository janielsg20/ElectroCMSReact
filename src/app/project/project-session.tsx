import { useCallback, useMemo, useState, type ReactNode } from 'react';
import {
  createCanonicalProject,
  validateCanonicalProject,
  type CanonicalDocument,
  type CanonicalProject,
} from '../../core/project';
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

  const replaceDocument = useCallback(
    (document: CanonicalDocument): boolean => {
      if (!(document.id in project.documents)) return false;
      const nextProject: CanonicalProject = {
        ...project,
        documents: {
          ...project.documents,
          [document.id]: structuredClone(document),
        },
        updatedAt: new Date().toISOString(),
      };
      const validation = validateCanonicalProject(nextProject);
      if (!validation.valid) return false;
      setProject(nextProject);
      setSaveState('dirty');
      return true;
    },
    [project],
  );

  const value = useMemo<ProjectSessionState>(
    () => ({
      project,
      activeDocumentId,
      activeBreakpointId,
      zoom,
      saveState,
      canUndo: false,
      canRedo: false,
      setActiveDocumentId,
      setActiveBreakpointId,
      setZoom,
      replaceDocument,
    }),
    [
      activeBreakpointId,
      activeDocumentId,
      project,
      replaceDocument,
      saveState,
      setActiveBreakpointId,
      setActiveDocumentId,
      setZoom,
      zoom,
    ],
  );

  return <ProjectSessionContext.Provider value={value}>{children}</ProjectSessionContext.Provider>;
}
