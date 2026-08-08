import { createContext, useContext } from 'react';
import type {
  ContentRecordDefinition,
  ContentRecordMutationErrorCode,
  ContentTypeDefinition,
  ContentTypeMutationErrorCode,
  FieldGroupDefinition,
  FieldGroupMutationErrorCode,
  TaxonomyDefinition,
  TaxonomyMutationErrorCode,
} from '../../core/content';
import type { CanonicalProject } from '../../core/project';
import type {
  ProjectThemePackageResources,
  ProjectThemeScope,
  ThemePackageMergeReport,
  ThemePackageResourceSelection,
} from '../../core/themes';
import type { DocumentCommand } from './document-command-history';

export type ProjectSaveState = 'saved' | 'dirty' | 'saving' | 'error';

export type ProjectThemeResourceApplyResult =
  | { ok: true; report: ThemePackageMergeReport; changed: boolean }
  | { ok: false; message: string };

export type ContentTypeSessionMutationResult =
  | { ok: true; value: ContentTypeDefinition; changed: boolean }
  | { ok: false; code: ContentTypeMutationErrorCode; message: string };

export type TaxonomySessionMutationResult =
  | { ok: true; value: TaxonomyDefinition; changed: boolean }
  | { ok: false; code: TaxonomyMutationErrorCode; message: string };

export type FieldGroupSessionMutationResult =
  | { ok: true; value: FieldGroupDefinition; changed: boolean }
  | { ok: false; code: FieldGroupMutationErrorCode; message: string };

export type ContentRecordSessionMutationResult =
  | { ok: true; value: ContentRecordDefinition; changed: boolean }
  | { ok: false; code: ContentRecordMutationErrorCode; message: string };

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
  setProjectTheme(scope: ProjectThemeScope, themeId: string): boolean;
  applyThemePackageResources(
    resources: ProjectThemePackageResources | undefined,
    selection: ThemePackageResourceSelection,
  ): ProjectThemeResourceApplyResult;
  createContentType(input: unknown): ContentTypeSessionMutationResult;
  updateContentType(id: string, input: unknown): ContentTypeSessionMutationResult;
  removeContentType(id: string): ContentTypeSessionMutationResult;
  createTaxonomy(input: unknown): TaxonomySessionMutationResult;
  updateTaxonomy(id: string, input: unknown): TaxonomySessionMutationResult;
  removeTaxonomy(id: string): TaxonomySessionMutationResult;
  createFieldGroup(input: unknown): FieldGroupSessionMutationResult;
  updateFieldGroup(id: string, input: unknown): FieldGroupSessionMutationResult;
  removeFieldGroup(id: string): FieldGroupSessionMutationResult;
  createContentRecord(input: unknown): ContentRecordSessionMutationResult;
  updateContentRecord(id: string, input: unknown): ContentRecordSessionMutationResult;
  removeContentRecord(id: string): ContentRecordSessionMutationResult;
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
