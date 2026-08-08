import {
  advancedFieldGroupReference,
  createContentFieldTypeRegistry,
  createGroupDefaultValue,
  evaluateCalculatedField,
  evaluateConditionalField,
  isMf042AdvancedField,
  MAX_ADVANCED_FIELD_DEPTH,
  MAX_REPEATER_ITEMS,
  type CustomFieldDefinition,
  type FieldGroupDefinition,
} from '../../core/content';
import { isJsonObject, type JsonObject, type JsonValue } from '../../core/domain';
import './advanced-record-field-control.css';

const registry = createContentFieldTypeRegistry();

interface AdvancedRecordFieldControlProps {
  field: CustomFieldDefinition;
  value: JsonValue | undefined;
  siblingValues: JsonObject;
  fieldGroups: readonly FieldGroupDefinition[];
  onChange(value: JsonValue): void;
  depth?: number;
}

function displayValue(value: JsonValue | undefined): string {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  return JSON.stringify(value);
}

function resolveGroup(
  fieldGroups: readonly FieldGroupDefinition[],
  field: CustomFieldDefinition,
): FieldGroupDefinition | null {
  const id = advancedFieldGroupReference(field);
  return id ? fieldGroups.find((group) => group.id === id) ?? null : null;
}

function groupDefaults(
  group: FieldGroupDefinition,
  fieldGroups: readonly FieldGroupDefinition[],
  depth: number,
): JsonObject {
  return createGroupDefaultValue(group, {
    registry,
    resolveGroup: (id) => fieldGroups.find((candidate) => candidate.id === id) ?? null,
    depth,
  });
}

function PrimitiveNestedField({
  field,
  value,
  onChange,
}: {
  field: CustomFieldDefinition;
  value: JsonValue | undefined;
  onChange(value: JsonValue): void;
}) {
  const type = field.type;
  if (type === 'core/textarea' || type === 'core/rich-text') {
    return (
      <textarea
        aria-label={field.label}
        rows={type === 'core/rich-text' ? 5 : 3}
        value={typeof value === 'string' ? value : ''}
        placeholder={field.placeholder ?? undefined}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }
  if (type === 'core/number' || type === 'core/currency') {
    return (
      <input
        aria-label={field.label}
        type="number"
        step={typeof field.config.step === 'number' ? field.config.step : 'any'}
        value={typeof value === 'number' ? String(value) : ''}
        onChange={(event) => onChange(event.target.value === '' ? null : Number(event.target.value))}
      />
    );
  }
  if (type === 'core/checkbox' || type === 'core/switch') {
    return (
      <label className="advanced-record-boolean">
        <input
          aria-label={field.label}
          type="checkbox"
          checked={value === true}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span>{value === true ? 'Enabled' : 'Disabled'}</span>
      </label>
    );
  }
  if (type === 'core/select' || type === 'core/radio') {
    const options = Array.isArray(field.config.options)
      ? field.config.options.filter(
          (option): option is JsonObject => isJsonObject(option) && typeof option.value === 'string' && typeof option.label === 'string',
        )
      : [];
    return (
      <select
        aria-label={field.label}
        value={typeof value === 'string' ? value : ''}
        onChange={(event) => onChange(event.target.value || null)}
      >
        <option value="">Select…</option>
        {options.map((option) => (
          <option key={String(option.value)} value={String(option.value)}>{String(option.label)}</option>
        ))}
      </select>
    );
  }
  const htmlType = type === 'core/email'
    ? 'email'
    : type === 'core/url'
      ? 'url'
      : type === 'core/date'
        ? 'date'
        : type === 'core/time'
          ? 'time'
          : type === 'core/datetime'
            ? 'datetime-local'
            : type === 'core/color'
              ? 'color'
              : 'text';
  return (
    <input
      aria-label={field.label}
      type={htmlType}
      value={displayValue(value)}
      placeholder={field.placeholder ?? undefined}
      onChange={(event) => onChange(event.target.value || null)}
    />
  );
}

function NestedGroupEditor({
  group,
  value,
  fieldGroups,
  onChange,
  depth,
}: {
  group: FieldGroupDefinition;
  value: JsonObject;
  fieldGroups: readonly FieldGroupDefinition[];
  onChange(value: JsonObject): void;
  depth: number;
}) {
  if (depth > MAX_ADVANCED_FIELD_DEPTH) {
    return <div className="advanced-record-error">Nested field depth exceeds the safe editor limit.</div>;
  }

  const defaults = groupDefaults(group, fieldGroups, depth);
  const values: JsonObject = { ...defaults, ...value };

  return (
    <div className="advanced-record-nested-grid" data-depth={depth}>
      {group.fields.map((field) => {
        const current = values[field.name];
        const advanced = isMf042AdvancedField(field);
        return (
          <div className="advanced-record-nested-field" key={field.id}>
            <div className="advanced-record-nested-label">
              <strong>{field.label}{field.required ? ' *' : ''}</strong>
              <code>{field.name}</code>
            </div>
            {advanced ? (
              <AdvancedRecordFieldControl
                field={field}
                value={current}
                siblingValues={values}
                fieldGroups={fieldGroups}
                onChange={(next) => onChange({ ...values, [field.name]: next })}
                depth={depth + 1}
              />
            ) : (
              <PrimitiveNestedField
                field={field}
                value={current}
                onChange={(next) => onChange({ ...values, [field.name]: next })}
              />
            )}
            {field.description ? <small>{field.description}</small> : null}
          </div>
        );
      })}
    </div>
  );
}

export function AdvancedRecordFieldControl({
  field,
  value,
  siblingValues,
  fieldGroups,
  onChange,
  depth = 0,
}: AdvancedRecordFieldControlProps) {
  if (depth > MAX_ADVANCED_FIELD_DEPTH) {
    return <div className="advanced-record-error">Advanced field depth exceeds the safe editor limit.</div>;
  }

  if (!isMf042AdvancedField(field)) {
    return (
      <div className="advanced-record-inactive" role="status">
        <strong>Modeled field version</strong>
        <span>{field.type}@{field.typeVersion} has no MF-042 runtime behavior. Upgrade/create the available v2 field definition instead.</span>
      </div>
    );
  }

  if (field.type === 'core/calculated') {
    const result = evaluateCalculatedField(field, siblingValues);
    return (
      <div className="advanced-record-calculated" role="status">
        <span>Calculated</span>
        <strong>{result.ok ? result.value : '—'}</strong>
        <small>{result.ok ? String(field.config.expression ?? '') : result.message}</small>
      </div>
    );
  }

  if (field.type === 'core/conditional') {
    const active = evaluateConditionalField(field, siblingValues);
    if (!active) {
      return (
        <div className="advanced-record-inactive" role="status">
          <strong>Condition not met</strong>
          <span>This nested group is inactive and will persist as null.</span>
        </div>
      );
    }
    const group = resolveGroup(fieldGroups, field);
    if (!group) return <div className="advanced-record-error">Referenced Field Group is unavailable.</div>;
    const current = isJsonObject(value) ? value : groupDefaults(group, fieldGroups, depth + 1);
    return (
      <div className="advanced-record-group-shell">
        <div className="advanced-record-group-heading"><strong>{group.label}</strong><span>Conditional group</span></div>
        <NestedGroupEditor group={group} value={current} fieldGroups={fieldGroups} onChange={onChange} depth={depth + 1} />
      </div>
    );
  }

  if (field.type === 'core/group') {
    const group = resolveGroup(fieldGroups, field);
    if (!group) return <div className="advanced-record-error">Referenced Field Group is unavailable.</div>;
    const current = isJsonObject(value) ? value : groupDefaults(group, fieldGroups, depth + 1);
    return (
      <div className="advanced-record-group-shell">
        <div className="advanced-record-group-heading"><strong>{group.label}</strong><span>Nested group</span></div>
        <NestedGroupEditor group={group} value={current} fieldGroups={fieldGroups} onChange={onChange} depth={depth + 1} />
      </div>
    );
  }

  if (field.type === 'core/repeater') {
    const group = resolveGroup(fieldGroups, field);
    if (!group) return <div className="advanced-record-error">Referenced Field Group is unavailable.</div>;
    const rows = Array.isArray(value) ? value.filter(isJsonObject) : [];
    const configuredMax = typeof field.config.maxItems === 'number' ? field.config.maxItems : MAX_REPEATER_ITEMS;
    const maxItems = Math.min(configuredMax, MAX_REPEATER_ITEMS);
    return (
      <div className="advanced-record-repeater">
        <div className="advanced-record-repeater-heading">
          <div><strong>{group.label}</strong><span>{rows.length} {rows.length === 1 ? 'row' : 'rows'}</span></div>
          <button
            type="button"
            disabled={rows.length >= maxItems}
            onClick={() => onChange([...rows, groupDefaults(group, fieldGroups, depth + 1)])}
          >Add row</button>
        </div>
        {rows.length === 0 ? <div className="advanced-record-inactive"><strong>No rows</strong><span>Add a row to start repeated content.</span></div> : null}
        <div className="advanced-record-repeater-rows">
          {rows.map((row, index) => (
            <section className="advanced-record-repeater-row" key={index} aria-label={`${field.label} row ${index + 1}`}>
              <div className="advanced-record-row-heading">
                <strong>Row {index + 1}</strong>
                <button type="button" onClick={() => onChange(rows.filter((_, rowIndex) => rowIndex !== index))}>Remove</button>
              </div>
              <NestedGroupEditor
                group={group}
                value={row}
                fieldGroups={fieldGroups}
                onChange={(next) => onChange(rows.map((item, rowIndex) => rowIndex === index ? next : item))}
                depth={depth + 1}
              />
            </section>
          ))}
        </div>
      </div>
    );
  }

  return <PrimitiveNestedField field={field} value={value} onChange={onChange} />;
}
