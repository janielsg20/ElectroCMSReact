import { useCallback } from 'react';
import {
  updateDocumentNode,
  validateDynamicBindings,
  type DynamicBinding,
  type DynamicBindingIssue,
} from '../../../core/project';
import { createDocumentCommand } from '../../project/document-command-history';
import { useProjectSession } from '../../project/project-session-context';

export interface CanvasBindingEditResult {
  applied: boolean;
  issues: readonly DynamicBindingIssue[];
}

export interface CanvasDynamicBindingActions {
  setBindings(nodeId: string, bindings: readonly DynamicBinding[]): CanvasBindingEditResult;
}

export function useCanvasDynamicBindingActions(): CanvasDynamicBindingActions {
  const session = useProjectSession();
  const activeDocumentId = session.activeDocumentId;
  const documents = session.project.documents;
  const executeDocumentCommand = session.executeDocumentCommand;

  const setBindings = useCallback((nodeId: string, bindings: readonly DynamicBinding[]): CanvasBindingEditResult => {
    const document = documents[activeDocumentId];
    const node = document?.nodes[nodeId];
    if (!document || !node) {
      return {
        applied: false,
        issues: [{ code: 'NODE_NOT_FOUND', path: '$', message: 'Selected node was not found.' }],
      };
    }

    const validation = validateDynamicBindings(bindings);
    if (!validation.ok) return { applied: false, issues: validation.issues };

    try {
      const nextDocument = updateDocumentNode(document, nodeId, (current) => ({
        ...current,
        ...(validation.value.length === 0
          ? { bindings: undefined }
          : { bindings: structuredClone(validation.value) }),
      }));
      const applied = executeDocumentCommand(createDocumentCommand('Update dynamic bindings', document, nextDocument));
      return { applied, issues: [] };
    } catch (error) {
      return {
        applied: false,
        issues: [{
          code: 'BINDING_EDIT_FAILED',
          path: '$',
          message: error instanceof Error ? error.message : 'Dynamic binding update failed.',
        }],
      };
    }
  }, [activeDocumentId, documents, executeDocumentCommand]);

  return { setBindings };
}
