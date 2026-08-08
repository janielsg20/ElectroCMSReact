import { useCallback, useMemo, useState, type ReactNode } from 'react';
import {
  BUILTIN_PROJECT_THEMES,
  ProjectThemeRegistry,
  parseProjectThemePackage,
  serializeProjectThemePackage,
  type ProjectThemeDefinition,
} from '../../core/themes';
import {
  BrowserProjectThemePackageRepository,
  type ProjectThemePackageRepository,
} from './project-theme-package-repository';
import {
  ProjectThemePackageLibraryContext,
  type ProjectThemePackageLibraryState,
  type ThemePackageExportOutcome,
  type ThemePackageImportOutcome,
} from './project-theme-package-library-context';
import { ProjectThemeRegistryContext } from './project-theme-registry-context';

export interface ProjectThemeRegistryProviderProps {
  children: ReactNode;
  registry?: ProjectThemeRegistry;
  packageRepository?: ProjectThemePackageRepository;
}

function safeImportedThemes(
  candidates: readonly ProjectThemeDefinition[],
  baseDefinitions: readonly ProjectThemeDefinition[],
): ProjectThemeDefinition[] {
  const reserved = new Set(baseDefinitions.map((theme) => theme.id));
  const accepted: ProjectThemeDefinition[] = [];
  for (const candidate of candidates) {
    if (reserved.has(candidate.id)) continue;
    reserved.add(candidate.id);
    accepted.push(structuredClone(candidate));
  }
  return accepted;
}

export function ProjectThemeRegistryProvider({
  children,
  registry: registryProp,
  packageRepository: packageRepositoryProp,
}: ProjectThemeRegistryProviderProps) {
  const [baseDefinitions] = useState<ProjectThemeDefinition[]>(() =>
    registryProp ? registryProp.list() : structuredClone(BUILTIN_PROJECT_THEMES),
  );
  const [packageRepository] = useState<ProjectThemePackageRepository>(
    () => packageRepositoryProp ?? new BrowserProjectThemePackageRepository(),
  );
  const [importedThemes, setImportedThemes] = useState<ProjectThemeDefinition[]>(() =>
    safeImportedThemes(packageRepository.load(), baseDefinitions),
  );

  const registry = useMemo(
    () => new ProjectThemeRegistry([...baseDefinitions, ...importedThemes]),
    [baseDefinitions, importedThemes],
  );

  const importPackageText = useCallback(
    (text: string): ThemePackageImportOutcome => {
      const parsed = parseProjectThemePackage(text);
      if (!parsed.ok) return { ok: false, message: parsed.error.message };
      const theme = parsed.value.theme;
      if (registry.has(theme.id)) {
        return { ok: false, message: `Theme ${theme.id} is already installed.` };
      }

      const next = [...importedThemes, structuredClone(theme)];
      packageRepository.save(next);
      setImportedThemes(next);
      return { ok: true, themeId: theme.id };
    },
    [importedThemes, packageRepository, registry],
  );

  const exportPackage = useCallback(
    (themeId: string): ThemePackageExportOutcome => {
      const theme = registry.get(themeId);
      if (!theme) return { ok: false, message: `Theme ${themeId} is not installed.` };
      return {
        ok: true,
        fileName: `${theme.id.replaceAll('.', '-')}.electrocms-theme.json`,
        text: serializeProjectThemePackage(theme),
      };
    },
    [registry],
  );

  const packageLibrary = useMemo<ProjectThemePackageLibraryState>(
    () => ({
      importedThemeIds: importedThemes.map((theme) => theme.id),
      importPackageText,
      exportPackage,
    }),
    [exportPackage, importPackageText, importedThemes],
  );

  return (
    <ProjectThemePackageLibraryContext.Provider value={packageLibrary}>
      <ProjectThemeRegistryContext.Provider value={registry}>
        {children}
      </ProjectThemeRegistryContext.Provider>
    </ProjectThemePackageLibraryContext.Provider>
  );
}
