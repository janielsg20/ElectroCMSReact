import { useEffect } from 'react';

export interface DocumentHistoryShortcutActions {
  undo(): boolean;
  redo(): boolean;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  );
}

export function useDocumentHistoryShortcuts(actions: DocumentHistoryShortcutActions): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target) || (!event.ctrlKey && !event.metaKey)) return;
      const key = event.key.toLowerCase();
      const redoRequested = (key === 'z' && event.shiftKey) || (key === 'y' && event.ctrlKey);
      const undoRequested = key === 'z' && !event.shiftKey;

      if (redoRequested && actions.redo()) {
        event.preventDefault();
      } else if (undoRequested && actions.undo()) {
        event.preventDefault();
      }
    };

    globalThis.addEventListener('keydown', handleKeyDown);
    return () => globalThis.removeEventListener('keydown', handleKeyDown);
  }, [actions]);
}
