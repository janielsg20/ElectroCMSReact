import { describe, expect, it } from 'vitest';
import { asEntityId, createEntityId, err, ok, unwrap } from './index';

describe('core domain primitives', () => {
  it('creates and validates typed ids', () => {
    const id = createEntityId('project', () => '00000000-0000-4000-8000-000000000001');

    expect(id).toBe('project_00000000-0000-4000-8000-000000000001');
    expect(asEntityId('project', id)).toBe(id);
    expect(() => asEntityId('project', 'document_wrong')).toThrow(TypeError);
  });

  it('unwraps success and preserves typed failures', () => {
    expect(unwrap(ok(42))).toBe(42);
    expect(() => unwrap(err(new Error('boom')))).toThrow('boom');
  });
});
