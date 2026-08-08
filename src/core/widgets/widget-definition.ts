import type { JsonObject } from '../domain';
import type { DocumentNode, ResponsiveStyleSet } from '../project';

export const WIDGET_CATEGORIES = [
  'structural',
  'basic',
  'content',
  'dynamic',
  'commerce',
  'form',
  'filter',
] as const;

export type WidgetCategory = (typeof WIDGET_CATEGORIES)[number];

export const WIDGET_EXPORT_TARGETS = ['local', 'react', 'lamp', 'wordpress'] as const;
export type WidgetExportTarget = (typeof WIDGET_EXPORT_TARGETS)[number];

export type WidgetCapabilityStatus =
  | 'planned'
  | 'modeled'
  | 'interactive-demo'
  | 'production-ready';

export interface WidgetMetadata {
  name: string;
  category: WidgetCategory;
  icon: string;
  description: string;
  keywords?: readonly string[];
}

export type WidgetChildPolicy =
  | { kind: 'none' }
  | {
      kind: 'any';
      minChildren?: number;
      maxChildren?: number;
    }
  | {
      kind: 'allowlist';
      allowedTypes: readonly string[];
      minChildren?: number;
      maxChildren?: number;
    };

export interface WidgetPropValidationIssue {
  code: string;
  path: string;
  message: string;
}

export interface WidgetPropValidationResult {
  valid: boolean;
  issues: readonly WidgetPropValidationIssue[];
}

export interface WidgetNodeFactoryContext {
  id: string;
  name?: string;
  props?: JsonObject;
  styles?: ResponsiveStyleSet;
  children?: readonly string[];
}

export type WidgetNodeFactory = (context: WidgetNodeFactoryContext) => DocumentNode;
export type WidgetPropValidator = (props: JsonObject) => WidgetPropValidationResult;

export interface WidgetMigrationHook {
  fromVersion: number;
  toVersion: number;
  migrate(node: DocumentNode): DocumentNode;
}

export interface WidgetDefinition {
  type: string;
  version: number;
  metadata: WidgetMetadata;
  createNode: WidgetNodeFactory;
  propSchema: JsonObject;
  validateProps: WidgetPropValidator;
  inspectorSchema: JsonObject;
  childPolicy: WidgetChildPolicy;
  previewRendererId: string;
  capabilities: Readonly<Record<WidgetExportTarget, WidgetCapabilityStatus>>;
  migrations: readonly WidgetMigrationHook[];
}

export function validWidgetProps(): WidgetPropValidationResult {
  return { valid: true, issues: [] };
}
