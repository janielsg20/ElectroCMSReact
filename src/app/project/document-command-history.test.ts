import { describe, expect, it } from 'vitest';
import { createCanonicalProject } from '../../core/project';
import {
  EMPTY_DOCUMENT_HISTORY,
  createDocumentCommand,
  recordDocumentCommand,
  redoDocumentCommand,
  undoDocumentCommand,
} from './document-command-history';

function documents() {
  const project = createCanonicalProject({ id: 'project_history_test', name: 'History test' });
  const document = project.documents[project.documentOrder[0] ?? ''];
  if (!document) throw new Error('Expected default document.');
  const after = structuredClone(document);
  const root = after.nodes[after.rootNodeId];
  if (!root) throw new Error('Expected root node.');
  root.name = 'Changed root';
  return { before: document, after };
}

describe('document command history', () => {
  it('records, undoes and redoes canonical documents', () => {
    const { before, after } = documents();
    const command = createDocumentCommand('Rename root', before, after);
    const recorded = recordDocumentCommand(EMPTY_DOCUMENT_HISTORY, command);

    expect(recorded.past).toHaveLength(1);
    expect(recorded.future).toHaveLength(0);

    const undone = undoDocumentCommand(recorded);
    expect(undone?.document.nodes[before.rootNodeId]?.name).toBe(before.nodes[before.rootNodeId]?.name);
    expect(undone?.history.past).toHaveLength(0);
    expect(undone?.history.future).toHaveLength(1);

    const redone = undone ? redoDocumentCommand(undone.history) : null;
    expect(redone?.document.nodes[after.rootNodeId]?.name).toBe('Changed root');
    expect(redone?.history.past).toHaveLength(1);
    expect(redone?.history.future).toHaveLength(0);
  });

  it('clears redo history after a new command', () => {
    const { before, after } = documents();
    const first = createDocumentCommand('First', before, after);
    const undone = undoDocumentCommand(recordDocumentCommand(EMPTY_DOCUMENT_HISTORY, first));
    if (!undone) throw new Error('Expected undo transition.');

    const second = createDocumentCommand('Second', before, after);
    const next = recordDocumentCommand(undone.history, second);
    expect(next.future).toHaveLength(0);
    expect(next.past.at(-1)?.label).toBe('Second');
  });
});
