import { createContext, useContext } from 'react';
import { emptyEditorWidgetRegistry, type EditorWidgetRegistry } from './editor-widget-registry';

export const EditorWidgetRegistryContext = createContext<EditorWidgetRegistry>(
  emptyEditorWidgetRegistry,
);

export function useEditorWidgetRegistry(): EditorWidgetRegistry {
  return useContext(EditorWidgetRegistryContext);
}
