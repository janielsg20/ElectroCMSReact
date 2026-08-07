import { ConflictError } from '../domain';
import { assertCanonicalProject, type CanonicalProject, type ProjectSummary } from '../project';
import type { ProjectRepository } from './project-repository';

function cloneProject(project: CanonicalProject): CanonicalProject {
  return structuredClone(project);
}

function toSummary(project: CanonicalProject): ProjectSummary {
  return {
    id: project.id,
    name: project.name,
    version: project.version,
    schemaVersion: project.schemaVersion,
    updatedAt: project.metadata.updatedAt,
  };
}

export class MemoryProjectRepository implements ProjectRepository {
  private readonly projects = new Map<string, CanonicalProject>();

  async create(project: CanonicalProject): Promise<void> {
    assertCanonicalProject(project);
    if (this.projects.has(project.id)) {
      throw new ConflictError(`Project ${project.id} already exists.`);
    }
    this.projects.set(project.id, cloneProject(project));
  }

  async save(project: CanonicalProject): Promise<void> {
    assertCanonicalProject(project);
    this.projects.set(project.id, cloneProject(project));
  }

  async load(projectId: string): Promise<CanonicalProject | null> {
    const project = this.projects.get(projectId);
    return project ? cloneProject(project) : null;
  }

  async list(): Promise<ProjectSummary[]> {
    return [...this.projects.values()]
      .map(toSummary)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt) || left.id.localeCompare(right.id));
  }

  async delete(projectId: string): Promise<boolean> {
    return this.projects.delete(projectId);
  }
}
