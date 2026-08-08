import { describe, expect, it } from 'vitest';
import {
  EDITOR_MODULE_IDS,
  editorModuleFromPathname,
  pathForEditorModule,
} from './editor-modules';

describe('editor module routing model', () => {
  it('maps every editor module to a stable deep link', () => {
    expect(EDITOR_MODULE_IDS.map((id) => pathForEditorModule(id))).toEqual([
      '/editor',
      '/editor/pages',
      '/editor/content',
      '/editor/queries',
      '/editor/forms',
      '/editor/filters',
      '/editor/media',
      '/editor/themes',
      '/editor/roles',
      '/editor/blueprints',
      '/editor/settings',
    ]);
  });

  it('parses canonical module paths and rejects unsupported editor paths', () => {
    expect(editorModuleFromPathname('/editor')).toBe('builder');
    expect(editorModuleFromPathname('/editor/content/')).toBe('content');
    expect(editorModuleFromPathname('/editor/roles')).toBe('users');
    expect(editorModuleFromPathname('/editor/unknown')).toBeNull();
  });
});
