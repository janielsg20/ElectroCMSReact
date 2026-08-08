import { useState, type ReactNode } from 'react';
import { BUILTIN_PROJECT_THEMES, ProjectThemeRegistry } from '../../core/themes';
import { ProjectThemeRegistryContext } from './project-theme-registry-context';

export interface ProjectThemeRegistryProviderProps {
  children: ReactNode;
  registry?: ProjectThemeRegistry;
}

export function ProjectThemeRegistryProvider({
  children,
  registry: registryProp,
}: ProjectThemeRegistryProviderProps) {
  const [registry] = useState(
    () => registryProp ?? new ProjectThemeRegistry(BUILTIN_PROJECT_THEMES),
  );

  return (
    <ProjectThemeRegistryContext.Provider value={registry}>
      {children}
    </ProjectThemeRegistryContext.Provider>
  );
}
