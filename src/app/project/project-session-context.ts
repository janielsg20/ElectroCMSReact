import { createContext, useContext } from 'react';
import type { CanonicalProject } from '../../core/project';
import type { DocumentCommand } from './document-command-history';

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
  executeDocumentCommand(command: DocumentCommand): boolean;
  undo(): boolean;
  redo(): boolean;
}

export const ProjectSessionContext = createContext<ProjectSessionState | null>(null);

export function useProjectSession(): ProjectSessionState {
  const value = useContext(ProjectSessionContext);
  if (!value) throw new Error('useProjectSession must be used inside ProjectSessionProvider.');
  return value;
}
