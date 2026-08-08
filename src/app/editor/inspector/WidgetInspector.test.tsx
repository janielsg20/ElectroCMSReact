import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createDefaultEditorWidgetRegistry } from '../../widgets/default-editor-widget-registry';
import { EditorWidgetRegistryProvider } from '../../widgets/EditorWidgetRegistryProvider';
import { WidgetInspector } from './WidgetInspector';

describe('WidgetInspector', () => {
  it('renders fields from the registered widget inspector schema', () => {
    const registry = createDefaultEditorWidgetRegistry();
    const heading = registry.createNode('core/heading', {
      id: 'node_heading',
      name: 'Hero heading',
    });

    render(
      <EditorWidgetRegistryProvider registry={registry}>
        <WidgetInspector node={heading} />
      </EditorWidgetRegistryProvider>,
    );

    expect(screen.getByRole('complementary', { name: 'Widget inspector' })).toHaveTextContent('Hero heading');
    expect(screen.getByLabelText('Text')).toHaveValue('Heading');
    expect(screen.getByLabelText('Level')).toHaveValue(2);
  });

  it('parses field input and delegates canonical prop edits', () => {
    const registry = createDefaultEditorWidgetRegistry();
    const heading = registry.createNode('core/heading', {
      id: 'node_heading',
      name: 'Hero heading',
    });
    const onSetProps = vi.fn(() => ({ applied: true, issues: [] }));

    render(
      <EditorWidgetRegistryProvider registry={registry}>
        <WidgetInspector node={heading} onSetProps={onSetProps} />
      </EditorWidgetRegistryProvider>,
    );

    fireEvent.change(screen.getByLabelText('Text'), { target: { value: 'Edited heading' } });
    fireEvent.blur(screen.getByLabelText('Text'));
    fireEvent.change(screen.getByLabelText('Level'), { target: { value: '3' } });
    fireEvent.blur(screen.getByLabelText('Level'));

    expect(onSetProps).toHaveBeenNthCalledWith(1, 'node_heading', { text: 'Edited heading' });
    expect(onSetProps).toHaveBeenNthCalledWith(2, 'node_heading', { level: 3 });
  });

  it('collapses and expands schema sections without changing node data', () => {
    const registry = createDefaultEditorWidgetRegistry();
    const heading = registry.createNode('core/heading', {
      id: 'node_heading',
      name: 'Hero heading',
    });

    render(
      <EditorWidgetRegistryProvider registry={registry}>
        <WidgetInspector node={heading} />
      </EditorWidgetRegistryProvider>,
    );

    const textField = screen.getByLabelText('Text');
    const section = textField.closest('.widget-inspector-section');
    expect(section).not.toBeNull();
    const disclosure = within(section as HTMLElement).getByRole('button');
    expect(disclosure).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(disclosure);
    expect(disclosure).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByLabelText('Text')).not.toBeInTheDocument();

    fireEvent.click(disclosure);
    expect(screen.getByLabelText('Text')).toHaveValue('Heading');
  });

  it('shows an empty inspector when there is no single selection', () => {
    const registry = createDefaultEditorWidgetRegistry();
    render(
      <EditorWidgetRegistryProvider registry={registry}>
        <WidgetInspector node={null} />
      </EditorWidgetRegistryProvider>,
    );

    expect(screen.getByText('Select one widget to inspect its properties.')).toBeInTheDocument();
  });
});
