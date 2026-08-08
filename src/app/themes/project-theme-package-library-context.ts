import { createContext, useContext } from 'react';

export interface ThemePackageImportSuccess {
  ok: true;
  themeId: string;
}

export interface ThemePackageImportFailure {
  ok: false;
  message: string;
}

export type ThemePackageImportOutcome = ThemePackageImportSuccess | ThemePackageImportFailure;

export interface ThemePackageExportSuccess {
  ok: true;
  fileName: string;
  text: string;
}

export interface ThemePackageExportFailure {
  ok: false;
  message: string;
}

export type ThemePackageExportOutcome = ThemePackageExportSuccess | ThemePackageExportFailure;

export interface ProjectThemePackageLibraryState {
  importedThemeIds: readonly string[];
  importPackageText(text: string): ThemePackageImportOutcome;
  exportPackage(themeId: string): ThemePackageExportOutcome;
}

export const ProjectThemePackageLibraryContext = createContext<ProjectThemePackageLibraryState | null>(null);

export function useProjectThemePackageLibrary(): ProjectThemePackageLibraryState {
  const value = useContext(ProjectThemePackageLibraryContext);
  if (!value) {
    throw new Error('useProjectThemePackageLibrary must be used inside ProjectThemeRegistryProvider.');
  }
  return value;
}
