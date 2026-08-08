import type { CanonicalDocument } from '../../core/project';

export interface DocumentCommand {
  id: string;
  label: string;
  documentId: string;
  before: CanonicalDocument;
  after: CanonicalDocument;
}

export interface DocumentHistoryState {
  past: readonly DocumentCommand[];
  future: readonly DocumentCommand[];
}

export const EMPTY_DOCUMENT_HISTORY: DocumentHistoryState = {
  past: [],
  future: [],
};

function cloneDocument(document: CanonicalDocument): CanonicalDocument {
  return structuredClone(document);
}

export function createDocumentCommand(
  label: string,
  before: CanonicalDocument,
  after: CanonicalDocument,
): DocumentCommand {
  if (before.id !== after.id) {
    throw new Error('A document command cannot change the document id.');
  }
  return {
    id: `command_${crypto.randomUUID()}`,
    label,
    documentId: before.id,
    before: cloneDocument(before),
    after: cloneDocument(after),
  };
}

export function recordDocumentCommand(
  history: DocumentHistoryState,
  command: DocumentCommand,
): DocumentHistoryState {
  return {
    past: [...history.past, command],
    future: [],
  };
}

export interface DocumentHistoryTransition {
  history: DocumentHistoryState;
  document: CanonicalDocument;
  command: DocumentCommand;
}

export function undoDocumentCommand(
  history: DocumentHistoryState,
): DocumentHistoryTransition | null {
  const command = history.past.at(-1);
  if (!command) return null;
  return {
    history: {
      past: history.past.slice(0, -1),
      future: [command, ...history.future],
    },
    document: cloneDocument(command.before),
    command,
  };
}

export function redoDocumentCommand(
  history: DocumentHistoryState,
): DocumentHistoryTransition | null {
  const command = history.future[0];
  if (!command) return null;
  return {
    history: {
      past: [...history.past, command],
      future: history.future.slice(1),
    },
    document: cloneDocument(command.after),
    command,
  };
}
