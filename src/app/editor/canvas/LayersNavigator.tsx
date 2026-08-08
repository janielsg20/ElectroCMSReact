import { useMemo, useState, type CSSProperties, type MouseEvent, type ReactNode } from 'react';
import type { CanonicalDocument, DocumentNode } from '../../../core/project';
import { Icon } from '../../components/Icon';

interface LayersNavigatorProps {
  document: CanonicalDocument;
  selectedNodeIds: readonly string[];
  onSelectNode(nodeId: string, additive: boolean): void;
  onRenameNode(nodeId: string, name: string): boolean;
  onSetLocked(nodeIds: readonly string[], locked: boolean): boolean;
  onSetHidden(nodeIds: readonly string[], hidden: boolean): boolean;
  onMoveNode(nodeId: string, parentId: string, index: number): boolean;
  onClose(): void;
}

interface ParentPosition {
  parentId: string;
  index: number;
  siblingCount: number;
}

function nodeLabel(node: DocumentNode): string {
  return node.name?.trim() || node.type.replace(/^core\//, '');
}

export function LayersNavigator({
  document,
  selectedNodeIds,
  onSelectNode,
  onRenameNode,
  onSetLocked,
  onSetHidden,
  onMoveNode,
  onClose,
}: LayersNavigatorProps) {
  const [query, setQuery] = useState('');
  const [collapsedIds, setCollapsedIds] = useState<ReadonlySet<string>>(() => new Set());
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const parentPositions = useMemo(() => {
    const next = new Map<string, ParentPosition>();
    for (const parent of Object.values(document.nodes)) {
      parent.children.forEach((childId, index) => {
        next.set(childId, { parentId: parent.id, index, siblingCount: parent.children.length });
      });
    }
    return next;
  }, [document.nodes]);

  const visibleIds = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return null;

    const parents = new Map<string, string>();
    for (const parent of Object.values(document.nodes)) {
      for (const childId of parent.children) parents.set(childId, parent.id);
    }

    const visible = new Set<string>();
    for (const node of Object.values(document.nodes)) {
      if (!`${nodeLabel(node)} ${node.type} ${node.id}`.toLowerCase().includes(normalized)) continue;
      visible.add(node.id);
      let current = parents.get(node.id);
      while (current) {
        visible.add(current);
        current = parents.get(current);
      }
    }
    return visible;
  }, [document.nodes, query]);

  const stopPropagation = (event: MouseEvent<HTMLElement>) => event.stopPropagation();
  const toggleCollapsed = (nodeId: string) => {
    setCollapsedIds((current) => {
      const next = new Set(current);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  };

  const beginRename = (node: DocumentNode) => {
    setRenamingId(node.id);
    setRenameValue(nodeLabel(node));
  };

  const commitRename = (node: DocumentNode) => {
    const nextName = renameValue.trim();
    if (nextName && nextName !== nodeLabel(node)) onRenameNode(node.id, nextName);
    setRenamingId(null);
  };

  const renderLayer = (nodeId: string, depth = 0): ReactNode => {
    const node = document.nodes[nodeId];
    if (!node || (visibleIds && !visibleIds.has(node.id))) return null;

    const selected = selectedNodeIds.includes(node.id);
    const label = nodeLabel(node);
    const hasChildren = node.children.some((childId) => !visibleIds || visibleIds.has(childId));
    const collapsed = visibleIds ? false : collapsedIds.has(node.id);
    const parentPosition = parentPositions.get(node.id);

    return (
      <li key={node.id} className="canvas-layer-item" role="treeitem" aria-expanded={hasChildren ? !collapsed : undefined} aria-selected={selected}>
        <div className="canvas-layer-row" data-selected={selected ? 'true' : 'false'} style={{ '--layer-depth': depth } as CSSProperties}>
          <button
            type="button"
            className="canvas-layer-disclosure"
            aria-label={hasChildren ? `${collapsed ? 'Expand' : 'Collapse'} ${label}` : undefined}
            disabled={!hasChildren}
            onClick={(event) => { stopPropagation(event); if (hasChildren) toggleCollapsed(node.id); }}
          >
            {hasChildren ? <Icon name={collapsed ? 'expand' : 'arrow-down'} size={11} /> : <span aria-hidden="true">·</span>}
          </button>

          {renamingId === node.id ? (
            <input
              autoFocus
              className="canvas-layer-rename"
              aria-label={`Rename ${label}`}
              value={renameValue}
              onChange={(event) => setRenameValue(event.target.value)}
              onClick={stopPropagation}
              onBlur={() => commitRename(node)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') event.currentTarget.blur();
                if (event.key === 'Escape') setRenamingId(null);
              }}
            />
          ) : (
            <button
              type="button"
              className="canvas-layer-select"
              aria-pressed={selected}
              onClick={(event) => {
                stopPropagation(event);
                onSelectNode(node.id, event.metaKey || event.ctrlKey || event.shiftKey);
              }}
              onDoubleClick={(event) => { stopPropagation(event); beginRename(node); }}
            >
              <span className="canvas-layer-name">{label}</span>
            </button>
          )}

          <div className="canvas-layer-actions" aria-label={`${label} layer actions`}>
            {parentPosition ? (
              <>
                <button type="button" aria-label={`Move ${label} up`} disabled={parentPosition.index === 0} onClick={(event) => { stopPropagation(event); onMoveNode(node.id, parentPosition.parentId, parentPosition.index - 1); }}><Icon name="arrow-up" size={11} /></button>
                <button type="button" aria-label={`Move ${label} down`} disabled={parentPosition.index >= parentPosition.siblingCount - 1} onClick={(event) => { stopPropagation(event); onMoveNode(node.id, parentPosition.parentId, parentPosition.index + 1); }}><Icon name="arrow-down" size={11} /></button>
              </>
            ) : null}
            <button type="button" aria-label={`Rename ${label}`} onClick={(event) => { stopPropagation(event); beginRename(node); }}><Icon name="editor" size={11} /></button>
            <button type="button" aria-label={`${node.locked ? 'Unlock' : 'Lock'} ${label}`} aria-pressed={node.locked === true} onClick={(event) => { stopPropagation(event); onSetLocked([node.id], node.locked !== true); }}><Icon name="shield" size={11} /></button>
            <button type="button" aria-label={`${node.hidden ? 'Show' : 'Hide'} ${label}`} aria-pressed={node.hidden === true} onClick={(event) => { stopPropagation(event); onSetHidden([node.id], node.hidden !== true); }}><Icon name="preview" size={11} /></button>
          </div>
        </div>
        {hasChildren && !collapsed ? <ul role="group">{node.children.map((childId) => renderLayer(childId, depth + 1))}</ul> : null}
      </li>
    );
  };

  return (
    <aside className="canvas-layers-popover" aria-label="Layers navigator" onClick={stopPropagation}>
      <header>
        <div><span>Document</span><strong>Layers</strong></div>
        <button type="button" aria-label="Close layers" onClick={onClose}><Icon name="close" size={13} /></button>
      </header>
      <label className="canvas-layers-search">
        <Icon name="search" size={12} />
        <span className="sr-only">Search layers</span>
        <input aria-label="Search layers" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search layers…" />
      </label>
      <div className="canvas-layers-tree" role="tree" aria-label="Document layers">
        <ul>{renderLayer(document.rootNodeId)}</ul>
        {visibleIds?.size === 0 ? <div className="canvas-layers-empty">No layers match “{query}”.</div> : null}
      </div>
    </aside>
  );
}
