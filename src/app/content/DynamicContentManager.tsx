import { useState } from 'react';
import { ContentTypeEditor } from './ContentTypeEditor';
import { FieldGroupEditor } from './FieldGroupEditor';
import { TaxonomyEditor } from './TaxonomyEditor';
import './dynamic-content-manager.css';

type DynamicContentPanel = 'content-types' | 'taxonomies' | 'field-groups';

export function DynamicContentManager() {
  const [panel, setPanel] = useState<DynamicContentPanel>('content-types');

  return (
    <section className="dynamic-content-manager" aria-label="Dynamic Content">
      <header className="dynamic-content-manager-header">
        <div>
          <span className="dynamic-content-manager-eyebrow">Local-first data modeling</span>
          <h2>Dynamic Content</h2>
          <p>Define content structure, classification and reusable custom fields from one authoring workspace.</p>
        </div>
        <div className="dynamic-content-manager-tabs" role="tablist" aria-label="Dynamic content sections">
          <button
            id="dynamic-content-tab-content-types"
            type="button"
            role="tab"
            aria-selected={panel === 'content-types'}
            aria-controls="dynamic-content-panel-content-types"
            onClick={() => setPanel('content-types')}
          >
            Content Types
          </button>
          <button
            id="dynamic-content-tab-taxonomies"
            type="button"
            role="tab"
            aria-selected={panel === 'taxonomies'}
            aria-controls="dynamic-content-panel-taxonomies"
            onClick={() => setPanel('taxonomies')}
          >
            Taxonomies
          </button>
          <button
            id="dynamic-content-tab-field-groups"
            type="button"
            role="tab"
            aria-selected={panel === 'field-groups'}
            aria-controls="dynamic-content-panel-field-groups"
            onClick={() => setPanel('field-groups')}
          >
            Field Groups
          </button>
        </div>
      </header>

      <div
        id={`dynamic-content-panel-${panel}`}
        role="tabpanel"
        aria-labelledby={`dynamic-content-tab-${panel}`}
        className="dynamic-content-manager-panel"
      >
        {panel === 'content-types' ? (
          <ContentTypeEditor />
        ) : panel === 'taxonomies' ? (
          <TaxonomyEditor />
        ) : (
          <FieldGroupEditor />
        )}
      </div>
    </section>
  );
}
