import { useCallback, useMemo, useState, type ReactNode } from 'react';
import {
  BUILTIN_PROJECT_THEMES,
  ProjectThemeRegistry,
  parseProjectThemePackage,
  serializeProjectThemePackage,
  validateProjectThemeDefinition,
  type ProjectThemeDefinition,
} from '../../core/themes';
import {
  BrowserProjectThemePackageRepository,
  type ProjectThemePackageRepository,
} from './project-theme-package-repository';
import {
  ProjectThemePackageLibraryContext,
  type ImportedThemeEdit,
  type ProjectThemePackageLibraryState,
  type ThemeLibraryMutationOutcome,
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

function createDuplicateThemeId(sourceId: string, registry: ProjectThemeRegistry): string {
  const separatorIndex = sourceId.indexOf('.');
  const scope = separatorIndex > 0 ? sourceId.slice(0, separatorIndex) : 'frontend';
  const tail = separatorIndex > 0 ? sourceId.slice(separatorIndex + 1) : sourceId;
  const base = `${scope}.${tail.replace(/-copy(?:-\d+)?$/, '')}-copy`;
  if (!registry.has(base)) return base;
  let suffix = 2;
  while (registry.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

export function ProjectThemeRegistryProvider({
  children,
  registry: registryProp,
  packageRepository: packageRepositoryProp,
}: ProjectThemeRegistryProviderProps) {
  const [baseDefinitions] = useState<readonly ProjectThemeDefinition[]>(() =>
    registryProp ? registryProp.list() : BUILTIN_PROJECT_THEMES,
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

  const commitImportedThemes = useCallback(
    (next: ProjectThemeDefinition[]) => {
      packageRepository.save(next);
      setImportedThemes(next);
    },
    [packageRepository],
  );

  const importPackageText = useCallback(
    (text: string): ThemePackageImportOutcome => {
      const parsed = parseProjectThemePackage(text);
      if (!parsed.ok) return { ok: false, message: parsed.error.message };
      const theme = parsed.value.theme;
      if (registry.has(theme.id)) {
        return { ok: false, message: `Theme ${theme.id} is already installed.` };
      }

      commitImportedThemes([...importedThemes, structuredClone(theme)]);
      return { ok: true, themeId: theme.id };
    },
    [commitImportedThemes, importedThemes, registry],
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

  const duplicateTheme = useCallback(
    (themeId: string): ThemeLibraryMutationOutcome => {
      const source = registry.get(themeId);
      if (!source) return { ok: false, message: `Theme ${themeId} is not installed.` };
      const id = createDuplicateThemeId(source.id, registry);
      const candidate: ProjectThemeDefinition = {
        ...source,
        id,
        version: 1,
        label: `${source.label} Copy`,
        description: `Editable local copy of ${source.label}.`,
        tokens: structuredClone(source.tokens),
      };
      const validation = validateProjectThemeDefinition(candidate);
      if (!validation.valid) {
        return { ok: false, message: validation.issues.map((issue) => issue.message).join(' ') };
      }
      commitImportedThemes([...importedThemes, validation.value]);
      return { ok: true, themeId: id, version: 1 };
    },
    [commitImportedThemes, importedThemes, registry],
  );

  const updateImportedTheme = useCallback(
    (themeId: string, edit: ImportedThemeEdit): ThemeLibraryMutationOutcome => {
      const index = importedThemes.findIndex((theme) => theme.id === themeId);
      if (index < 0) return { ok: false, message: 'Built-in themes are immutable. Duplicate the theme before editing.' };
      const current = importedThemes[index]!;
      const candidate: ProjectThemeDefinition = {
        ...current,
        version: current.version + 1,
        label: edit.label.trim(),
        description: edit.description.trim(),
        tokens: structuredClone(edit.tokens),
      };
      const validation = validateProjectThemeDefinition(candidate);
      if (!validation.valid) {
        return { ok: false, message: validation.issues.map((issue) => issue.message).join(' ') };
      }
      const next = [...importedThemes];
      next[index] = validation.value;
      commitImportedThemes(next);
      return { ok: true, themeId, version: validation.value.version };
    },
    [commitImportedThemes, importedThemes],
  );

  const packageLibrary = useMemo<ProjectThemePackageLibraryState>(
    () => ({
      importedThemeIds: importedThemes.map((theme) => theme.id),
      importPackageText,
      exportPackage,
      duplicateTheme,
      updateImportedTheme,
    }),
    [duplicateTheme, exportPackage, importPackageText, importedThemes, updateImportedTheme],
  );

  return (
    <ProjectThemePackageLibraryContext.Provider value={packageLibrary}>
      <ProjectThemeRegistryContext.Provider value={registry}>
        {children}
      </ProjectThemeRegistryContext.Provider>
    </ProjectThemePackageLibraryContext.Provider>
  );
}
