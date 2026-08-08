import { registerBasicContentWidgets } from './core-basic-content-widgets';
import { registerDynamicContractWidgets } from './core-dynamic-contract-widgets';
import { registerStructuralWidgets } from './core-structural-widgets';
import { EditorWidgetRegistry } from './editor-widget-registry';

export function createDefaultEditorWidgetRegistry(): EditorWidgetRegistry {
  const registry = new EditorWidgetRegistry();
  registerStructuralWidgets(registry);
  registerBasicContentWidgets(registry);
  registerDynamicContractWidgets(registry);
  return registry;
}

export const defaultEditorWidgetRegistry = createDefaultEditorWidgetRegistry();
