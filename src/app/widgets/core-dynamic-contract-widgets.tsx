import type { ReactNode } from 'react';
import type { JsonObject } from '../../core/domain';
import type { DocumentNode } from '../../core/project';
import {
  type WidgetCategory,
  type WidgetDefinition,
  type WidgetNodeFactoryContext,
  type WidgetPropValidationIssue,
  type WidgetPropValidationResult,
} from '../../core/widgets';
import { EditorWidgetRegistry, type WidgetPreviewProps } from './editor-widget-registry';

const CONTRACT_WIDGET_TYPES = [
  'core/dynamic-field',
  'core/dynamic-image',
  'core/query-loop',
  'core/repeater',
  'core/conditional',
  'core/product',
  'core/price',
  'core/product-list',
  'core/add-to-cart',
  'core/form',
  'core/form-field',
  'core/form-select',
  'core/form-checkbox',
  'core/form-submit',
  'core/search-filter',
  'core/select-filter',
  'core/range-filter',
  'core/sort-control',
  'core/pagination',
] as const;

export type ContractWidgetType = (typeof CONTRACT_WIDGET_TYPES)[number];
export const DYNAMIC_CONTRACT_WIDGET_TYPES: readonly ContractWidgetType[] = CONTRACT_WIDGET_TYPES;

const modeledCapabilities = {
  local: 'modeled',
  react: 'modeled',
  lamp: 'planned',
  wordpress: 'planned',
} as const;

function issue(path: string, message: string): WidgetPropValidationIssue {
  return { code: 'INVALID_PROP', path, message };
}

function result(issues: WidgetPropValidationIssue[]): WidgetPropValidationResult {
  return { valid: issues.length === 0, issues };
}

function validateKeys(requiredStringKeys: readonly string[]) {
  return (props: JsonObject): WidgetPropValidationResult => {
    const issues: WidgetPropValidationIssue[] = [];
    for (const key of requiredStringKeys) {
      if (typeof props[key] !== 'string') {
        issues.push(issue(key, `${key} must be a string.`));
      }
    }
    return result(issues);
  };
}

function createNodeFactory(
  type: ContractWidgetType,
  defaults: JsonObject,
): (context: WidgetNodeFactoryContext) => DocumentNode {
  return ({ id, name, props, styles, children }) => ({
    id,
    type,
    version: 1,
    ...(name === undefined ? {} : { name }),
    props: { ...structuredClone(defaults), ...(props ?? {}) },
    styles: styles ? structuredClone(styles) : {},
    children: [...(children ?? [])],
  });
}

interface ContractDefinitionOptions {
  type: ContractWidgetType;
  category: Extract<WidgetCategory, 'dynamic' | 'commerce' | 'form' | 'filter'>;
  name: string;
  description: string;
  defaults: JsonObject;
  requiredStringKeys?: readonly string[];
  childPolicy?: WidgetDefinition['childPolicy'];
  fields: readonly string[];
}

function contractDefinition(options: ContractDefinitionOptions): WidgetDefinition {
  return {
    type: options.type,
    version: 1,
    metadata: {
      name: options.name,
      category: options.category,
      icon: options.category,
      description: options.description,
      keywords: [options.category, options.name.toLowerCase(), 'contract'],
    },
    createNode: createNodeFactory(options.type, options.defaults),
    propSchema: { type: 'object', defaults: structuredClone(options.defaults) },
    validateProps: validateKeys(options.requiredStringKeys ?? []),
    inspectorSchema: {
      sections: [
        {
          id: options.category,
          label: options.name,
          fields: [...options.fields],
        },
      ],
    },
    childPolicy: options.childPolicy ?? { kind: 'none' },
    previewRendererId: `${options.type}-contract-preview`,
    capabilities: modeledCapabilities,
    migrations: [],
  };
}

export const DYNAMIC_CONTRACT_WIDGET_DEFINITIONS: readonly WidgetDefinition[] = [
  contractDefinition({ type: 'core/dynamic-field', category: 'dynamic', name: 'Dynamic Field', description: 'Binds displayed text to a content field path.', defaults: { source: 'current', field: 'title', fallback: '' }, requiredStringKeys: ['source', 'field', 'fallback'], fields: ['source', 'field', 'fallback'] }),
  contractDefinition({ type: 'core/dynamic-image', category: 'dynamic', name: 'Dynamic Image', description: 'Binds an image to a content/media field path.', defaults: { source: 'current', field: 'featuredImage', altField: 'title' }, requiredStringKeys: ['source', 'field', 'altField'], fields: ['source', 'field', 'altField'] }),
  contractDefinition({ type: 'core/query-loop', category: 'dynamic', name: 'Query Loop', description: 'Container contract for rendering records from a query definition.', defaults: { queryId: '', emptyText: 'No results' }, requiredStringKeys: ['queryId', 'emptyText'], childPolicy: { kind: 'any', minChildren: 1 }, fields: ['queryId', 'emptyText'] }),
  contractDefinition({ type: 'core/repeater', category: 'dynamic', name: 'Repeater', description: 'Repeats child content for items from a bound array field.', defaults: { source: 'current', field: 'items' }, requiredStringKeys: ['source', 'field'], childPolicy: { kind: 'any', minChildren: 1 }, fields: ['source', 'field'] }),
  contractDefinition({ type: 'core/conditional', category: 'dynamic', name: 'Conditional', description: 'Conditionally includes child content based on a modeled expression.', defaults: { expression: 'true' }, requiredStringKeys: ['expression'], childPolicy: { kind: 'any' }, fields: ['expression'] }),

  contractDefinition({ type: 'core/product', category: 'commerce', name: 'Product', description: 'Product summary presentation contract.', defaults: { productSource: 'current', titleField: 'title', imageField: 'image' }, requiredStringKeys: ['productSource', 'titleField', 'imageField'], fields: ['productSource', 'titleField', 'imageField'] }),
  contractDefinition({ type: 'core/price', category: 'commerce', name: 'Price', description: 'Price display bound to a commerce field.', defaults: { source: 'current', field: 'price', currency: 'USD' }, requiredStringKeys: ['source', 'field', 'currency'], fields: ['source', 'field', 'currency'] }),
  contractDefinition({ type: 'core/product-list', category: 'commerce', name: 'Product List', description: 'Container contract for a product query/list.', defaults: { queryId: '', layout: 'grid' }, requiredStringKeys: ['queryId', 'layout'], childPolicy: { kind: 'any' }, fields: ['queryId', 'layout'] }),
  contractDefinition({ type: 'core/add-to-cart', category: 'commerce', name: 'Add to Cart', description: 'Modeled commerce action without checkout behavior in F04.', defaults: { productSource: 'current', label: 'Add to cart' }, requiredStringKeys: ['productSource', 'label'], fields: ['productSource', 'label'] }),

  contractDefinition({ type: 'core/form', category: 'form', name: 'Form', description: 'Form container contract; submission engine is implemented later.', defaults: { formId: '', method: 'post', successMessage: 'Submitted' }, requiredStringKeys: ['formId', 'method', 'successMessage'], childPolicy: { kind: 'any', minChildren: 1 }, fields: ['formId', 'method', 'successMessage'] }),
  contractDefinition({ type: 'core/form-field', category: 'form', name: 'Form Field', description: 'Text/email/number input field contract.', defaults: { name: 'field', label: 'Field', inputType: 'text', placeholder: '', required: false }, requiredStringKeys: ['name', 'label', 'inputType', 'placeholder'], fields: ['name', 'label', 'inputType', 'placeholder', 'required'] }),
  contractDefinition({ type: 'core/form-select', category: 'form', name: 'Form Select', description: 'Select field contract with modeled options.', defaults: { name: 'select', label: 'Select', options: ['Option 1', 'Option 2'] }, requiredStringKeys: ['name', 'label'], fields: ['name', 'label', 'options'] }),
  contractDefinition({ type: 'core/form-checkbox', category: 'form', name: 'Form Checkbox', description: 'Checkbox field contract.', defaults: { name: 'checkbox', label: 'Checkbox', checked: false }, requiredStringKeys: ['name', 'label'], fields: ['name', 'label', 'checked'] }),
  contractDefinition({ type: 'core/form-submit', category: 'form', name: 'Form Submit', description: 'Submit control contract; no network side effect in F04.', defaults: { label: 'Submit' }, requiredStringKeys: ['label'], fields: ['label'] }),

  contractDefinition({ type: 'core/search-filter', category: 'filter', name: 'Search Filter', description: 'Text-search filter contract bound to a future query.', defaults: { queryId: '', field: 'title', placeholder: 'Search' }, requiredStringKeys: ['queryId', 'field', 'placeholder'], fields: ['queryId', 'field', 'placeholder'] }),
  contractDefinition({ type: 'core/select-filter', category: 'filter', name: 'Select Filter', description: 'Select filter contract for categorical values.', defaults: { queryId: '', field: 'category', label: 'Filter', options: [] }, requiredStringKeys: ['queryId', 'field', 'label'], fields: ['queryId', 'field', 'label', 'options'] }),
  contractDefinition({ type: 'core/range-filter', category: 'filter', name: 'Range Filter', description: 'Numeric range filter contract.', defaults: { queryId: '', field: 'price', min: 0, max: 100 }, requiredStringKeys: ['queryId', 'field'], fields: ['queryId', 'field', 'min', 'max'] }),
  contractDefinition({ type: 'core/sort-control', category: 'filter', name: 'Sort Control', description: 'Sort control contract bound to a future query.', defaults: { queryId: '', field: 'title', direction: 'asc' }, requiredStringKeys: ['queryId', 'field', 'direction'], fields: ['queryId', 'field', 'direction'] }),
  contractDefinition({ type: 'core/pagination', category: 'filter', name: 'Pagination', description: 'Pagination control contract for future query results.', defaults: { queryId: '', pageSize: 12 }, requiredStringKeys: ['queryId'], fields: ['queryId', 'pageSize'] }),
];

function ContractPreview({ node, children }: WidgetPreviewProps) {
  return (
    <div
      className={`widget-preview widget-preview--contract widget-preview--${node.type.replace('core/', '')}`}
      data-widget-preview-type={node.type}
      data-capability="modeled"
    >
      <span className="widget-contract-badge">Modeled contract</span>
      <strong>{node.name ?? node.type}</strong>
      {children}
    </div>
  );
}

const previews: Readonly<Record<ContractWidgetType, (props: WidgetPreviewProps) => ReactNode>> = Object.fromEntries(
  CONTRACT_WIDGET_TYPES.map((type) => [type, ContractPreview]),
) as Readonly<Record<ContractWidgetType, (props: WidgetPreviewProps) => ReactNode>>;

export function registerDynamicContractWidgets(registry: EditorWidgetRegistry): EditorWidgetRegistry {
  for (const widgetDefinition of DYNAMIC_CONTRACT_WIDGET_DEFINITIONS) {
    registry.register({
      definition: widgetDefinition,
      Preview: previews[widgetDefinition.type as ContractWidgetType],
    });
  }
  return registry;
}
