import { createContext, useContext } from 'react';
import type { ProjectThemeRegistry } from '../../core/themes';

export const ProjectThemeRegistryContext = createContext<ProjectThemeRegistry | null>(null);

export function useProjectThemeRegistry(): ProjectThemeRegistry {
  const value = useContext(ProjectThemeRegistryContext);
  if (!value) throw new Error('useProjectThemeRegistry must be used inside ProjectThemeRegistryProvider.');
  return value;
}
