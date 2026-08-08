import { useState, type ChangeEvent } from 'react';
import type { ProjectThemeDefinition, ThemePackageResourceSelection } from '../../core/themes';
import {
  DEFAULT_THEME_PACKAGE_RESOURCE_SELECTION,
  createThemePackageResourcesFromProject,
  parseProjectThemePackage,
  type ProjectThemePackage,
  type ProjectThemePackageResources,
} from '../../core/themes';
import { useProjectSession } from '../project/project-session-context';
import { useProjectThemePackageLibrary } from './project-theme-package-library-context';
import './project-theme-transfer.css';

export interface ProjectThemePackageTransferProps {
  theme: ProjectThemeDefinition;
}

interface TransferStatus {
  tone: 'success' | 'error' | 'info';
  message: string;
}

interface PendingImport {
  text: string;
  package: ProjectThemePackage;
}

const RESOURCE_OPTIONS: ReadonlyArray<{
  key: keyof ThemePackageResourceSelection;
  label: string;
  description: string;
}> = [
  { key: 'documents', label: 'Pages & templates', description: 'Documents and canonical node trees' },
  { key: 'contentModels', label: 'Content models', description: 'Content types, taxonomies, fields and relations' },
  { key: 'queryTools', label: 'Queries, forms & filters', description: 'Modeled query/form/filter definitions' },
  { key: 'rolesAndBackend', label: 'Roles & backend', description: 'Roles, dashboards and backend configuration' },
  { key: 'demoData', label: 'Demo data', description: 'Content records; always opt-in' },
];

function hasEntries(value: Record<string, unknown> | undefined): boolean {
  return Boolean(value && Object.keys(value).length > 0);
}

function packageHasResource(
  resources: ProjectThemePackageResources | undefined,
  key: keyof ThemePackageResourceSelection,
): boolean {
  if (!resources) return false;
  switch (key) {
    case 'documents':
      return hasEntries(resources.documents);
    case 'contentModels':
      return [resources.contentTypes, resources.taxonomies, resources.fieldGroups, resources.relations].some(hasEntries);
    case 'queryTools':
      return [resources.queries, resources.forms, resources.filters].some(hasEntries);
    case 'rolesAndBackend':
      return [resources.roles, resources.dashboards].some(hasEntries) || hasEntries(resources.backend);
    case 'demoData':
      return hasEntries(resources.records);
  }
}

function selectionForPackage(resources: ProjectThemePackageResources | undefined): ThemePackageResourceSelection {
  return {
    documents: packageHasResource(resources, 'documents'),
    contentModels: packageHasResource(resources, 'contentModels'),
    queryTools: packageHasResource(resources, 'queryTools'),
    rolesAndBackend: packageHasResource(resources, 'rolesAndBackend'),
    demoData: false,
  };
}

function summarizeReport(report: {
  documents: { imported: number; skippedConflicts: number };
  contentModels: { imported: number; skippedConflicts: number };
  queryTools: { imported: number; skippedConflicts: number };
  rolesAndBackend: { imported: number; skippedConflicts: number };
  demoData: { imported: number; skippedConflicts: number };
}): string {
  const imported = Object.values(report).reduce((total, group) => total + group.imported, 0);
  const skipped = Object.values(report).reduce((total, group) => total + group.skippedConflicts, 0);
  return `${imported} resources imported; ${skipped} existing IDs preserved.`;
}

function triggerDownload(fileName: string, text: string) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function ProjectThemePackageTransfer({ theme }: ProjectThemePackageTransferProps) {
  const session = useProjectSession();
  const library = useProjectThemePackageLibrary();
  const [exportSelection, setExportSelection] = useState<ThemePackageResourceSelection>(() => ({
    ...DEFAULT_THEME_PACKAGE_RESOURCE_SELECTION,
  }));
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null);
  const [importSelection, setImportSelection] = useState<ThemePackageResourceSelection>(() => ({
    ...DEFAULT_THEME_PACKAGE_RESOURCE_SELECTION,
  }));
  const [includeThemeDefinition, setIncludeThemeDefinition] = useState(true);
  const [status, setStatus] = useState<TransferStatus>({
    tone: 'info',
    message: 'Imports are reviewed before merge. Existing project IDs are never overwritten.',
  });

  const updateExportSelection = (key: keyof ThemePackageResourceSelection, checked: boolean) => {
    setExportSelection((current) => ({ ...current, [key]: checked }));
  };
  const updateImportSelection = (key: keyof ThemePackageResourceSelection, checked: boolean) => {
    setImportSelection((current) => ({ ...current, [key]: checked }));
  };

  const handleExport = () => {
    const resources = createThemePackageResourcesFromProject(session.project, exportSelection);
    const result = library.exportPackage(theme.id, resources);
    if (!result.ok) {
      setStatus({ tone: 'error', message: result.message });
      return;
    }
    triggerDownload(result.fileName, result.text);
    setStatus({ tone: 'success', message: `Exported ${theme.id} with the selected project resources.` });
  };

  const handleChooseImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = parseProjectThemePackage(text);
      if (!parsed.ok) {
        setPendingImport(null);
        setStatus({ tone: 'error', message: parsed.error.message });
        return;
      }
      if (parsed.value.theme.scope !== theme.scope) {
        setPendingImport(null);
        setStatus({
          tone: 'error',
          message: `This is a ${parsed.value.theme.scope} package. Import it from the matching theme workspace.`,
        });
        return;
      }
      setPendingImport({ text, package: parsed.value });
      setImportSelection(selectionForPackage(parsed.value.resources));
      setIncludeThemeDefinition(true);
      setStatus({ tone: 'info', message: 'Package validated. Review the selected contents before applying import.' });
    } catch {
      setPendingImport(null);
      setStatus({ tone: 'error', message: 'Theme package could not be read.' });
    }
  };

  const applyImport = () => {
    if (!pendingImport) return;
    let themeMessage = 'Theme definition skipped.';
    if (includeThemeDefinition) {
      const themeResult = library.importPackageText(pendingImport.text);
      if (themeResult.ok) {
        themeMessage = `Installed ${themeResult.themeId}.`;
      } else if (/already installed/i.test(themeResult.message)) {
        themeMessage = 'Theme definition already installed; existing definition preserved.';
      } else {
        setStatus({ tone: 'error', message: themeResult.message });
        return;
      }
    }

    const resourceResult = session.applyThemePackageResources(
      pendingImport.package.resources,
      importSelection,
    );
    if (!resourceResult.ok) {
      setStatus({ tone: 'error', message: resourceResult.message });
      return;
    }

    setStatus({
      tone: 'success',
      message: `${themeMessage} ${summarizeReport(resourceResult.report)}`,
    });
    setPendingImport(null);
  };

  return (
    <section className="project-theme-transfer" aria-label={`${theme.label} package transfer`}>
      <div className="project-theme-transfer-column">
        <div className="project-theme-transfer-heading">
          <span>Export contents</span>
          <strong>Build a portable package</strong>
        </div>
        <div className="project-theme-transfer-options">
          {RESOURCE_OPTIONS.map((option) => (
            <label key={option.key}>
              <input
                type="checkbox"
                checked={exportSelection[option.key]}
                onChange={(event) => updateExportSelection(option.key, event.target.checked)}
              />
              <span>
                <strong>{option.label}</strong>
                <small>{option.description}</small>
              </span>
            </label>
          ))}
        </div>
        <button type="button" onClick={handleExport}>Export selected package</button>
      </div>

      <div className="project-theme-transfer-column">
        <div className="project-theme-transfer-heading">
          <span>Import package</span>
          <strong>Validate → review → merge</strong>
        </div>
        <label className="project-theme-transfer-file">
          <span>Choose package</span>
          <input
            className="sr-only"
            type="file"
            accept=".json,application/json"
            aria-label="Choose theme package"
            onChange={handleChooseImport}
          />
        </label>

        {pendingImport ? (
          <div className="project-theme-import-review" data-testid="theme-import-review">
            <div className="project-theme-import-package-title">
              <strong>{pendingImport.package.theme.label}</strong>
              <code>{pendingImport.package.theme.id} · v{pendingImport.package.theme.version}</code>
            </div>
            <label>
              <input
                type="checkbox"
                checked={includeThemeDefinition}
                onChange={(event) => setIncludeThemeDefinition(event.target.checked)}
              />
              <span><strong>Theme definition</strong><small>Install without auto-selecting it</small></span>
            </label>
            {RESOURCE_OPTIONS.map((option) => {
              const available = packageHasResource(pendingImport.package.resources, option.key);
              return (
                <label key={option.key} data-resource-available={available ? 'true' : 'false'}>
                  <input
                    type="checkbox"
                    checked={available && importSelection[option.key]}
                    disabled={!available}
                    onChange={(event) => updateImportSelection(option.key, event.target.checked)}
                  />
                  <span>
                    <strong>{option.label}</strong>
                    <small>{available ? option.description : 'Not included in this package'}</small>
                  </span>
                </label>
              );
            })}
            <button type="button" onClick={applyImport}>Apply selected import</button>
          </div>
        ) : null}
      </div>

      <span className="project-theme-transfer-status" data-tone={status.tone} aria-live="polite">
        {status.message}
      </span>
      <p className="project-theme-transfer-security">
        User accounts, credentials and media binaries are never imported by this F04 package format.
      </p>
    </section>
  );
}
