import { createContext, useContext } from 'react';
import type { JsonObject } from '../../core/domain';

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

export interface ThemeLibraryMutationSuccess {
  ok: true;
  themeId: string;
  version: number;
}

export interface ThemeLibraryMutationFailure {
  ok: false;
  message: string;
}

export type ThemeLibraryMutationOutcome = ThemeLibraryMutationSuccess | ThemeLibraryMutationFailure;

export interface ImportedThemeEdit {
  label: string;
  description: string;
  tokens: JsonObject;
}

export interface ProjectThemePackageLibraryState {
  importedThemeIds: readonly string[];
  importPackageText(text: string): ThemePackageImportOutcome;
  exportPackage(themeId: string): ThemePackageExportOutcome;
  duplicateTheme(themeId: string): ThemeLibraryMutationOutcome;
  updateImportedTheme(themeId: string, edit: ImportedThemeEdit): ThemeLibraryMutationOutcome;
}

export const ProjectThemePackageLibraryContext = createContext<ProjectThemePackageLibraryState | null>(null);

export function useProjectThemePackageLibrary(): ProjectThemePackageLibraryState {
  const value = useContext(ProjectThemePackageLibraryContext);
  if (!value) {
    throw new Error('useProjectThemePackageLibrary must be used inside ProjectThemeRegistryProvider.');
  }
  return value;
}
