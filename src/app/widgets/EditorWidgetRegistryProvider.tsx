import type { ReactNode } from 'react';
import { EditorWidgetRegistryContext } from './editor-widget-registry-context';
import { emptyEditorWidgetRegistry, type EditorWidgetRegistry } from './editor-widget-registry';

export interface EditorWidgetRegistryProviderProps {
  children: ReactNode;
  registry?: EditorWidgetRegistry;
}

export function EditorWidgetRegistryProvider({
  children,
  registry = emptyEditorWidgetRegistry,
}: EditorWidgetRegistryProviderProps) {
  return (
    <EditorWidgetRegistryContext.Provider value={registry}>
      {children}
    </EditorWidgetRegistryContext.Provider>
  );
}
