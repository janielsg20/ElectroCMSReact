import type { ReactNode } from 'react';
import { EditorWidgetRegistryContext } from './editor-widget-registry-context';
import { defaultEditorWidgetRegistry } from './core-structural-widgets';
import type { EditorWidgetRegistry } from './editor-widget-registry';

export interface EditorWidgetRegistryProviderProps {
  children: ReactNode;
  registry?: EditorWidgetRegistry;
}

export function EditorWidgetRegistryProvider({
  children,
  registry = defaultEditorWidgetRegistry,
}: EditorWidgetRegistryProviderProps) {
  return (
    <EditorWidgetRegistryContext.Provider value={registry}>
      {children}
    </EditorWidgetRegistryContext.Provider>
  );
}
