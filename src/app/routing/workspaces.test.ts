import { describe, expect, it } from 'vitest';
import {
  getWorkspaceDefinition,
  pathForWorkspace,
  workspaceFromPathname,
  WORKSPACE_IDS,
} from './workspaces';

describe('workspace routing model', () => {
  it('maps every workspace id to a stable internal path', () => {
    expect(WORKSPACE_IDS.map((id) => pathForWorkspace(id))).toEqual([
      '/editor',
      '/preview',
      '/backend',
      '/export',
    ]);
  });

  it('parses canonical paths and ignores unsupported routes', () => {
    expect(workspaceFromPathname('/preview')).toBe('preview');
    expect(workspaceFromPathname('/backend/')).toBe('backend');
    expect(workspaceFromPathname('/unknown')).toBeNull();
    expect(getWorkspaceDefinition('export').label).toBe('Export');
  });
});
