import { useEffect, useRef, type KeyboardEvent, type PointerEvent } from 'react';
import {
  getWorkspaceDefinition,
  type WorkspaceId,
} from '../routing/workspaces';
import { useWorkspacePreferences } from '../workspace/workspace-preferences-context';
import type { IconName } from './Icon';
import { Icon } from './Icon';

const workspaceIcons: Record<WorkspaceId, IconName> = {
  editor: 'editor',
  preview: 'preview',
  backend: 'backend',
  export: 'export',
};

export interface WorkspaceNavigationProps {
  compactLayout: boolean;
  open: boolean;
  activeWorkspace: WorkspaceId;
  onNavigate(workspaceId: WorkspaceId): void;
  onClose(): void;
}

export function WorkspaceNavigation({
  compactLayout,
  open,
  activeWorkspace,
  onNavigate,
  onClose,
}: WorkspaceNavigationProps) {
  const {
    preferences,
    setNavigationPosition,
    setNavigationWidth,
    setNavigationCollapsed,
    setNavigationDisplayMode,
    moveWorkspace,
    setDensity,
    reset,
  } = useWorkspacePreferences();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!compactLayout || !open) return;
    closeButtonRef.current?.focus();
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    globalThis.addEventListener('keydown', onKeyDown);
    return () => globalThis.removeEventListener('keydown', onKeyDown);
  }, [compactLayout, onClose, open]);

  if (compactLayout && !open) return null;

  const collapsed = !compactLayout && preferences.navigationCollapsed;
  const displayMode = collapsed ? 'icons' : preferences.navigationDisplayMode;

  const handleResizeStart = (event: PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = preferences.navigationWidth;
    const direction = preferences.navigationPosition === 'left' ? 1 : -1;

    const onMove = (moveEvent: globalThis.PointerEvent) => {
      setNavigationWidth(startWidth + (moveEvent.clientX - startX) * direction);
    };
    const onUp = () => {
      globalThis.removeEventListener('pointermove', onMove);
      globalThis.removeEventListener('pointerup', onUp);
    };
    globalThis.addEventListener('pointermove', onMove);
    globalThis.addEventListener('pointerup', onUp);
  };

  const handleResizeKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const delta = event.key === 'ArrowRight' ? 12 : -12;
    const direction = preferences.navigationPosition === 'left' ? 1 : -1;
    setNavigationWidth(preferences.navigationWidth + delta * direction);
  };

  const content = (
    <aside
      className="workspace-navigation"
      data-position={preferences.navigationPosition}
      data-collapsed={collapsed ? 'true' : 'false'}
      data-display-mode={displayMode}
      aria-label="Workspace navigation"
      style={{ '--navigation-width': `${preferences.navigationWidth}px` } as React.CSSProperties}
    >
      <div className="navigation-heading">
        <div className="navigation-title-wrap">
          <span className="navigation-eyebrow">Workspace</span>
          {!collapsed ? <strong>ElectroCMS</strong> : null}
        </div>
        {compactLayout ? (
          <button
            ref={closeButtonRef}
            className="icon-button"
            type="button"
            aria-label="Close navigation"
            onClick={onClose}
          >
            <Icon name="close" />
          </button>
        ) : (
          <button
            className="icon-button"
            type="button"
            aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
            onClick={() => setNavigationCollapsed(!collapsed)}
          >
            <Icon name={collapsed ? 'expand' : 'collapse'} />
          </button>
        )}
      </div>

      <nav className="workspace-list" aria-label="Primary workspaces">
        {preferences.workspaceOrder.map((workspaceId) => {
          const definition = getWorkspaceDefinition(workspaceId);
          const active = workspaceId === activeWorkspace;
          return (
            <button
              key={workspaceId}
              type="button"
              className="workspace-link"
              data-active={active ? 'true' : 'false'}
              aria-current={active ? 'page' : undefined}
              title={displayMode === 'icons' ? definition.label : undefined}
              onClick={() => {
                onNavigate(workspaceId);
                if (compactLayout) onClose();
              }}
            >
              {displayMode !== 'labels' ? (
                <span className="workspace-icon">
                  <Icon name={workspaceIcons[workspaceId]} />
                </span>
              ) : null}
              {displayMode !== 'icons' ? (
                <span className="workspace-link-copy">
                  <strong>{definition.label}</strong>
                  {preferences.density === 'comfortable' ? (
                    <small>{definition.description}</small>
                  ) : null}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      <div className="navigation-spacer" />

      <details className="navigation-settings">
        <summary>
          <Icon name="settings" />
          {!collapsed ? <span>Workspace settings</span> : <span className="sr-only">Workspace settings</span>}
        </summary>
        <div className="navigation-settings-panel">
          <label>
            <span>Position</span>
            <select
              aria-label="Navigation position"
              value={preferences.navigationPosition}
              onChange={(event) => setNavigationPosition(event.target.value as 'left' | 'right')}
            >
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
          </label>
          <label>
            <span>Display</span>
            <select
              aria-label="Navigation display mode"
              value={preferences.navigationDisplayMode}
              onChange={(event) =>
                setNavigationDisplayMode(event.target.value as 'icons' | 'labels' | 'both')
              }
            >
              <option value="both">Icons + labels</option>
              <option value="icons">Icons</option>
              <option value="labels">Labels</option>
            </select>
          </label>
          <label>
            <span>Density</span>
            <select
              aria-label="Workspace density"
              value={preferences.density}
              onChange={(event) => setDensity(event.target.value as 'compact' | 'comfortable')}
            >
              <option value="compact">Compact</option>
              <option value="comfortable">Comfortable</option>
            </select>
          </label>

          <fieldset className="workspace-order-settings">
            <legend>Workspace order</legend>
            {preferences.workspaceOrder.map((workspaceId, index) => (
              <div key={workspaceId} className="order-row">
                <span>{getWorkspaceDefinition(workspaceId).label}</span>
                <div className="order-actions">
                  <button
                    type="button"
                    aria-label={`Move ${getWorkspaceDefinition(workspaceId).label} up`}
                    disabled={index === 0}
                    onClick={() => moveWorkspace(workspaceId, -1)}
                  >
                    <Icon name="arrow-up" size={13} />
                  </button>
                  <button
                    type="button"
                    aria-label={`Move ${getWorkspaceDefinition(workspaceId).label} down`}
                    disabled={index === preferences.workspaceOrder.length - 1}
                    onClick={() => moveWorkspace(workspaceId, 1)}
                  >
                    <Icon name="arrow-down" size={13} />
                  </button>
                </div>
              </div>
            ))}
          </fieldset>

          <button className="settings-reset" type="button" onClick={reset}>
            Reset workspace layout
          </button>
        </div>
      </details>

      {!compactLayout && !collapsed ? (
        <div
          className="navigation-resizer"
          role="separator"
          aria-label="Resize navigation"
          aria-orientation="vertical"
          aria-valuemin={196}
          aria-valuemax={360}
          aria-valuenow={preferences.navigationWidth}
          tabIndex={0}
          onPointerDown={handleResizeStart}
          onKeyDown={handleResizeKeyDown}
        />
      ) : null}
    </aside>
  );

  if (!compactLayout) return content;

  return (
    <div
      className="navigation-drawer-backdrop"
      role="presentation"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="navigation-drawer" role="dialog" aria-modal="true" aria-label="Workspace navigation">
        {content}
      </div>
    </div>
  );
}
