import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { createCanonicalProject, type CanonicalProject } from '../../core/project';

export type ProjectSaveState = 'saved' | 'dirty' | 'saving' | 'error';

export interface ProjectSessionState {
  project: CanonicalProject;
  activeDocumentId: string;
  activeBreakpointId: string;
  zoom: number;
  saveState: ProjectSaveState;
  canUndo: boolean;
  canRedo: boolean;
  setActiveDocumentId(documentId: string): void;
  setActiveBreakpointId(breakpointId: string): void;
  setZoom(zoom: number): void;
}

const ProjectSessionContext = createContext<ProjectSessionState | null>(null);

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
  const [project] = useState<CanonicalProject>(() => structuredClone(initialProject ?? createDefaultSessionProject()));
  const [activeDocumentId, setActiveDocumentIdState] = useState(() => project.documentOrder[0] ?? '');
  const [activeBreakpointId, setActiveBreakpointIdState] = useState(() => project.breakpoints[0]?.id ?? 'desktop');
  const [zoom, setZoomState] = useState(100);

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

  const value = useMemo<ProjectSessionState>(
    () => ({
      project,
      activeDocumentId,
      activeBreakpointId,
      zoom,
      saveState: 'saved',
      canUndo: false,
      canRedo: false,
      setActiveDocumentId,
      setActiveBreakpointId,
      setZoom,
    }),
    [
      activeBreakpointId,
      activeDocumentId,
      project,
      setActiveBreakpointId,
      setActiveDocumentId,
      setZoom,
      zoom,
    ],
  );

  return <ProjectSessionContext.Provider value={value}>{children}</ProjectSessionContext.Provider>;
}

export function useProjectSession(): ProjectSessionState {
  const value = useContext(ProjectSessionContext);
  if (!value) throw new Error('useProjectSession must be used inside ProjectSessionProvider.');
  return value;
}
