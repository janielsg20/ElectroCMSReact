import { useCallback, useMemo, useState } from 'react';

export interface CanvasSelectionState {
  selectedNodeIds: readonly string[];
  primaryNodeId: string | null;
}

export interface CanvasSelectionController extends CanvasSelectionState {
  selectNode(nodeId: string, additive?: boolean): void;
  clearSelection(): void;
  isSelected(nodeId: string): boolean;
}

export function toggleCanvasSelection(
  selectedNodeIds: readonly string[],
  nodeId: string,
  additive: boolean,
): string[] {
  if (!additive) return [nodeId];
  return selectedNodeIds.includes(nodeId)
    ? selectedNodeIds.filter((candidate) => candidate !== nodeId)
    : [...selectedNodeIds, nodeId];
}

export function useCanvasSelection(validNodeIds: readonly string[]): CanvasSelectionController {
  const [rawSelectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const validNodeIdSet = useMemo(() => new Set(validNodeIds), [validNodeIds]);
  const selectedNodeIds = useMemo(
    () => rawSelectedNodeIds.filter((nodeId) => validNodeIdSet.has(nodeId)),
    [rawSelectedNodeIds, validNodeIdSet],
  );

  const selectNode = useCallback((nodeId: string, additive = false) => {
    setSelectedNodeIds((current) => toggleCanvasSelection(current, nodeId, additive));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedNodeIds([]);
  }, []);

  const selectedSet = useMemo(() => new Set(selectedNodeIds), [selectedNodeIds]);
  const isSelected = useCallback((nodeId: string) => selectedSet.has(nodeId), [selectedSet]);

  return {
    selectedNodeIds,
    primaryNodeId: selectedNodeIds.at(-1) ?? null,
    selectNode,
    clearSelection,
    isSelected,
  };
}
