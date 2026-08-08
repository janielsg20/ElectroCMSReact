import type { ReactNode } from 'react';
import { isJsonObject, type JsonObject } from '../../core/domain';
import type { DocumentNode } from '../../core/project';
import {
  type WidgetDefinition,
  type WidgetNodeFactoryContext,
  type WidgetPropValidationIssue,
  type WidgetPropValidationResult,
} from '../../core/widgets';
import { EditorWidgetRegistry, type WidgetPreviewProps } from './editor-widget-registry';

const STRUCTURAL_TYPES = [
  'core/container',
  'core/group',
  'core/section',
  'core/grid',
  'core/flex',
  'core/stack',
  'core/divider',
  'core/spacer',
  'core/tabs',
  'core/accordion',
] as const;

export type StructuralWidgetType = (typeof STRUCTURAL_TYPES)[number];
export const STRUCTURAL_WIDGET_TYPES: readonly StructuralWidgetType[] = STRUCTURAL_TYPES;

const capabilities = {
  local: 'production-ready',
  react: 'modeled',
  lamp: 'planned',
  wordpress: 'planned',
} as const;

function issue(path: string, message: string): WidgetPropValidationIssue {
  return { code: 'INVALID_PROP', path, message };
}

function validation(issues: WidgetPropValidationIssue[]): WidgetPropValidationResult {
  return { valid: issues.length === 0, issues };
}

function validateObject(props: JsonObject): WidgetPropValidationIssue[] {
  return isJsonObject(props) ? [] : [issue('$', 'Widget props must be a JSON object.')];
}

function validateGrid(props: JsonObject): WidgetPropValidationResult {
  const issues = validateObject(props);
  const columns = props.columns;
  const gap = props.gap;
  if (typeof columns !== 'number' || !Number.isInteger(columns) || columns < 1 || columns > 24) {
    issues.push(issue('columns', 'Grid columns must be an integer from 1 to 24.'));
  }
  if (typeof gap !== 'number' || gap < 0 || gap > 256) {
    issues.push(issue('gap', 'Grid gap must be a number from 0 to 256.'));
  }
  return validation(issues);
}

function validateFlex(props: JsonObject): WidgetPropValidationResult {
  const issues = validateObject(props);
  if (!['row', 'column'].includes(String(props.direction))) {
    issues.push(issue('direction', 'Flex direction must be row or column.'));
  }
  if (typeof props.gap !== 'number' || props.gap < 0 || props.gap > 256) {
    issues.push(issue('gap', 'Flex gap must be a number from 0 to 256.'));
  }
  return validation(issues);
}

function validateStack(props: JsonObject): WidgetPropValidationResult {
  const issues = validateObject(props);
  if (typeof props.gap !== 'number' || props.gap < 0 || props.gap > 256) {
    issues.push(issue('gap', 'Stack gap must be a number from 0 to 256.'));
  }
  return validation(issues);
}

function validateDivider(props: JsonObject): WidgetPropValidationResult {
  const issues = validateObject(props);
  if (!['horizontal', 'vertical'].includes(String(props.orientation))) {
    issues.push(issue('orientation', 'Divider orientation must be horizontal or vertical.'));
  }
  return validation(issues);
}

function validateSpacer(props: JsonObject): WidgetPropValidationResult {
  const issues = validateObject(props);
  if (typeof props.size !== 'number' || props.size < 0 || props.size > 2048) {
    issues.push(issue('size', 'Spacer size must be a number from 0 to 2048.'));
  }
  return validation(issues);
}

function validateTabs(props: JsonObject): WidgetPropValidationResult {
  const issues = validateObject(props);
  if (typeof props.activeIndex !== 'number' || !Number.isInteger(props.activeIndex) || props.activeIndex < 0) {
    issues.push(issue('activeIndex', 'Tabs activeIndex must be a non-negative integer.'));
  }
  return validation(issues);
}

function validateAccordion(props: JsonObject): WidgetPropValidationResult {
  const issues = validateObject(props);
  if (typeof props.allowMultiple !== 'boolean') {
    issues.push(issue('allowMultiple', 'Accordion allowMultiple must be boolean.'));
  }
  return validation(issues);
}

function validObject(props: JsonObject): WidgetPropValidationResult {
  return validation(validateObject(props));
}

function createNodeFactory(
  type: StructuralWidgetType,
  version: number,
  defaultProps: JsonObject,
): (context: WidgetNodeFactoryContext) => DocumentNode {
  return ({ id, name, props, styles, children }) => ({
    id,
    type,
    version,
    ...(name === undefined ? {} : { name }),
    props: { ...structuredClone(defaultProps), ...(props ?? {}) },
    styles: styles ? structuredClone(styles) : {},
    children: [...(children ?? [])],
  });
}

interface StructuralDefinitionOptions {
  type: StructuralWidgetType;
  name: string;
  icon: string;
  description: string;
  defaultProps?: JsonObject;
  childPolicy: WidgetDefinition['childPolicy'];
  validateProps?: WidgetDefinition['validateProps'];
  inspectorFields?: readonly string[];
}

function structuralDefinition(options: StructuralDefinitionOptions): WidgetDefinition {
  const version = 1;
  const defaultProps = options.defaultProps ?? {};
  return {
    type: options.type,
    version,
    metadata: {
      name: options.name,
      category: 'structural',
      icon: options.icon,
      description: options.description,
      keywords: [options.name.toLowerCase(), 'layout', 'structure'],
    },
    createNode: createNodeFactory(options.type, version, defaultProps),
    propSchema: {
      type: 'object',
      properties: structuredClone(defaultProps),
    },
    validateProps: options.validateProps ?? validObject,
    inspectorSchema: {
      sections: [
        {
          id: 'layout',
          label: 'Layout',
          fields: [...(options.inspectorFields ?? [])],
        },
      ],
    },
    childPolicy: options.childPolicy,
    previewRendererId: `${options.type}-preview`,
    capabilities,
    migrations: [],
  };
}

export const STRUCTURAL_WIDGET_DEFINITIONS: readonly WidgetDefinition[] = [
  structuralDefinition({
    type: 'core/container',
    name: 'Container',
    icon: 'box',
    description: 'Generic layout container for nested widgets.',
    childPolicy: { kind: 'any' },
  }),
  structuralDefinition({
    type: 'core/group',
    name: 'Group',
    icon: 'group',
    description: 'Logical grouping container used by editor group and ungroup commands.',
    childPolicy: { kind: 'any', minChildren: 1 },
  }),
  structuralDefinition({
    type: 'core/section',
    name: 'Section',
    icon: 'section',
    description: 'Semantic page section for major layout regions.',
    defaultProps: { tag: 'section' },
    childPolicy: { kind: 'any' },
    inspectorFields: ['tag'],
  }),
  structuralDefinition({
    type: 'core/grid',
    name: 'Grid',
    icon: 'grid',
    description: 'Grid layout with configurable columns and gap.',
    defaultProps: { columns: 2, gap: 16 },
    childPolicy: { kind: 'any' },
    validateProps: validateGrid,
    inspectorFields: ['columns', 'gap'],
  }),
  structuralDefinition({
    type: 'core/flex',
    name: 'Flex',
    icon: 'flex',
    description: 'Flexible row or column layout container.',
    defaultProps: { direction: 'row', gap: 12 },
    childPolicy: { kind: 'any' },
    validateProps: validateFlex,
    inspectorFields: ['direction', 'gap'],
  }),
  structuralDefinition({
    type: 'core/stack',
    name: 'Stack',
    icon: 'stack',
    description: 'Vertical stack layout with consistent spacing.',
    defaultProps: { gap: 12 },
    childPolicy: { kind: 'any' },
    validateProps: validateStack,
    inspectorFields: ['gap'],
  }),
  structuralDefinition({
    type: 'core/divider',
    name: 'Divider',
    icon: 'minus',
    description: 'Horizontal or vertical visual separator.',
    defaultProps: { orientation: 'horizontal' },
    childPolicy: { kind: 'none' },
    validateProps: validateDivider,
    inspectorFields: ['orientation'],
  }),
  structuralDefinition({
    type: 'core/spacer',
    name: 'Spacer',
    icon: 'space',
    description: 'Explicit layout spacing element.',
    defaultProps: { size: 24 },
    childPolicy: { kind: 'none' },
    validateProps: validateSpacer,
    inspectorFields: ['size'],
  }),
  structuralDefinition({
    type: 'core/tabs',
    name: 'Tabs',
    icon: 'tabs',
    description: 'Tabbed structural container contract.',
    defaultProps: { activeIndex: 0 },
    childPolicy: { kind: 'any' },
    validateProps: validateTabs,
    inspectorFields: ['activeIndex'],
  }),
  structuralDefinition({
    type: 'core/accordion',
    name: 'Accordion',
    icon: 'accordion',
    description: 'Expandable structural container contract.',
    defaultProps: { allowMultiple: false },
    childPolicy: { kind: 'any' },
    validateProps: validateAccordion,
    inspectorFields: ['allowMultiple'],
  }),
];

function PreviewFrame({ node, children, className }: WidgetPreviewProps & { className: string }) {
  return (
    <div className={`widget-preview ${className}`} data-widget-preview-type={node.type}>
      {children}
    </div>
  );
}

function ContainerPreview(props: WidgetPreviewProps) {
  return <PreviewFrame {...props} className="widget-preview--container" />;
}

function GroupPreview(props: WidgetPreviewProps) {
  return <PreviewFrame {...props} className="widget-preview--group" />;
}

function SectionPreview(props: WidgetPreviewProps) {
  return <PreviewFrame {...props} className="widget-preview--section" />;
}

function GridPreview({ node, children }: WidgetPreviewProps) {
  const columns = typeof node.props.columns === 'number' ? node.props.columns : 2;
  const gap = typeof node.props.gap === 'number' ? node.props.gap : 16;
  return (
    <div
      className="widget-preview widget-preview--grid"
      data-widget-preview-type={node.type}
      data-grid-columns={columns}
      style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gap }}
    >
      {children}
    </div>
  );
}

function FlexPreview({ node, children }: WidgetPreviewProps) {
  const direction = node.props.direction === 'column' ? 'column' : 'row';
  const gap = typeof node.props.gap === 'number' ? node.props.gap : 12;
  return (
    <div
      className="widget-preview widget-preview--flex"
      data-widget-preview-type={node.type}
      style={{ display: 'flex', flexDirection: direction, gap }}
    >
      {children}
    </div>
  );
}

function StackPreview({ node, children }: WidgetPreviewProps) {
  const gap = typeof node.props.gap === 'number' ? node.props.gap : 12;
  return (
    <div
      className="widget-preview widget-preview--stack"
      data-widget-preview-type={node.type}
      style={{ display: 'flex', flexDirection: 'column', gap }}
    >
      {children}
    </div>
  );
}

function DividerPreview({ node }: WidgetPreviewProps) {
  const vertical = node.props.orientation === 'vertical';
  return (
    <div
      className="widget-preview widget-preview--divider"
      data-widget-preview-type={node.type}
      data-orientation={vertical ? 'vertical' : 'horizontal'}
      aria-hidden="true"
    />
  );
}

function SpacerPreview({ node }: WidgetPreviewProps) {
  const size = typeof node.props.size === 'number' ? node.props.size : 24;
  return (
    <div
      className="widget-preview widget-preview--spacer"
      data-widget-preview-type={node.type}
      style={{ minHeight: size }}
      aria-label={`Spacer ${size}px`}
    />
  );
}

function TabsPreview({ children }: WidgetPreviewProps) {
  return (
    <div className="widget-preview widget-preview--tabs">
      <div className="widget-preview-tabs-label" aria-hidden="true">Tabs</div>
      {children}
    </div>
  );
}

function AccordionPreview({ children }: WidgetPreviewProps) {
  return (
    <div className="widget-preview widget-preview--accordion">
      <div className="widget-preview-accordion-label" aria-hidden="true">Accordion</div>
      {children}
    </div>
  );
}

const structuralPreviews: Readonly<Record<StructuralWidgetType, (props: WidgetPreviewProps) => ReactNode>> = {
  'core/container': ContainerPreview,
  'core/group': GroupPreview,
  'core/section': SectionPreview,
  'core/grid': GridPreview,
  'core/flex': FlexPreview,
  'core/stack': StackPreview,
  'core/divider': DividerPreview,
  'core/spacer': SpacerPreview,
  'core/tabs': TabsPreview,
  'core/accordion': AccordionPreview,
};

export function registerStructuralWidgets(registry: EditorWidgetRegistry): EditorWidgetRegistry {
  for (const definition of STRUCTURAL_WIDGET_DEFINITIONS) {
    const Preview = structuralPreviews[definition.type as StructuralWidgetType];
    registry.register({ definition, Preview });
  }
  return registry;
}

export function createDefaultEditorWidgetRegistry(): EditorWidgetRegistry {
  return registerStructuralWidgets(new EditorWidgetRegistry());
}

export const defaultEditorWidgetRegistry = createDefaultEditorWidgetRegistry();
