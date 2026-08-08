import type { JsonObject } from '../domain';
import { validateCanonicalProject } from '../project';
import type {
  CanonicalDocument,
  CanonicalProject,
  PortableModelRecord,
} from '../project/project-model';
import type {
  ProjectThemePackageResources,
  ThemePackageResourceSelection,
} from './theme-package';

export interface ThemePackageMergeGroupReport {
  imported: number;
  skippedConflicts: number;
}

export interface ThemePackageMergeReport {
  documents: ThemePackageMergeGroupReport;
  contentModels: ThemePackageMergeGroupReport;
  queryTools: ThemePackageMergeGroupReport;
  rolesAndBackend: ThemePackageMergeGroupReport;
  demoData: ThemePackageMergeGroupReport;
}

export type ThemePackageMergeResult =
  | { ok: true; project: CanonicalProject; report: ThemePackageMergeReport; changed: boolean }
  | { ok: false; message: string };

function emptyGroup(): ThemePackageMergeGroupReport {
  return { imported: 0, skippedConflicts: 0 };
}

function mergeRecordMap(
  current: PortableModelRecord,
  incoming: PortableModelRecord | undefined,
): { value: PortableModelRecord; report: ThemePackageMergeGroupReport } {
  if (!incoming) return { value: current, report: emptyGroup() };
  const value = structuredClone(current);
  const report = emptyGroup();
  for (const [id, item] of Object.entries(incoming)) {
    if (id in value) {
      report.skippedConflicts += 1;
      continue;
    }
    value[id] = structuredClone(item);
    report.imported += 1;
  }
  return { value, report };
}

function mergeJsonObject(
  current: JsonObject,
  incoming: JsonObject | undefined,
): { value: JsonObject; report: ThemePackageMergeGroupReport } {
  if (!incoming) return { value: current, report: emptyGroup() };
  const value = structuredClone(current);
  const report = emptyGroup();
  for (const [key, item] of Object.entries(incoming)) {
    if (key in value) {
      report.skippedConflicts += 1;
      continue;
    }
    value[key] = structuredClone(item);
    report.imported += 1;
  }
  return { value, report };
}

function mergeDocuments(
  project: CanonicalProject,
  resources: ProjectThemePackageResources,
): {
  documents: Record<string, CanonicalDocument>;
  documentOrder: string[];
  report: ThemePackageMergeGroupReport;
} {
  const incoming = resources.documents;
  if (!incoming) {
    return {
      documents: project.documents,
      documentOrder: project.documentOrder,
      report: emptyGroup(),
    };
  }

  const documents = structuredClone(project.documents);
  const documentOrder = [...project.documentOrder];
  const report = emptyGroup();
  const requestedOrder = resources.documentOrder ?? Object.keys(incoming);
  const orderedIds = [
    ...requestedOrder.filter((id) => id in incoming),
    ...Object.keys(incoming).filter((id) => !requestedOrder.includes(id)),
  ];

  for (const id of orderedIds) {
    const document = incoming[id];
    if (!document) continue;
    if (id in documents) {
      report.skippedConflicts += 1;
      continue;
    }
    documents[id] = structuredClone(document);
    documentOrder.push(id);
    report.imported += 1;
  }
  return { documents, documentOrder, report };
}

function addReports(...reports: ThemePackageMergeGroupReport[]): ThemePackageMergeGroupReport {
  return reports.reduce(
    (total, report) => ({
      imported: total.imported + report.imported,
      skippedConflicts: total.skippedConflicts + report.skippedConflicts,
    }),
    emptyGroup(),
  );
}

export function mergeThemePackageResources(
  project: CanonicalProject,
  resources: ProjectThemePackageResources | undefined,
  selection: ThemePackageResourceSelection,
): ThemePackageMergeResult {
  if (!resources) {
    return {
      ok: true,
      project: structuredClone(project),
      report: {
        documents: emptyGroup(),
        contentModels: emptyGroup(),
        queryTools: emptyGroup(),
        rolesAndBackend: emptyGroup(),
        demoData: emptyGroup(),
      },
      changed: false,
    };
  }

  const documents = selection.documents
    ? mergeDocuments(project, resources)
    : { documents: project.documents, documentOrder: project.documentOrder, report: emptyGroup() };

  const contentTypes = selection.contentModels
    ? mergeRecordMap(project.contentTypes, resources.contentTypes)
    : { value: project.contentTypes, report: emptyGroup() };
  const taxonomies = selection.contentModels
    ? mergeRecordMap(project.taxonomies, resources.taxonomies)
    : { value: project.taxonomies, report: emptyGroup() };
  const fieldGroups = selection.contentModels
    ? mergeRecordMap(project.fieldGroups, resources.fieldGroups)
    : { value: project.fieldGroups, report: emptyGroup() };
  const relations = selection.contentModels
    ? mergeRecordMap(project.relations, resources.relations)
    : { value: project.relations, report: emptyGroup() };

  const queries = selection.queryTools
    ? mergeRecordMap(project.queries, resources.queries)
    : { value: project.queries, report: emptyGroup() };
  const forms = selection.queryTools
    ? mergeRecordMap(project.forms, resources.forms)
    : { value: project.forms, report: emptyGroup() };
  const filters = selection.queryTools
    ? mergeRecordMap(project.filters, resources.filters)
    : { value: project.filters, report: emptyGroup() };

  const roles = selection.rolesAndBackend
    ? mergeRecordMap(project.roles, resources.roles)
    : { value: project.roles, report: emptyGroup() };
  const dashboards = selection.rolesAndBackend
    ? mergeRecordMap(project.dashboards, resources.dashboards)
    : { value: project.dashboards, report: emptyGroup() };
  const backend = selection.rolesAndBackend
    ? mergeJsonObject(project.backend, resources.backend)
    : { value: project.backend, report: emptyGroup() };

  const records = selection.demoData
    ? mergeRecordMap(project.records, resources.records)
    : { value: project.records, report: emptyGroup() };

  const report: ThemePackageMergeReport = {
    documents: documents.report,
    contentModels: addReports(
      contentTypes.report,
      taxonomies.report,
      fieldGroups.report,
      relations.report,
    ),
    queryTools: addReports(queries.report, forms.report, filters.report),
    rolesAndBackend: addReports(roles.report, dashboards.report, backend.report),
    demoData: records.report,
  };
  const changed = Object.values(report).some((group) => group.imported > 0);
  const nextProject: CanonicalProject = {
    ...project,
    metadata: changed
      ? { ...project.metadata, updatedAt: new Date().toISOString() }
      : project.metadata,
    documents: documents.documents,
    documentOrder: documents.documentOrder,
    contentTypes: contentTypes.value,
    taxonomies: taxonomies.value,
    fieldGroups: fieldGroups.value,
    relations: relations.value,
    queries: queries.value,
    forms: forms.value,
    filters: filters.value,
    roles: roles.value,
    dashboards: dashboards.value,
    backend: backend.value,
    records: records.value,
  };

  const validation = validateCanonicalProject(nextProject);
  if (!validation.ok) {
    return {
      ok: false,
      message: validation.error.message,
    };
  }

  return { ok: true, project: validation.value, report, changed };
}
