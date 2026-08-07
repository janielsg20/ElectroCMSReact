import type { CanonicalProject, ProjectSummary } from '../project';

export interface ProjectRepository {
  create(project: CanonicalProject): Promise<void>;
  save(project: CanonicalProject): Promise<void>;
  load(projectId: string): Promise<CanonicalProject | null>;
  list(): Promise<ProjectSummary[]>;
  delete(projectId: string): Promise<boolean>;
}

export type ProjectHydrator = (payload: unknown) => CanonicalProject;
