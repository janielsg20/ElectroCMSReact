import { useEffect, useMemo, useState, type MouseEvent } from 'react';
import {
  readNodeGeometry,
  type BreakpointDefinition,
  type CanonicalDocument,
  type DocumentClipboardPayload,
  type NodeGeometryPatch,
  type SnapGuide,
} from '../../../core/project';
import { WidgetInspector } from '../inspector/WidgetInspector';
import { useEditorWidgetRegistry } from '../../widgets/editor-widget-registry-context';
import { CanvasOverlayLayer } from './CanvasOverlayLayer';
import { CanvasRenderer } from './CanvasRenderer';
import type { CanvasDocumentActions } from './use-canvas-document-actions';
import { useCanvasSelection } from './use-canvas-selection';

const INSERT_CATEGORY_ORDER = ['structural', 'basic', 'content', 'dynamic', 'commerce', 'form', 'filter'] as const;

export interface EditorCanvasProps {
  document: CanonicalDocument;
  breakpointId: string;
  breakpoints?: readonly BreakpointDefinition[];
  viewportWidth: number;
  zoom: number;
  actions?: CanvasDocumentActions;
}

export function EditorCanvas({
  document,
  breakpointId,
  breakpoints = [],
  viewportWidth,
  zoom,
  actions,
}: EditorCanvasProps) {
  const widgetRegistry = useEditorWidgetRegistry();
  const selection = useCanvasSelection(Object.keys(document.nodes));
  const clearSelection = selection.clearSelection;
  const [clipboard, setClipboard] = useState<DocumentClipboardPayload | null>(null);
  const [guides, setGuides] = useState<readonly SnapGuide[]>([]);
  const insertableWidgets = useMemo(
    () =>
      widgetRegistry.core.listLatest().sort((left, right) => {
        const categoryDelta =
          INSERT_CATEGORY_ORDER.indexOf(left.metadata.category) -
          INSERT_CATEGORY_ORDER.indexOf(right.metadata.category);
        return categoryDelta || left.metadata.name.localeCompare(right.metadata.name);
      }),
    [widgetRegistry],
  );
  const [insertWidgetType, setInsertWidgetType] = useState('core/section');
  const selectedNodes = useMemo(
    () => selection.selectedNodeIds.flatMap((nodeId) => {
      const node = document.nodes[nodeId];
      return node ? [node] : [];
    }),
    [document.nodes, selection.selectedNodeIds],
  );
  const primaryNode = selection.primaryNodeId
    ? document.nodes[selection.primaryNodeId] ?? null
    : null;
  const primaryGeometry = primaryNode ? readNodeGeometry(primaryNode, breakpointId) : null;
  const allLocked = selectedNodes.length > 0 && selectedNodes.every((node) => node.locked === true);
  const allHidden = selectedNodes.length > 0 && selectedNodes.every((node) => node.hidden === true);
  const canUngroup = selectedNodes.length === 1 && primaryNode?.type === 'core/group';
  const canEditGeometry = selectedNodes.length === 1 && primaryNode?.locked !== true;
  const canInsertSelectedWidget = widgetRegistry.has(insertWidgetType);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        clearSelection();
        setGuides([]);
      }
    };
    globalThis.addEventListener('keydown', handleKeyDown);
    return () => globalThis.removeEventListener('keydown', handleKeyDown);
  }, [clearSelection]);

  const stopToolbarPropagation = (event: MouseEvent<HTMLDivElement>) => event.stopPropagation();

  const selectIds = (nodeIds: readonly string[]) => {
    clearSelection();
    setGuides([]);
    nodeIds.forEach((nodeId, index) => selection.selectNode(nodeId, index > 0));
  };

  const selectNode = (nodeId: string, additive: boolean) => {
    setGuides([]);
    selection.selectNode(nodeId, additive);
  };

  const copySelection = () => {
    const nextClipboard = actions?.copyNodes(selection.selectedNodeIds) ?? null;
    if (nextClipboard) setClipboard(nextClipboard);
  };

  const cutSelection = () => {
    const nextClipboard = actions?.cutNodes(selection.selectedNodeIds) ?? null;
    if (!nextClipboard) return;
    setClipboard(nextClipboard);
    clearSelection();
    setGuides([]);
  };

  const pasteSelection = () => {
    if (!actions || !clipboard) return;
    const pastedIds = actions.pasteClipboard(clipboard);
    if (pastedIds.length > 0) selectIds(pastedIds);
  };

  const groupSelection = () => {
    const groupId = actions?.groupNodes(selection.selectedNodeIds) ?? null;
    if (groupId) selectIds([groupId]);
  };

  const ungroupSelection = () => {
    if (!actions || !selection.primaryNodeId || !canUngroup) return;
    if (actions.ungroupNode(selection.primaryNodeId)) {
      clearSelection();
      setGuides([]);
    }
  };

  const toggleLocked = () => {
    if (!actions) return;
    actions.setLocked(selection.selectedNodeIds, !allLocked);
  };

  const toggleHidden = () => {
    if (!actions) return;
    actions.setHidden(selection.selectedNodeIds, !allHidden);
  };

  const applyGeometry = (patch: NodeGeometryPatch) => {
    if (!actions || !primaryNode || !canEditGeometry) return;
    const result = actions.setGeometry(primaryNode.id, patch, viewportWidth);
    setGuides(result.applied ? result.guides : []);
  };

  const numericGeometryChange = (key: keyof NodeGeometryPatch, rawValue: string) => {
    if (rawValue.trim() === '') return;
    const value = Number(rawValue);
    if (!Number.isFinite(value)) return;
    applyGeometry({ [key]: value });
  };

  return (
    <section
      className="editor-canvas"
      aria-label="Visual document canvas"
      data-testid="editor-canvas"
      onClick={() => {
        clearSelection();
        setGuides([]);
      }}
    >
      {actions ? (
        <div className="canvas-command-bar" aria-label="Canvas commands" onClick={stopToolbarPropagation}>
          <label className="canvas-insert-control">
            <span>Insert</span>
            <select aria-label="Widget to insert" value={insertWidgetType} onChange={(event) => setInsertWidgetType(event.target.value)}>
              {insertableWidgets.map((definition) => (
                <option key={definition.type} value={definition.type}>
                  {definition.metadata.category} · {definition.metadata.name}
                  {definition.capabilities.local === 'modeled' ? ' · modeled' : ''}
                </option>
              ))}
            </select>
          </label>
          <button type="button" disabled={!canInsertSelectedWidget} onClick={() => actions.insertWidget(insertWidgetType)}>Insert widget</button>
          <button type="button" onClick={() => actions.insertContainer()}>Insert container</button>
          <span className="canvas-command-divider" aria-hidden="true" />
          <button type="button" disabled={selectedNodes.length === 0} onClick={copySelection}>Copy</button>
          <button type="button" disabled={selectedNodes.length === 0} onClick={cutSelection}>Cut</button>
          <button type="button" disabled={!clipboard} onClick={pasteSelection}>Paste{clipboard ? ` (${clipboard.rootNodeIds.length})` : ''}</button>
          <span className="canvas-command-divider" aria-hidden="true" />
          <button type="button" disabled={selectedNodes.length < 2} onClick={groupSelection}>Group</button>
          <button type="button" disabled={!canUngroup} onClick={ungroupSelection}>Ungroup</button>
          <button type="button" disabled={selectedNodes.length === 0} onClick={toggleLocked}>{allLocked ? 'Unlock' : 'Lock'}</button>
          <button type="button" disabled={selectedNodes.length === 0} onClick={toggleHidden}>{allHidden ? 'Show' : 'Hide'}</button>
          <output className="canvas-selection-summary" aria-live="polite">{selectedNodes.length} selected</output>
          {primaryGeometry && selectedNodes.length === 1 ? (
            <div className="canvas-geometry-controls" aria-label="Selected node geometry">
              <span className="canvas-command-divider" aria-hidden="true" />
              <label><span>X</span><input aria-label="X position" type="number" value={primaryGeometry.x} disabled={!canEditGeometry} onChange={(event) => numericGeometryChange('x', event.target.value)} /></label>
              <label><span>Y</span><input aria-label="Y position" type="number" value={primaryGeometry.y} disabled={!canEditGeometry} onChange={(event) => numericGeometryChange('y', event.target.value)} /></label>
              <label><span>W</span><input aria-label="Node width" type="number" min="32" placeholder="auto" value={primaryGeometry.width ?? ''} disabled={!canEditGeometry} onChange={(event) => numericGeometryChange('width', event.target.value)} /></label>
              <label><span>H</span><input aria-label="Node height" type="number" min="32" placeholder="auto" value={primaryGeometry.height ?? ''} disabled={!canEditGeometry} onChange={(event) => numericGeometryChange('height', event.target.value)} /></label>
              <button type="button" aria-label="Nudge left" disabled={!canEditGeometry} onClick={() => applyGeometry({ x: primaryGeometry.x - 8 })}>←</button>
              <button type="button" aria-label="Nudge right" disabled={!canEditGeometry} onClick={() => applyGeometry({ x: primaryGeometry.x + 8 })}>→</button>
              <button type="button" aria-label="Nudge up" disabled={!canEditGeometry} onClick={() => applyGeometry({ y: primaryGeometry.y - 8 })}>↑</button>
              <button type="button" aria-label="Nudge down" disabled={!canEditGeometry} onClick={() => applyGeometry({ y: primaryGeometry.y + 8 })}>↓</button>
            </div>
          ) : null}
        </div>
      ) : null}
      <div className="editor-canvas-layers">
        <CanvasRenderer
          document={document}
          breakpointId={breakpointId}
          viewportWidth={viewportWidth}
          zoom={zoom}
          selectedNodeIds={selection.selectedNodeIds}
          onSelectNode={selectNode}
          {...(actions ? { onMoveNode: actions.moveNode } : {})}
        />
        <CanvasOverlayLayer viewportWidth={viewportWidth} zoom={zoom} selectedNodeIds={selection.selectedNodeIds} guides={guides} />
      </div>
      <div onClick={stopToolbarPropagation}>
        <WidgetInspector
          node={selectedNodes.length === 1 ? primaryNode : null}
          breakpointId={breakpointId}
          breakpoints={breakpoints}
          {...(actions
            ? {
                onSetProps: actions.setProps,
                onSetStyle: actions.setStyle,
                onUnsetStyle: actions.unsetStyle,
                onInheritStyle: actions.inheritStyle,
              }
            : {})}
        />
      </div>
    </section>
  );
}
