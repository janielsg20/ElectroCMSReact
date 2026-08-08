export const EDITOR_MODULE_IDS = [
  'builder',
  'pages',
  'content',
  'queries',
  'forms',
  'filters',
  'media',
  'themes',
  'users',
  'blueprints',
  'settings',
] as const;

export type EditorModuleId = (typeof EDITOR_MODULE_IDS)[number];

const modulePathById: Record<EditorModuleId, string> = {
  builder: '/editor',
  pages: '/editor/pages',
  content: '/editor/content',
  queries: '/editor/queries',
  forms: '/editor/forms',
  filters: '/editor/filters',
  media: '/editor/media',
  themes: '/editor/themes',
  users: '/editor/roles',
  blueprints: '/editor/blueprints',
  settings: '/editor/settings',
};

const moduleIdByPath = new Map(
  Object.entries(modulePathById).map(([id, path]) => [path, id as EditorModuleId]),
);

function normalizePathname(pathname: string): string {
  return pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
}

export function isEditorModuleId(value: unknown): value is EditorModuleId {
  return typeof value === 'string' && EDITOR_MODULE_IDS.includes(value as EditorModuleId);
}

export function editorModuleFromPathname(pathname: string): EditorModuleId | null {
  return moduleIdByPath.get(normalizePathname(pathname)) ?? null;
}

export function pathForEditorModule(moduleId: EditorModuleId): string {
  return modulePathById[moduleId];
}
