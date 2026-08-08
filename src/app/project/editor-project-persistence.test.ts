import { describe, expect, it } from 'vitest';
import { MemoryProjectRepository } from '../../core/persistence/memory-project-repository';
import { MemoryRecoveryRepository } from '../../core/persistence/recovery/memory-recovery-repository';
import type { RecoverySnapshot } from '../../core/persistence/recovery/recovery-repository';
import { createCanonicalProject } from '../../core/project';
import { EditorProjectPersistence } from './editor-project-persistence';

function createProject() {
  return createCanonicalProject({
    id: 'project_editor_persistence',
    name: 'Editor persistence',
    now: '2026-08-07T22:00:00.000Z',
    randomUuid: (() => {
      let sequence = 0;
      return () => `00000000-0000-4000-8000-${String(++sequence).padStart(12, '0')}`;
    })(),
  });
}

describe('EditorProjectPersistence', () => {
  it('hydrates the freshest recovery snapshot when it is ahead of the project store', async () => {
    const projects = new MemoryProjectRepository();
    const recovery = new MemoryRecoveryRepository();
    const initial = createProject();
    await projects.create(initial);

    const recovered = structuredClone(initial);
    recovered.name = 'Recovered edit';
    recovered.metadata.updatedAt = '2026-08-07T22:00:02.000Z';
    recovered.historyMetadata.revision = 2;
    const snapshot: RecoverySnapshot = {
      id: 'snapshot_recovered',
      projectId: recovered.id,
      createdAt: recovered.metadata.updatedAt,
      reason: 'autosave',
      project: recovered,
    };
    await recovery.save(snapshot);

    const runtime = new EditorProjectPersistence(projects, recovery);
    expect((await runtime.hydrate(initial)).name).toBe('Recovered edit');
    runtime.dispose();
  });

  it('emits saving then saved and persists queued editor changes', async () => {
    const projects = new MemoryProjectRepository();
    const recovery = new MemoryRecoveryRepository();
    const initial = createProject();
    await projects.create(initial);
    const events: string[] = [];
    let tick = 0;
    const runtime = new EditorProjectPersistence(projects, recovery, {
      now: () => `2026-08-07T22:01:0${++tick}.000Z`,
    });
    runtime.subscribe((event) => events.push(event.state));

    const edited = structuredClone(initial);
    edited.name = 'Edited';
    runtime.queue(edited);
    await runtime.flush();

    expect(events).toEqual(['saving', 'saved']);
    expect((await projects.load(initial.id))?.name).toBe('Edited');
    expect((await projects.load(initial.id))?.historyMetadata.revision).toBe(1);
    runtime.dispose();
  });
});
