import type { ReactNode } from 'react';
import type { JsonObject, JsonValue } from '../../core/domain';
import type { DocumentNode } from '../../core/project';
import {
  type WidgetDefinition,
  type WidgetNodeFactoryContext,
  type WidgetPropValidationIssue,
  type WidgetPropValidationResult,
} from '../../core/widgets';
import { EditorWidgetRegistry, type WidgetPreviewProps } from './editor-widget-registry';

const BASIC_WIDGET_TYPES = [
  'core/heading',
  'core/text',
  'core/image',
  'core/button',
  'core/icon',
  'core/logo',
  'core/video',
  'core/shape',
] as const;

const CONTENT_WIDGET_TYPES = [
  'core/top-bar',
  'core/navigation',
  'core/header',
  'core/feature-list',
  'core/cta',
  'core/footer',
  'core/login',
  'core/logout',
] as const;

export type BasicWidgetType = (typeof BASIC_WIDGET_TYPES)[number];
export type ContentWidgetType = (typeof CONTENT_WIDGET_TYPES)[number];
export type BasicContentWidgetType = BasicWidgetType | ContentWidgetType;
export const BASIC_CONTENT_WIDGET_TYPES: readonly BasicContentWidgetType[] = [
  ...BASIC_WIDGET_TYPES,
  ...CONTENT_WIDGET_TYPES,
];

const capabilities = {
  local: 'production-ready',
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

function requireString(
  props: JsonObject,
  key: string,
  issues: WidgetPropValidationIssue[],
  options: { allowEmpty?: boolean } = {},
): string {
  const value = props[key];
  if (typeof value !== 'string' || (!options.allowEmpty && value.trim().length === 0)) {
    issues.push(issue(key, `${key} must be ${options.allowEmpty ? 'a string' : 'a non-empty string'}.`));
    return '';
  }
  return value;
}

function requireStringArray(props: JsonObject, key: string, issues: WidgetPropValidationIssue[]): void {
  const value = props[key];
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== 'string')) {
    issues.push(issue(key, `${key} must be an array of strings.`));
  }
}

function requireObjectArray(props: JsonObject, key: string, issues: WidgetPropValidationIssue[]): void {
  const value = props[key];
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== 'object' || entry === null || Array.isArray(entry))) {
    issues.push(issue(key, `${key} must be an array of objects.`));
  }
}

function validateText(props: JsonObject): WidgetPropValidationResult {
  const issues: WidgetPropValidationIssue[] = [];
  requireString(props, 'text', issues);
  return result(issues);
}

function validateHeading(props: JsonObject): WidgetPropValidationResult {
  const issues: WidgetPropValidationIssue[] = [];
  requireString(props, 'text', issues);
  const level = props.level;
  if (typeof level !== 'number' || !Number.isInteger(level) || level < 1 || level > 6) {
    issues.push(issue('level', 'level must be an integer from 1 to 6.'));
  }
  return result(issues);
}

function validateImage(props: JsonObject): WidgetPropValidationResult {
  const issues: WidgetPropValidationIssue[] = [];
  requireString(props, 'src', issues, { allowEmpty: true });
  requireString(props, 'alt', issues, { allowEmpty: true });
  return result(issues);
}

function validateButton(props: JsonObject): WidgetPropValidationResult {
  const issues: WidgetPropValidationIssue[] = [];
  requireString(props, 'label', issues);
  requireString(props, 'href', issues, { allowEmpty: true });
  return result(issues);
}

function validateIcon(props: JsonObject): WidgetPropValidationResult {
  const issues: WidgetPropValidationIssue[] = [];
  requireString(props, 'name', issues);
  requireString(props, 'label', issues, { allowEmpty: true });
  return result(issues);
}

function validateLogo(props: JsonObject): WidgetPropValidationResult {
  const issues: WidgetPropValidationIssue[] = [];
  requireString(props, 'text', issues);
  requireString(props, 'src', issues, { allowEmpty: true });
  return result(issues);
}

function validateVideo(props: JsonObject): WidgetPropValidationResult {
  const issues: WidgetPropValidationIssue[] = [];
  requireString(props, 'src', issues, { allowEmpty: true });
  requireString(props, 'title', issues);
  return result(issues);
}

function validateShape(props: JsonObject): WidgetPropValidationResult {
  const issues: WidgetPropValidationIssue[] = [];
  if (!['rectangle', 'circle', 'pill'].includes(String(props.shape))) {
    issues.push(issue('shape', 'shape must be rectangle, circle or pill.'));
  }
  return result(issues);
}

function validateNavigation(props: JsonObject): WidgetPropValidationResult {
  const issues: WidgetPropValidationIssue[] = [];
  requireObjectArray(props, 'items', issues);
  return result(issues);
}

function validateFeatureList(props: JsonObject): WidgetPropValidationResult {
  const issues: WidgetPropValidationIssue[] = [];
  requireStringArray(props, 'items', issues);
  return result(issues);
}

function validateHeader(props: JsonObject): WidgetPropValidationResult {
  const issues: WidgetPropValidationIssue[] = [];
  requireString(props, 'title', issues);
  requireString(props, 'subtitle', issues, { allowEmpty: true });
  return result(issues);
}

function validateCta(props: JsonObject): WidgetPropValidationResult {
  const issues: WidgetPropValidationIssue[] = [];
  requireString(props, 'heading', issues);
  requireString(props, 'text', issues, { allowEmpty: true });
  requireString(props, 'buttonLabel', issues);
  requireString(props, 'href', issues, { allowEmpty: true });
  return result(issues);
}

function validateLogin(props: JsonObject): WidgetPropValidationResult {
  const issues: WidgetPropValidationIssue[] = [];
  requireString(props, 'title', issues);
  requireString(props, 'buttonLabel', issues);
  return result(issues);
}

function createNodeFactory(
  type: BasicContentWidgetType,
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

interface DefinitionOptions {
  type: BasicContentWidgetType;
  category: 'basic' | 'content';
  name: string;
  icon: string;
  description: string;
  defaultProps: JsonObject;
  validateProps: WidgetDefinition['validateProps'];
  childPolicy?: WidgetDefinition['childPolicy'];
  inspectorFields: readonly string[];
}

function definition(options: DefinitionOptions): WidgetDefinition {
  return {
    type: options.type,
    version: 1,
    metadata: {
      name: options.name,
      category: options.category,
      icon: options.icon,
      description: options.description,
      keywords: [options.name.toLowerCase(), options.category, 'content'],
    },
    createNode: createNodeFactory(options.type, 1, options.defaultProps),
    propSchema: { type: 'object', defaults: structuredClone(options.defaultProps) },
    validateProps: options.validateProps,
    inspectorSchema: {
      sections: [
        {
          id: 'content',
          label: 'Content',
          fields: [...options.inspectorFields],
        },
      ],
    },
    childPolicy: options.childPolicy ?? { kind: 'none' },
    previewRendererId: `${options.type}-preview`,
    capabilities,
    migrations: [],
  };
}

const navigationItems: JsonValue[] = [
  { label: 'Home', href: '#' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#contact' },
];

export const BASIC_CONTENT_WIDGET_DEFINITIONS: readonly WidgetDefinition[] = [
  definition({
    type: 'core/heading', category: 'basic', name: 'Heading', icon: 'heading',
    description: 'Semantic heading text.', defaultProps: { text: 'Heading', level: 2 },
    validateProps: validateHeading, inspectorFields: ['text', 'level'],
  }),
  definition({
    type: 'core/text', category: 'basic', name: 'Text', icon: 'text',
    description: 'Paragraph text content.', defaultProps: { text: 'Text block' },
    validateProps: validateText, inspectorFields: ['text'],
  }),
  definition({
    type: 'core/image', category: 'basic', name: 'Image', icon: 'image',
    description: 'Accessible image element.', defaultProps: { src: '', alt: 'Image' },
    validateProps: validateImage, inspectorFields: ['src', 'alt'],
  }),
  definition({
    type: 'core/button', category: 'basic', name: 'Button', icon: 'button',
    description: 'Call-to-action button or link.', defaultProps: { label: 'Button', href: '#' },
    validateProps: validateButton, inspectorFields: ['label', 'href'],
  }),
  definition({
    type: 'core/icon', category: 'basic', name: 'Icon', icon: 'star',
    description: 'Decorative or labeled icon contract.', defaultProps: { name: 'star', label: 'Icon' },
    validateProps: validateIcon, inspectorFields: ['name', 'label'],
  }),
  definition({
    type: 'core/logo', category: 'basic', name: 'Logo', icon: 'logo',
    description: 'Brand logo with image or text fallback.', defaultProps: { text: 'Brand', src: '' },
    validateProps: validateLogo, inspectorFields: ['text', 'src'],
  }),
  definition({
    type: 'core/video', category: 'basic', name: 'Video', icon: 'video',
    description: 'Video/media placeholder contract.', defaultProps: { src: '', title: 'Video' },
    validateProps: validateVideo, inspectorFields: ['src', 'title'],
  }),
  definition({
    type: 'core/shape', category: 'basic', name: 'Shape', icon: 'shape',
    description: 'Simple decorative geometric shape.', defaultProps: { shape: 'rectangle' },
    validateProps: validateShape, inspectorFields: ['shape'],
  }),
  definition({
    type: 'core/top-bar', category: 'content', name: 'Top Bar', icon: 'topbar',
    description: 'Compact announcement or utility bar.', defaultProps: { text: 'Announcement' },
    validateProps: validateText, inspectorFields: ['text'],
  }),
  definition({
    type: 'core/navigation', category: 'content', name: 'Navigation', icon: 'navigation',
    description: 'Navigation links collection.', defaultProps: { items: navigationItems },
    validateProps: validateNavigation, inspectorFields: ['items'],
  }),
  definition({
    type: 'core/header', category: 'content', name: 'Header', icon: 'header',
    description: 'Page/site header content block.', defaultProps: { title: 'Site title', subtitle: '' },
    validateProps: validateHeader, childPolicy: { kind: 'any' }, inspectorFields: ['title', 'subtitle'],
  }),
  definition({
    type: 'core/feature-list', category: 'content', name: 'Feature List', icon: 'list',
    description: 'List of product or service features.', defaultProps: { items: ['Feature one', 'Feature two', 'Feature three'] },
    validateProps: validateFeatureList, inspectorFields: ['items'],
  }),
  definition({
    type: 'core/cta', category: 'content', name: 'Call to Action', icon: 'megaphone',
    description: 'Heading, copy and action button content block.',
    defaultProps: { heading: 'Ready to start?', text: 'Tell visitors what to do next.', buttonLabel: 'Get started', href: '#' },
    validateProps: validateCta, inspectorFields: ['heading', 'text', 'buttonLabel', 'href'],
  }),
  definition({
    type: 'core/footer', category: 'content', name: 'Footer', icon: 'footer',
    description: 'Site footer content region.', defaultProps: { text: '© Your company' },
    validateProps: validateText, childPolicy: { kind: 'any' }, inspectorFields: ['text'],
  }),
  definition({
    type: 'core/login', category: 'content', name: 'Login', icon: 'login',
    description: 'Login form presentation contract.', defaultProps: { title: 'Sign in', buttonLabel: 'Sign in' },
    validateProps: validateLogin, inspectorFields: ['title', 'buttonLabel'],
  }),
  definition({
    type: 'core/logout', category: 'content', name: 'Logout', icon: 'logout',
    description: 'Logout action presentation contract.', defaultProps: { label: 'Sign out', href: '#' },
    validateProps: validateButton, inspectorFields: ['label', 'href'],
  }),
];

function textProp(node: DocumentNode, key: string, fallback: string): string {
  return typeof node.props[key] === 'string' ? node.props[key] : fallback;
}

function HeadingPreview({ node }: WidgetPreviewProps) {
  const level = typeof node.props.level === 'number' ? Math.min(6, Math.max(1, node.props.level)) : 2;
  const HeadingTag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  return <HeadingTag className="widget-preview widget-preview--heading">{textProp(node, 'text', 'Heading')}</HeadingTag>;
}

function TextPreview({ node }: WidgetPreviewProps) {
  return <p className="widget-preview widget-preview--text">{textProp(node, 'text', 'Text block')}</p>;
}

function ImagePreview({ node }: WidgetPreviewProps) {
  const src = textProp(node, 'src', '');
  const alt = textProp(node, 'alt', '');
  return src ? (
    <img className="widget-preview widget-preview--image" src={src} alt={alt} />
  ) : (
    <div className="widget-preview widget-preview--media-placeholder" role="img" aria-label={alt || 'Image placeholder'}>Image</div>
  );
}

function ButtonPreview({ node }: WidgetPreviewProps) {
  return <a className="widget-preview widget-preview--button" href={textProp(node, 'href', '#')}>{textProp(node, 'label', 'Button')}</a>;
}

function IconPreview({ node }: WidgetPreviewProps) {
  return <span className="widget-preview widget-preview--icon" role="img" aria-label={textProp(node, 'label', 'Icon')}>◇ {textProp(node, 'name', 'star')}</span>;
}

function LogoPreview({ node }: WidgetPreviewProps) {
  const src = textProp(node, 'src', '');
  return src ? <img className="widget-preview widget-preview--logo" src={src} alt={textProp(node, 'text', 'Brand')} /> : <strong className="widget-preview widget-preview--logo">{textProp(node, 'text', 'Brand')}</strong>;
}

function VideoPreview({ node }: WidgetPreviewProps) {
  const src = textProp(node, 'src', '');
  const title = textProp(node, 'title', 'Video');
  return src ? <video className="widget-preview widget-preview--video" src={src} aria-label={title} controls /> : <div className="widget-preview widget-preview--media-placeholder" role="img" aria-label={`${title} placeholder`}>Video</div>;
}

function ShapePreview({ node }: WidgetPreviewProps) {
  return <div className="widget-preview widget-preview--shape" data-shape={textProp(node, 'shape', 'rectangle')} aria-hidden="true" />;
}

function TopBarPreview({ node }: WidgetPreviewProps) {
  return <div className="widget-preview widget-preview--top-bar">{textProp(node, 'text', 'Announcement')}</div>;
}

function NavigationPreview({ node }: WidgetPreviewProps) {
  const rawItems = Array.isArray(node.props.items) ? node.props.items : [];
  return (
    <nav className="widget-preview widget-preview--navigation" aria-label="Preview navigation">
      {rawItems.map((item, index) => {
        const label = typeof item === 'object' && item !== null && !Array.isArray(item) && typeof item.label === 'string' ? item.label : `Item ${index + 1}`;
        const href = typeof item === 'object' && item !== null && !Array.isArray(item) && typeof item.href === 'string' ? item.href : '#';
        return <a href={href} key={`${label}-${index}`}>{label}</a>;
      })}
    </nav>
  );
}

function HeaderPreview({ node, children }: WidgetPreviewProps) {
  return <header className="widget-preview widget-preview--header"><strong>{textProp(node, 'title', 'Site title')}</strong><span>{textProp(node, 'subtitle', '')}</span>{children}</header>;
}

function FeatureListPreview({ node }: WidgetPreviewProps) {
  const items = Array.isArray(node.props.items) ? node.props.items.filter((item): item is string => typeof item === 'string') : [];
  return <ul className="widget-preview widget-preview--feature-list">{items.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul>;
}

function CtaPreview({ node }: WidgetPreviewProps) {
  return <section className="widget-preview widget-preview--cta"><strong>{textProp(node, 'heading', 'Ready to start?')}</strong><p>{textProp(node, 'text', '')}</p><a href={textProp(node, 'href', '#')}>{textProp(node, 'buttonLabel', 'Get started')}</a></section>;
}

function FooterPreview({ node, children }: WidgetPreviewProps) {
  return <footer className="widget-preview widget-preview--footer"><span>{textProp(node, 'text', '© Your company')}</span>{children}</footer>;
}

function LoginPreview({ node }: WidgetPreviewProps) {
  return <div className="widget-preview widget-preview--auth"><strong>{textProp(node, 'title', 'Sign in')}</strong><label>Email<input type="email" disabled /></label><label>Password<input type="password" disabled /></label><button type="button" disabled>{textProp(node, 'buttonLabel', 'Sign in')}</button></div>;
}

function LogoutPreview({ node }: WidgetPreviewProps) {
  return <button className="widget-preview widget-preview--logout" type="button" disabled>{textProp(node, 'label', 'Sign out')}</button>;
}

const previews: Readonly<Record<BasicContentWidgetType, (props: WidgetPreviewProps) => ReactNode>> = {
  'core/heading': HeadingPreview,
  'core/text': TextPreview,
  'core/image': ImagePreview,
  'core/button': ButtonPreview,
  'core/icon': IconPreview,
  'core/logo': LogoPreview,
  'core/video': VideoPreview,
  'core/shape': ShapePreview,
  'core/top-bar': TopBarPreview,
  'core/navigation': NavigationPreview,
  'core/header': HeaderPreview,
  'core/feature-list': FeatureListPreview,
  'core/cta': CtaPreview,
  'core/footer': FooterPreview,
  'core/login': LoginPreview,
  'core/logout': LogoutPreview,
};

export function registerBasicContentWidgets(registry: EditorWidgetRegistry): EditorWidgetRegistry {
  for (const widgetDefinition of BASIC_CONTENT_WIDGET_DEFINITIONS) {
    registry.register({
      definition: widgetDefinition,
      Preview: previews[widgetDefinition.type as BasicContentWidgetType],
    });
  }
  return registry;
}
