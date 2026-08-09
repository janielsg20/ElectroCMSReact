import { useMemo, useState } from 'react';
import { listContentTypeDefinitions } from '../../../core/content';
import { isJsonObject, type JsonValue } from '../../../core/domain';
import {
  createDynamicBinding,
  createRecordBindingSource,
  createRecordsBindingSource,
  listBindableRecordPaths,
  parseDynamicBindingSource,
  resolveDynamicBinding,
  type CanonicalProject,
  type DocumentNode,
  type DynamicBinding,
  type DynamicBindingKind,
} from '../../../core/project';
import type { CanvasBindingEditResult } from '../canvas/use-canvas-dynamic-binding-actions';

interface WidgetBindingsInspectorProps {
  project: CanonicalProject;
  node: DocumentNode;
  onSetBindings?: (nodeId: string, bindings: readonly DynamicBinding[]) => CanvasBindingEditResult;
}

interface BindableTarget {
  key: string;
  kind: DynamicBindingKind;
  label: string;
}

function labelForKey(key: string): string {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (character) => character.toUpperCase());
}

function targetKind(key: string, value: JsonValue): DynamicBindingKind | null {
  if (key === 'src') return 'image';
  if (key === 'href') return 'link';
  if (key === 'items' && Array.isArray(value)) return 'listing';
  if (typeof value === 'string') return 'text';
  return null;
}

function bindableTargets(node: DocumentNode): BindableTarget[] {
  return Object.entries(node.props).flatMap(([key, value]) => {
    const kind = targetKind(key, value);
    return kind ? [{ key, kind, label: labelForKey(key) }] : [];
  });
}

function recordLabel(id: string, raw: unknown): string {
  if (!isJsonObject(raw)) return id;
  const title = typeof raw.title === 'string' && raw.title.trim() ? raw.title.trim() : id;
  return `${title} · ${id}`;
}

function defaultFallback(kind: DynamicBindingKind): JsonValue {
  return kind === 'listing' ? [] : '';
}

function fallbackText(binding: DynamicBinding): string {
  if (binding.kind === 'listing') return Array.isArray(binding.fallback) ? binding.fallback.join(', ') : '';
  return typeof binding.fallback === 'string' ? binding.fallback : '';
}

function fallbackFromText(kind: DynamicBindingKind, value: string): JsonValue {
  return kind === 'listing'
    ? value.split(',').map((item) => item.trim()).filter(Boolean)
    : value;
}

export function WidgetBindingsInspector({ project, node, onSetBindings }: WidgetBindingsInspectorProps) {
  const targets = useMemo(() => bindableTargets(node), [node]);
  const records = useMemo(
    () => Object.entries(project.records)
      .filter(([, raw]) => isJsonObject(raw))
      .sort(([left], [right]) => left.localeCompare(right)),
    [project.records],
  );
  const contentTypes = useMemo(() => listContentTypeDefinitions(project), [project]);
  const [message, setMessage] = useState<string | null>(null);
  const bindings = node.bindings ?? [];
  const boundTargets = new Set(bindings.map((binding) => binding.target).filter((value): value is string => typeof value === 'string'));
  const availableTargets = targets.filter((target) => !boundTargets.has(target.key));

  const commit = (next: readonly DynamicBinding[]) => {
    const result = onSetBindings?.(node.id, next);
    if (!result) {
      setMessage('Binding edits are unavailable in this surface.');
      return;
    }
    if (!result.applied) {
      setMessage(result.issues[0]?.message ?? 'The binding could not be saved.');
      return;
    }
    setMessage(null);
  };

  const addBinding = () => {
    const target = availableTargets[0];
    if (!target) return;
    if (target.kind === 'listing') {
      const contentTypeId = contentTypes[0]?.id ?? '';
      commit([...bindings, createDynamicBinding({
        target: target.key,
        kind: target.kind,
        source: createRecordsBindingSource(contentTypeId, 'title'),
        fallback: [],
      })]);
      return;
    }
    const recordId = records[0]?.[0] ?? '';
    commit([...bindings, createDynamicBinding({
      target: target.key,
      kind: target.kind,
      source: createRecordBindingSource(recordId, 'title'),
      fallback: defaultFallback(target.kind),
    })]);
  };

  const replaceBinding = (index: number, next: DynamicBinding) => {
    commit(bindings.map((binding, candidate) => candidate === index ? next : binding));
  };

  const removeBinding = (index: number) => {
    commit(bindings.filter((_, candidate) => candidate !== index));
  };

  if (targets.length === 0) {
    return <div className="widget-inspector-empty">This widget has no MF-044 bindable properties.</div>;
  }

  return (
    <div className="widget-inspector-sections" data-testid="widget-bindings-inspector">
      <section className="widget-inspector-section">
        <div className="widget-inspector-section-fields">
          <div className="rounded-lg border border-[var(--color-ec-border)] bg-[var(--color-ec-surface-subtle)] p-2.5 text-[9px] leading-4 text-[var(--color-ec-text-muted)]">
            Bind widget properties directly to canonical Records. Static props remain the deterministic error fallback when no explicit fallback is configured.
          </div>
          {bindings.map((binding, index) => {
            const validationTarget = targets.find((target) => target.key === binding.target);
            const kind = validationTarget?.kind ?? (binding.kind as DynamicBindingKind | undefined) ?? 'text';
            const parsed = parseDynamicBindingSource(binding.source);
            const resolution = resolveDynamicBinding(project, binding);
            const recordId = parsed?.kind === 'record' ? parsed.recordId : records[0]?.[0] ?? '';
            const contentTypeId = parsed?.kind === 'records' ? parsed.contentTypeId : contentTypes[0]?.id ?? '';
            const path = parsed?.kind === 'record' ? parsed.path : 'title';
            const itemPath = parsed?.kind === 'records' ? parsed.itemPath : 'title';
            const paths = recordId ? listBindableRecordPaths(project, recordId) : [];

            return (
              <fieldset key={`${binding.target ?? 'legacy'}-${index}`} className="rounded-lg border border-[var(--color-ec-border)] p-2.5">
                <legend className="px-1 text-[9px] font-semibold text-[var(--color-ec-text)]">{validationTarget?.label ?? binding.target ?? `Legacy binding ${index + 1}`}</legend>
                <div className="grid gap-2">
                  <label className="widget-inspector-field">
                    <span>Target</span>
                    <select
                      aria-label={`Binding ${index + 1} target`}
                      value={binding.target ?? ''}
                      onChange={(event) => {
                        const target = targets.find((candidate) => candidate.key === event.target.value);
                        if (!target) return;
                        const nextSource = target.kind === 'listing'
                          ? createRecordsBindingSource(contentTypes[0]?.id ?? '', 'title')
                          : createRecordBindingSource(records[0]?.[0] ?? '', 'title');
                        replaceBinding(index, createDynamicBinding({ target: target.key, kind: target.kind, source: nextSource, fallback: defaultFallback(target.kind) }));
                      }}
                    >
                      {targets.map((target) => <option key={target.key} value={target.key} disabled={target.key !== binding.target && boundTargets.has(target.key)}>{target.label} · {target.kind}</option>)}
                    </select>
                  </label>

                  {kind === 'listing' ? (
                    <>
                      <label className="widget-inspector-field">
                        <span>Content Type</span>
                        <select
                          aria-label={`Binding ${index + 1} content type`}
                          value={contentTypeId}
                          onChange={(event) => replaceBinding(index, createDynamicBinding({ target: binding.target ?? 'items', kind: 'listing', source: createRecordsBindingSource(event.target.value, itemPath), fallback: binding.fallback ?? [] }))}
                        >
                          {contentTypes.map((contentType) => <option key={contentType.id} value={contentType.id}>{contentType.label} · {contentType.id}</option>)}
                        </select>
                      </label>
                      <label className="widget-inspector-field">
                        <span>Item field path</span>
                        <input aria-label={`Binding ${index + 1} item field path`} value={itemPath} onChange={(event) => replaceBinding(index, createDynamicBinding({ target: binding.target ?? 'items', kind: 'listing', source: createRecordsBindingSource(contentTypeId, event.target.value), fallback: binding.fallback ?? [] }))} />
                        <small>Example: title, slug or fieldValues.group.field.</small>
                      </label>
                    </>
                  ) : (
                    <>
                      <label className="widget-inspector-field">
                        <span>Record</span>
                        <select
                          aria-label={`Binding ${index + 1} record`}
                          value={recordId}
                          onChange={(event) => {
                            const nextPaths = listBindableRecordPaths(project, event.target.value);
                            const nextPath = nextPaths.includes(path) ? path : nextPaths[0] ?? 'title';
                            replaceBinding(index, createDynamicBinding({ target: binding.target ?? validationTarget?.key ?? 'text', kind, source: createRecordBindingSource(event.target.value, nextPath), fallback: binding.fallback ?? defaultFallback(kind) }));
                          }}
                        >
                          {records.map(([id, raw]) => <option key={id} value={id}>{recordLabel(id, raw)}</option>)}
                        </select>
                      </label>
                      <label className="widget-inspector-field">
                        <span>Field path</span>
                        <select
                          aria-label={`Binding ${index + 1} field path`}
                          value={path}
                          onChange={(event) => replaceBinding(index, createDynamicBinding({ target: binding.target ?? validationTarget?.key ?? 'text', kind, source: createRecordBindingSource(recordId, event.target.value), fallback: binding.fallback ?? defaultFallback(kind) }))}
                        >
                          {paths.map((candidate) => <option key={candidate} value={candidate}>{candidate}</option>)}
                        </select>
                      </label>
                    </>
                  )}

                  <label className="widget-inspector-field">
                    <span>Fallback</span>
                    <input
                      aria-label={`Binding ${index + 1} fallback`}
                      value={fallbackText(binding)}
                      placeholder={kind === 'listing' ? 'Item one, Item two' : 'Fallback value'}
                      onChange={(event) => replaceBinding(index, createDynamicBinding({
                        target: binding.target ?? validationTarget?.key ?? 'text',
                        kind,
                        source: binding.source,
                        fallback: fallbackFromText(kind, event.target.value),
                      }))}
                    />
                  </label>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[8px] font-semibold uppercase tracking-[.08em] text-[var(--color-ec-text-muted)]" data-binding-state={resolution.state}>State: {resolution.state}</span>
                    <button type="button" className="ec-control ec-focus-ring h-7 px-2 text-[9px] font-semibold text-[var(--color-ec-danger-600)]" onClick={() => removeBinding(index)}>Remove binding</button>
                  </div>
                  {resolution.message ? <div role={resolution.state === 'error' ? 'alert' : 'status'} className="text-[8px] leading-4 text-[var(--color-ec-text-muted)]">{resolution.message}</div> : null}
                </div>
              </fieldset>
            );
          })}

          <button type="button" className="ec-control ec-focus-ring h-9 w-full text-[10px] font-semibold disabled:cursor-not-allowed disabled:opacity-50" disabled={!onSetBindings || availableTargets.length === 0 || (records.length === 0 && availableTargets[0]?.kind !== 'listing') || (contentTypes.length === 0 && availableTargets[0]?.kind === 'listing')} onClick={addBinding}>Add dynamic binding</button>
          {records.length === 0 ? <small className="text-[8px] leading-4 text-[var(--color-ec-text-muted)]">Create a Record in Dynamic Content Studio to author record bindings.</small> : null}
          {message ? <div role="alert" className="text-[9px] text-[var(--color-ec-danger-600)]">{message}</div> : null}
        </div>
      </section>
    </div>
  );
}
