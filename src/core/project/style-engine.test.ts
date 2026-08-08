import { describe, expect, it } from 'vitest';
import { createCanonicalProject } from './project-factory';
import {
  inheritNodeResponsiveStyle,
  inheritResponsiveStyleValue,
  resolveNodeStyleValues,
  resolveResponsiveStyle,
  setNodeResponsiveStyle,
  setResponsiveStyleValue,
  unsetResponsiveStyleValue,
} from './style-engine';

describe('responsive style engine', () => {
  it('resolves explicit and inherited values without mutating the source set', () => {
    const original = {};
    const desktop = setResponsiveStyleValue(original, 'color', 'desktop', '#111111');
    const tablet = inheritResponsiveStyleValue(desktop, 'color', 'tablet', 'desktop');

    expect(original).toEqual({});
    expect(resolveResponsiveStyle(tablet, 'color', 'desktop')).toEqual({
      key: 'color', breakpointId: 'desktop', sourceBreakpointId: 'desktop', value: '#111111',
    });
    expect(resolveResponsiveStyle(tablet, 'color', 'tablet')).toEqual({
      key: 'color', breakpointId: 'tablet', sourceBreakpointId: 'desktop', value: '#111111',
    });
  });

  it('supports unset slots and rejects inheritance cycles', () => {
    const desktop = setResponsiveStyleValue({}, 'fontSize', 'desktop', 16);
    const tablet = inheritResponsiveStyleValue(desktop, 'fontSize', 'tablet', 'desktop');
    const unset = unsetResponsiveStyleValue(tablet, 'fontSize', 'mobile');

    expect(resolveResponsiveStyle(unset, 'fontSize', 'mobile')).toBeNull();
    expect(() => inheritResponsiveStyleValue(tablet, 'fontSize', 'desktop', 'tablet')).toThrow(/cycle/i);
  });

  it('updates canonical document nodes immutably and resolves a flat style map', () => {
    const project = createCanonicalProject({ id: 'project_style_test', name: 'Styles' });
    const documentId = project.documentOrder[0]!;
    const document = project.documents[documentId]!;
    const rootId = document.rootNodeId;

    const withColor = setNodeResponsiveStyle(document, rootId, 'color', 'desktop', '#334455');
    const withTabletInheritance = inheritNodeResponsiveStyle(withColor, rootId, 'color', 'tablet', 'desktop');
    const withGap = setNodeResponsiveStyle(withTabletInheritance, rootId, 'gap', 'tablet', 12);

    expect(document.nodes[rootId]!.styles).toEqual({});
    expect(resolveNodeStyleValues(withGap.nodes[rootId]!, 'tablet')).toEqual({
      color: '#334455',
      gap: 12,
    });
  });
});
