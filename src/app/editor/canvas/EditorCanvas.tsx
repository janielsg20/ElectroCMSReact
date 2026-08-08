import { useEffect, useMemo, useState, type MouseEvent } from 'react';
import type { CanonicalDocument, DocumentClipboardPayload } from '../../../core/project';
import { CanvasOverlayLayer } from './CanvasOverlayLayer';
import { CanvasRenderer } from './CanvasRenderer';
import type { CanvasDocumentActions } from './use-canvas-document-actions';
import { useCanvasSelection } from './use-canvas-selection';

export interface EditorCanvasProps {
  document: CanonicalDocument;
  viewportWidth: number;
  zoom: number;
  actions?: CanvasDocumentActions;
}

export function EditorCanvas({ document, viewportWidth, zoom, actions }: EditorCanvasProps) {
  const selection = useCanvasSelection(Object.keys(document.nodes));
  const [clipboard, setClipboard] = useState<DocumentClipboardPayload | null>(null);
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
  const allLocked = selectedNodes.length > 0 && selectedNodes.every((node) => node.locked === true);
  const allHidden = selectedNodes.length > 0 && selectedNodes.every((node) => node.hidden === true);
  const canUngroup = selectedNodes.length === 1 && primaryNode?.type === 'core/group';

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') selection.clearSelection();
    };
    globalThis.addEventListener('keydown', handleKeyDown);
    return () => globalThis.removeEventListener('keydown', handleKeyDown);
  }, [selection.clearSelection]);

  const stopToolbarPropagation = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  const selectIds = (nodeIds: readonly string[]) => {
    selection.clearSelection();
    nodeIds.forEach((nodeId, index) => selection.selectNode(nodeId, index > 0));
  };

  const copySelection = () => {
    const nextClipboard = actions?.copyNodes(selection.selectedNodeIds) ?? null;
    if (nextClipboard) setClipboard(nextClipboard);
  };

  const cutSelection = () => {
    const nextClipboard = actions?.cutNodes(selection.selectedNodeIds) ?? null;
    if (!nextClipboard) return;
    setClipboard(nextClipboard);
    selection.clearSelection();
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
    if (actions.ungroupNode(selection.primaryNodeId)) selection.clearSelection();
  };

  const toggleLocked = () => {
    if (!actions) return;
    actions.setLocked(selection.selectedNodeIds, !allLocked);
  };

  const toggleHidden = () => {
    if (!actions) return;
    actions.setHidden(selection.selectedNodeIds, !allHidden);
  };

  return (
    <section
      className="editor-canvas"
      aria-label="Visual document canvas"
      data-testid="editor-canvas"
      onClick={selection.clearSelection}
    >
      {actions ? (
        <div
          className="canvas-command-bar"
          aria-label="Canvas commands"
          onClick={stopToolbarPropagation}
        >
          <button type="button" onClick={() => actions.insertContainer()}>
            Insert container
          </button>
          <span className="canvas-command-divider" aria-hidden="true" />
          <button type="button" disabled={selectedNodes.length === 0} onClick={copySelection}>
            Copy
          </button>
          <button type="button" disabled={selectedNodes.length === 0} onClick={cutSelection}>
            Cut
          </button>
          <button type="button" disabled={!clipboard} onClick={pasteSelection}>
            Paste{clipboard ? ` (${clipboard.rootNodeIds.length})` : ''}
          </button>
          <span className="canvas-command-divider" aria-hidden="true" />
          <button type="button" disabled={selectedNodes.length < 2} onClick={groupSelection}>
            Group
          </button>
          <button type="button" disabled={!canUngroup} onClick={ungroupSelection}>
            Ungroup
          </button>
          <button type="button" disabled={selectedNodes.length === 0} onClick={toggleLocked}>
            {allLocked ? 'Unlock' : 'Lock'}
          </button>
          <button type="button" disabled={selectedNodes.length === 0} onClick={toggleHidden}>
            {allHidden ? 'Show' : 'Hide'}
          </button>
          <output className="canvas-selection-summary" aria-live="polite">
            {selectedNodes.length} selected
          </output>
        </div>
      ) : null}
      <div className="editor-canvas-layers">
        <CanvasRenderer
          document={document}
          viewportWidth={viewportWidth}
          zoom={zoom}
          selectedNodeIds={selection.selectedNodeIds}
          onSelectNode={selection.selectNode}
          {...(actions ? { onMoveNode: actions.moveNode } : {})}
        />
        <CanvasOverlayLayer
          viewportWidth={viewportWidth}
          zoom={zoom}
          selectedNodeIds={selection.selectedNodeIds}
        />
      </div>
    </section>
  );
}
