import { describe, expect, it } from 'vitest';
import {
  formatInspectorFieldValue,
  normalizeInspectorSchema,
  parseInspectorFieldValue,
  type InspectorFieldSchema,
} from './inspector-schema';

describe('inspector schema engine', () => {
  it('normalizes legacy field keys and infers editor kinds from props', () => {
    const schema = normalizeInspectorSchema(
      {
        sections: [
          { id: 'content', label: 'Content', fields: ['title', 'level', 'enabled', 'items'] },
        ],
      },
      { title: 'Hello', level: 2, enabled: true, items: ['one', 'two'] },
    );

    expect(schema.sections[0]?.fields).toEqual([
      { key: 'title', label: 'Title', kind: 'text' },
      { key: 'level', label: 'Level', kind: 'number' },
      { key: 'enabled', label: 'Enabled', kind: 'boolean' },
      { key: 'items', label: 'Items', kind: 'json' },
    ]);
  });

  it('supports rich field descriptors and select options', () => {
    const schema = normalizeInspectorSchema(
      {
        sections: [
          {
            id: 'layout',
            fields: [
              { key: 'direction', type: 'select', label: 'Direction', options: ['row', 'column'] },
              { key: 'gap', type: 'number', min: 0, max: 64, step: 4 },
            ],
          },
        ],
      },
      { direction: 'row', gap: 12 },
    );

    expect(schema.sections[0]?.fields[0]).toMatchObject({
      key: 'direction',
      kind: 'select',
      options: [
        { label: 'row', value: 'row' },
        { label: 'column', value: 'column' },
      ],
    });
    expect(schema.sections[0]?.fields[1]).toMatchObject({ key: 'gap', kind: 'number', min: 0, max: 64, step: 4 });
  });

  it('parses numbers, booleans, JSON and rejects invalid values', () => {
    const numberField: InspectorFieldSchema = { key: 'gap', label: 'Gap', kind: 'number', min: 0, max: 64 };
    const booleanField: InspectorFieldSchema = { key: 'enabled', label: 'Enabled', kind: 'boolean' };
    const jsonField: InspectorFieldSchema = { key: 'items', label: 'Items', kind: 'json' };

    expect(parseInspectorFieldValue(numberField, '16')).toEqual({ valid: true, value: 16 });
    expect(parseInspectorFieldValue(numberField, '-1').valid).toBe(false);
    expect(parseInspectorFieldValue(booleanField, true)).toEqual({ valid: true, value: true });
    expect(parseInspectorFieldValue(jsonField, '["one","two"]')).toEqual({ valid: true, value: ['one', 'two'] });
    expect(parseInspectorFieldValue(jsonField, '{broken').valid).toBe(false);
    expect(formatInspectorFieldValue(jsonField, ['one'])).toBe('[\n  "one"\n]');
  });
});
