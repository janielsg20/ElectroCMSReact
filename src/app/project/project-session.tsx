import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  createContentRecord as createCanonicalContentRecord,
  createContentType as createCanonicalContentType,
  createFieldGroup as createCanonicalFieldGroup,
  createTaxonomy as createCanonicalTaxonomy,
  removeContentRecord as removeCanonicalContentRecord,
  removeContentType as removeCanonicalContentType,
  removeFieldGroup as removeCanonicalFieldGroup,
  removeTaxonomy as removeCanonicalTaxonomy,
  updateContentRecord as updateCanonicalContentRecord,
  updateContentType as updateCanonicalContentType,
  updateFieldGroup as updateCanonicalFieldGroup,
  updateTaxonomy as updateCanonicalTaxonomy,
} from '../../core/content';
import {
  createCanonicalProject,
  validateCanonicalProject,
  type CanonicalDocument,
  type CanonicalProject,
} from '../../core/project';
import {
  mergeThemePackageResources,
  type ProjectThemePackageResources,
  type ProjectThemeScope,
  type ThemePackageResourceSelection,
} from '../../core/themes';
import { useProjectThemeRegistry } from '../themes/project-theme-registry-context';
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
  type ContentRecordSessionMutationResult,
  type ContentTypeSessionMutationResult,
  type FieldGroupSessionMutationResult,
  type ProjectSaveState,
  type ProjectSessionState,
  type ProjectThemeResourceApplyResult,
  type TaxonomySessionMutationResult,
} from './project-session-context';

function createDefaultSessionProject(): CanonicalProject {
  return createCanonicalProject({ id: 'project_local_workspace', name: 'Untitled project' });
}

function clampZoom(value: number): number {
  const stepped = Math.round(value / 10) * 10;
  return Math.min(200, Math.max(50, stepped));
}

function replaceProjectDocument(project: CanonicalProject, document: CanonicalDocument): CanonicalProject | null {
  if (!(document.id in project.documents)) return null;
  const nextProject: CanonicalProject = {
    ...project,
    metadata: { ...project.metadata, updatedAt: new Date().toISOString() },
    documents: { ...project.documents, [document.id]: structuredClone(document) },
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

function mergeSavedMetadata(current: CanonicalProject, saved: CanonicalProject): CanonicalProject {
  if (current.id !== saved.id) return current;
  return {
    ...current,
    metadata: { ...current.metadata, updatedAt: saved.metadata.updatedAt },
    historyMetadata: {
      ...current.historyMetadata,
      revision: Math.max(current.historyMetadata.revision, saved.historyMetadata.revision),
      ...(saved.historyMetadata.lastSavedAt === undefined ? {} : { lastSavedAt: saved.historyMetadata.lastSavedAt }),
    },
  };
}

export interface ProjectSessionProviderProps {
  children: ReactNode;
  initialProject?: CanonicalProject;
  persistence?: EditorProjectPersistence | null;
}

export function ProjectSessionProvider({ children, initialProject, persistence }: ProjectSessionProviderProps) {
  const themeRegistry = useProjectThemeRegistry();
  const [initialSessionProject] = useState<CanonicalProject>(() => structuredClone(initialProject ?? createDefaultSessionProject()));
  const [resolvedPersistence] = useState<EditorProjectPersistence | null>(() => {
    if (persistence !== undefined) return persistence;
    if (initialProject) return null;
    return createBrowserEditorProjectPersistence();
  });
  const [project, setProject] = useState<CanonicalProject>(() => structuredClone(initialSessionProject));
  const projectRef = useRef(project);
  const [activeDocumentId, setActiveDocumentIdState] = useState(() => project.documentOrder[0] ?? '');
  const [activeBreakpointId, setActiveBreakpointIdState] = useState(() => project.breakpoints[0]?.id ?? 'desktop');
  const [zoom, setZoomState] = useState(100);
  const [saveState, setSaveState] = useState<ProjectSaveState>('saved');
  const [historyByDocument, setHistoryByDocument] = useState<Record<string, DocumentHistoryState>>({});

  const commitProject = useCallback((nextProject: CanonicalProject) => {
    projectRef.current = nextProject;
    setProject(nextProject);
  }, []);

  const queueAutosave = useCallback((nextProject: CanonicalProject) => {
    setSaveState('dirty');
    resolvedPersistence?.queue(nextProject);
  }, [resolvedPersistence]);

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
      const contentWasSaved = projectContentFingerprint(current) === projectContentFingerprint(event.project);
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

  const setActiveDocumentId = useCallback((documentId: string) => {
    if (!(documentId in project.documents)) return;
    setActiveDocumentIdState(documentId);
  }, [project.documents]);

  const setActiveBreakpointId = useCallback((breakpointId: string) => {
    if (!project.breakpoints.some((breakpoint) => breakpoint.id === breakpointId)) return;
    setActiveBreakpointIdState(breakpointId);
  }, [project.breakpoints]);

  const setZoom = useCallback((nextZoom: number) => setZoomState(clampZoom(nextZoom)), []);

  const setProjectTheme = useCallback((scope: ProjectThemeScope, themeId: string): boolean => {
    if (!themeRegistry.has(themeId, scope)) return false;
    const currentProject = projectRef.current;
    const key = scope === 'frontend' ? 'frontendThemeId' : 'backendThemeId';
    if (currentProject[key] === themeId) return true;
    const nextProject: CanonicalProject = {
      ...currentProject,
      [key]: themeId,
      metadata: { ...currentProject.metadata, updatedAt: new Date().toISOString() },
    };
    const validation = validateCanonicalProject(nextProject);
    if (!validation.ok) return false;
    commitProject(validation.value);
    queueAutosave(validation.value);
    return true;
  }, [commitProject, queueAutosave, themeRegistry]);

  const applyThemePackageResources = useCallback((resources: ProjectThemePackageResources | undefined, selection: ThemePackageResourceSelection): ProjectThemeResourceApplyResult => {
    const result = mergeThemePackageResources(projectRef.current, resources, selection);
    if (!result.ok) return { ok: false, message: result.message };
    if (result.changed) {
      commitProject(result.project);
      queueAutosave(result.project);
    }
    return { ok: true, report: result.report, changed: result.changed };
  }, [commitProject, queueAutosave]);

  const createContentType = useCallback((input: unknown): ContentTypeSessionMutationResult => {
    const result = createCanonicalContentType(projectRef.current, input);
    if (!result.ok) return { ok: false, code: result.error.code, message: result.error.message };
    commitProject(result.project);
    queueAutosave(result.project);
    return { ok: true, value: result.value, changed: true };
  }, [commitProject, queueAutosave]);

  const updateContentType = useCallback((id: string, input: unknown): ContentTypeSessionMutationResult => {
    const result = updateCanonicalContentType(projectRef.current, id, input);
    if (!result.ok) return { ok: false, code: result.error.code, message: result.error.message };
    const changed = JSON.stringify(projectRef.current.contentTypes[id]) !== JSON.stringify(result.project.contentTypes[id]);
    if (changed) {
      commitProject(result.project);
      queueAutosave(result.project);
    }
    return { ok: true, value: result.value, changed };
  }, [commitProject, queueAutosave]);

  const removeContentType = useCallback((id: string): ContentTypeSessionMutationResult => {
    const result = removeCanonicalContentType(projectRef.current, id);
    if (!result.ok) return { ok: false, code: result.error.code, message: result.error.message };
    commitProject(result.project);
    queueAutosave(result.project);
    return { ok: true, value: result.value, changed: true };
  }, [commitProject, queueAutosave]);

  const createTaxonomy = useCallback((input: unknown): TaxonomySessionMutationResult => {
    const result = createCanonicalTaxonomy(projectRef.current, input);
    if (!result.ok) return { ok: false, code: result.error.code, message: result.error.message };
    commitProject(result.project);
    queueAutosave(result.project);
    return { ok: true, value: result.value, changed: true };
  }, [commitProject, queueAutosave]);

  const updateTaxonomy = useCallback((id: string, input: unknown): TaxonomySessionMutationResult => {
    const result = updateCanonicalTaxonomy(projectRef.current, id, input);
    if (!result.ok) return { ok: false, code: result.error.code, message: result.error.message };
    const changed = JSON.stringify(projectRef.current.taxonomies[id]) !== JSON.stringify(result.project.taxonomies[id]);
    if (changed) {
      commitProject(result.project);
      queueAutosave(result.project);
    }
    return { ok: true, value: result.value, changed };
  }, [commitProject, queueAutosave]);

  const removeTaxonomy = useCallback((id: string): TaxonomySessionMutationResult => {
    const result = removeCanonicalTaxonomy(projectRef.current, id);
    if (!result.ok) return { ok: false, code: result.error.code, message: result.error.message };
    commitProject(result.project);
    queueAutosave(result.project);
    return { ok: true, value: result.value, changed: true };
  }, [commitProject, queueAutosave]);

  const createFieldGroup = useCallback((input: unknown): FieldGroupSessionMutationResult => {
    const result = createCanonicalFieldGroup(projectRef.current, input);
    if (!result.ok) return { ok: false, code: result.error.code, message: result.error.message };
    commitProject(result.project);
    queueAutosave(result.project);
    return { ok: true, value: result.value, changed: true };
  }, [commitProject, queueAutosave]);

  const updateFieldGroup = useCallback((id: string, input: unknown): FieldGroupSessionMutationResult => {
    const result = updateCanonicalFieldGroup(projectRef.current, id, input);
    if (!result.ok) return { ok: false, code: result.error.code, message: result.error.message };
    const changed = JSON.stringify(projectRef.current.fieldGroups[id]) !== JSON.stringify(result.project.fieldGroups[id]);
    if (changed) {
      commitProject(result.project);
      queueAutosave(result.project);
    }
    return { ok: true, value: result.value, changed };
  }, [commitProject, queueAutosave]);

  const removeFieldGroup = useCallback((id: string): FieldGroupSessionMutationResult => {
    const result = removeCanonicalFieldGroup(projectRef.current, id);
    if (!result.ok) return { ok: false, code: result.error.code, message: result.error.message };
    commitProject(result.project);
    queueAutosave(result.project);
    return { ok: true, value: result.value, changed: true };
  }, [commitProject, queueAutosave]);

  const createContentRecord = useCallback((input: unknown): ContentRecordSessionMutationResult => {
    const result = createCanonicalContentRecord(projectRef.current, input);
    if (!result.ok) return { ok: false, code: result.error.code, message: result.error.message };
    commitProject(result.project);
    queueAutosave(result.project);
    return { ok: true, value: result.value, changed: true };
  }, [commitProject, queueAutosave]);

  const updateContentRecord = useCallback((id: string, input: unknown): ContentRecordSessionMutationResult => {
    const result = updateCanonicalContentRecord(projectRef.current, id, input);
    if (!result.ok) return { ok: false, code: result.error.code, message: result.error.message };
    const changed = JSON.stringify(projectRef.current.records[id]) !== JSON.stringify(result.project.records[id]);
    if (changed) {
      commitProject(result.project);
      queueAutosave(result.project);
    }
    return { ok: true, value: result.value, changed };
  }, [commitProject, queueAutosave]);

  const removeContentRecord = useCallback((id: string): ContentRecordSessionMutationResult => {
    const result = removeCanonicalContentRecord(projectRef.current, id);
    if (!result.ok) return { ok: false, code: result.error.code, message: result.error.message };
    commitProject(result.project);
    queueAutosave(result.project);
    return { ok: true, value: result.value, changed: true };
  }, [commitProject, queueAutosave]);

  const executeDocumentCommand = useCallback((command: DocumentCommand): boolean => {
    const currentProject = projectRef.current;
    const currentDocument = currentProject.documents[command.documentId];
    if (!currentDocument || currentDocument.id !== command.before.id) return false;
    const nextProject = replaceProjectDocument(currentProject, command.after);
    if (!nextProject) return false;
    commitProject(nextProject);
    setHistoryByDocument((current) => ({
      ...current,
      [command.documentId]: recordDocumentCommand(current[command.documentId] ?? EMPTY_DOCUMENT_HISTORY, command),
    }));
    queueAutosave(nextProject);
    return true;
  }, [commitProject, queueAutosave]);

  const undo = useCallback((): boolean => {
    const history = historyByDocument[activeDocumentId] ?? EMPTY_DOCUMENT_HISTORY;
    const transition = undoDocumentCommand(history);
    if (!transition) return false;
    const nextProject = replaceProjectDocument(projectRef.current, transition.document);
    if (!nextProject) return false;
    commitProject(nextProject);
    setHistoryByDocument((current) => ({ ...current, [activeDocumentId]: transition.history }));
    queueAutosave(nextProject);
    return true;
  }, [activeDocumentId, commitProject, historyByDocument, queueAutosave]);

  const redo = useCallback((): boolean => {
    const history = historyByDocument[activeDocumentId] ?? EMPTY_DOCUMENT_HISTORY;
    const transition = redoDocumentCommand(history);
    if (!transition) return false;
    const nextProject = replaceProjectDocument(projectRef.current, transition.document);
    if (!nextProject) return false;
    commitProject(nextProject);
    setHistoryByDocument((current) => ({ ...current, [activeDocumentId]: transition.history }));
    queueAutosave(nextProject);
    return true;
  }, [activeDocumentId, commitProject, historyByDocument, queueAutosave]);

  const activeHistory = historyByDocument[activeDocumentId] ?? EMPTY_DOCUMENT_HISTORY;
  const canUndo = activeHistory.past.length > 0;
  const canRedo = activeHistory.future.length > 0;

  const value = useMemo<ProjectSessionState>(() => ({
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
    setProjectTheme,
    applyThemePackageResources,
    createContentType,
    updateContentType,
    removeContentType,
    createTaxonomy,
    updateTaxonomy,
    removeTaxonomy,
    createFieldGroup,
    updateFieldGroup,
    removeFieldGroup,
    createContentRecord,
    updateContentRecord,
    removeContentRecord,
    executeDocumentCommand,
    undo,
    redo,
  }), [
    activeBreakpointId,
    activeDocumentId,
    applyThemePackageResources,
    canRedo,
    canUndo,
    createContentRecord,
    createContentType,
    createFieldGroup,
    createTaxonomy,
    executeDocumentCommand,
    project,
    redo,
    removeContentRecord,
    removeContentType,
    removeFieldGroup,
    removeTaxonomy,
    saveState,
    setActiveBreakpointId,
    setActiveDocumentId,
    setProjectTheme,
    setZoom,
    undo,
    updateContentRecord,
    updateContentType,
    updateFieldGroup,
    updateTaxonomy,
    zoom,
  ]);

  return <ProjectSessionContext.Provider value={value}>{children}</ProjectSessionContext.Provider>;
}
