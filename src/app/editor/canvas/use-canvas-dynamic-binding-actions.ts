import { useCallback, useContext } from 'react';
import {
  updateDocumentNode,
  validateDynamicBindings,
  type DynamicBinding,
  type DynamicBindingIssue,
} from '../../../core/project';
import { createDocumentCommand } from '../../project/document-command-history';
import { ProjectSessionContext } from '../../project/project-session-context';

export interface CanvasBindingEditResult {
  applied: boolean;
  issues: readonly DynamicBindingIssue[];
}

export interface CanvasDynamicBindingActions {
  setBindings(nodeId: string, bindings: readonly DynamicBinding[]): CanvasBindingEditResult;
}

export function useCanvasDynamicBindingActions(): CanvasDynamicBindingActions {
  const session = useContext(ProjectSessionContext);

  const setBindings = useCallback((nodeId: string, bindings: readonly DynamicBinding[]): CanvasBindingEditResult => {
    if (!session) {
      return {
        applied: false,
        issues: [{ code: 'SESSION_UNAVAILABLE', path: '$', message: 'Project session is unavailable.' }],
      };
    }
    const document = session.project.documents[session.activeDocumentId];
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
      const nextDocument = updateDocumentNode(document, nodeId, (current) => {
        if (validation.value.length === 0) {
          const { bindings: _removed, ...withoutBindings } = current;
          return withoutBindings;
        }
        return { ...current, bindings: structuredClone(validation.value) };
      });
      const applied = session.executeDocumentCommand(createDocumentCommand('Update dynamic bindings', document, nextDocument));
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
  }, [session]);

  return { setBindings };
}
