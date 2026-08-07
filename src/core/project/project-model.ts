import type { JsonObject, JsonValue } from '../domain';

export const CURRENT_PROJECT_SCHEMA_VERSION = 1 as const;
export const CURRENT_NODE_SCHEMA_VERSION = 1 as const;

export type DocumentKind =
  | 'page'
  | 'template'
  | 'header'
  | 'footer'
  | 'single'
  | 'archive'
  | '404'
  | 'backend';

export type ResponsiveSlot<T> =
  | { readonly state: 'explicit'; readonly value: T }
  | { readonly state: 'inherited'; readonly fromBreakpointId: string }
  | { readonly state: 'unset' };

export type ResponsiveValue<T> = Record<string, ResponsiveSlot<T>>;
export type ResponsiveStyleSet = Record<string, ResponsiveValue<JsonValue>>;

export interface DynamicBinding extends JsonObject {
  source: string;
}

export interface VisibilityCondition extends JsonObject {
  operator: string;
}

export interface DocumentNode {
  id: string;
  type: string;
  version: number;
  name?: string;
  props: JsonObject;
  styles: ResponsiveStyleSet;
  bindings?: DynamicBinding[];
  conditions?: VisibilityCondition[];
  children: string[];
  locked?: boolean;
  hidden?: boolean;
}

export interface CanonicalDocument {
  id: string;
  kind: DocumentKind;
  name: string;
  slug?: string;
  rootNodeId: string;
  nodes: Record<string, DocumentNode>;
  metadata: JsonObject;
}

export interface ProjectMetadata {
  createdAt: string;
  updatedAt: string;
  description?: string;
}

export interface ProjectSettings {
  locale: string;
  timezone: string;
  siteTitle: string;
  localOnly: true;
}

export interface BreakpointDefinition {
  id: string;
  label: string;
  width: number;
  order: number;
  orientation: 'landscape' | 'portrait' | 'any';
}

export interface MediaAssetRef {
  id: string;
  hash: string;
  fileName: string;
  mediaType: string;
  byteSize: number;
  width?: number;
  height?: number;
  altText?: string;
  tags: string[];
}

export interface ExportMetadata {
  targets: JsonObject;
  lastExportedAt?: string;
}

export interface HistoryMetadata {
  revision: number;
  lastSavedAt?: string;
}

export type PortableModelRecord = Record<string, JsonObject>;

export interface CanonicalProject {
  schemaVersion: typeof CURRENT_PROJECT_SCHEMA_VERSION;
  id: string;
  name: string;
  version: string;
  metadata: ProjectMetadata;
  settings: ProjectSettings;

  editorThemeId: string;
  frontendThemeId: string;
  backendThemeId: string;

  documents: Record<string, CanonicalDocument>;
  documentOrder: string[];

  contentTypes: PortableModelRecord;
  taxonomies: PortableModelRecord;
  fieldGroups: PortableModelRecord;
  records: PortableModelRecord;
  relations: PortableModelRecord;

  queries: PortableModelRecord;
  forms: PortableModelRecord;
  filters: PortableModelRecord;

  roles: PortableModelRecord;
  users: PortableModelRecord;
  backend: JsonObject;
  dashboards: PortableModelRecord;

  media: Record<string, MediaAssetRef>;
  tokens: JsonObject;
  breakpoints: BreakpointDefinition[];

  exportMetadata: ExportMetadata;
  historyMetadata: HistoryMetadata;
}

export interface ProjectSummary {
  id: string;
  name: string;
  version: string;
  schemaVersion: number;
  updatedAt: string;
}
