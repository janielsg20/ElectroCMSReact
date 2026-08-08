import { createElement, type ComponentType, type ReactNode } from 'react';
import type { DocumentNode } from '../../core/project';
import { WidgetRegistry, type WidgetDefinition, type WidgetNodeFactoryContext } from '../../core/widgets';

export interface WidgetPreviewProps {
  node: DocumentNode;
  breakpointId: string;
  selected: boolean;
  children: ReactNode;
}

export type WidgetPreviewComponent = ComponentType<WidgetPreviewProps>;

export interface EditorWidgetRegistration {
  definition: WidgetDefinition;
  Preview: WidgetPreviewComponent;
}

function previewKey(type: string, version: number): string {
  return `${type}@${version}`;
}

export class EditorWidgetRegistry {
  readonly core: WidgetRegistry;
  private readonly previews = new Map<string, WidgetPreviewComponent>();

  constructor(core = new WidgetRegistry()) {
    this.core = core;
  }

  register(registration: EditorWidgetRegistration): void {
    this.core.register(registration.definition);
    this.previews.set(
      previewKey(registration.definition.type, registration.definition.version),
      registration.Preview,
    );
  }

  has(type: string, version?: number): boolean {
    return this.core.has(type, version);
  }

  hasPreview(type: string, version: number): boolean {
    return this.core.has(type, version) && this.previews.has(previewKey(type, version));
  }

  createNode(type: string, context: WidgetNodeFactoryContext, version?: number): DocumentNode {
    return this.core.createNode(type, context, version);
  }

  renderPreview(type: string, version: number, props: WidgetPreviewProps): ReactNode | null {
    if (!this.core.has(type, version)) return null;
    const Preview = this.previews.get(previewKey(type, version));
    return Preview ? createElement(Preview, props) : null;
  }
}

export const emptyEditorWidgetRegistry = new EditorWidgetRegistry();
