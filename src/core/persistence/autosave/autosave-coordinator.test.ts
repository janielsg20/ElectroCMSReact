import { describe, expect, it } from 'vitest';
import { createCanonicalProject } from '../../project';
import { MemoryProjectRepository } from '../memory-project-repository';
import { MemoryRecoveryRepository } from '../recovery/memory-recovery-repository';
import { AutosaveCoordinator } from './autosave-coordinator';

function createProject() {
  return createCanonicalProject({
    id: 'project_autosave',
    name: 'Autosave Demo',
    now: '2026-08-07T20:00:00.000Z',
    randomUuid: (() => {
      let sequence = 0;
      return () => `00000000-0000-4000-8000-${String(++sequence).padStart(12, '0')}`;
    })(),
  });
}

describe('AutosaveCoordinator', () => {
  it('coalesces queued edits, saves bounded recovery snapshots and increments revisions', async () => {
    const projects = new MemoryProjectRepository();
    const recovery = new MemoryRecoveryRepository();
    const initial = createProject();
    await projects.create(initial);

    let tick = 0;
    const coordinator = new AutosaveCoordinator(projects, recovery, {
      maxRecoverySnapshots: 2,
      now: () => `2026-08-07T20:00:0${++tick}.000Z`,
    });

    const first = structuredClone(initial);
    first.name = 'First edit';
    const second = structuredClone(initial);
    second.name = 'Latest edit';

    coordinator.queue(first);
    coordinator.queue(second);
    await coordinator.flush();

    const saved = await projects.load(initial.id);
    expect(saved?.name).toBe('Latest edit');
    expect(saved?.historyMetadata.revision).toBe(1);
    expect((await recovery.list(initial.id))).toHaveLength(1);
    expect((await coordinator.recoverLatest(initial.id))?.name).toBe('Latest edit');

    const third = structuredClone(saved);
    if (!third) throw new Error('Expected saved project.');
    third.name = 'Third edit';
    coordinator.queue(third);
    await coordinator.flush();

    const fourth = structuredClone(await projects.load(initial.id));
    if (!fourth) throw new Error('Expected saved project.');
    fourth.name = 'Fourth edit';
    coordinator.queue(fourth);
    await coordinator.flush();

    expect((await recovery.list(initial.id))).toHaveLength(2);
    coordinator.dispose();
  });
});
