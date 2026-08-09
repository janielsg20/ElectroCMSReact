import type { SVGProps } from 'react';

export type IconName =
  | 'bolt'
  | 'editor'
  | 'preview'
  | 'backend'
  | 'export'
  | 'menu'
  | 'close'
  | 'undo'
  | 'redo'
  | 'minus'
  | 'plus'
  | 'sun'
  | 'moon'
  | 'system'
  | 'settings'
  | 'collapse'
  | 'expand'
  | 'arrow-up'
  | 'arrow-down'
  | 'local'
  | 'pages'
  | 'content'
  | 'query'
  | 'form'
  | 'filter'
  | 'media'
  | 'theme'
  | 'users'
  | 'blueprint'
  | 'layers'
  | 'blocks'
  | 'search'
  | 'grid'
  | 'command'
  | 'database'
  | 'link'
  | 'palette'
  | 'shield'
  | 'folder'
  | 'image'
  | 'list'
  | 'code'
  | 'check'
  | 'more';

const paths: Record<IconName, React.ReactNode> = {
  bolt: <path d="M13.2 2.5 5.7 13h5.2l-1 8.5L18.3 10h-5.1V2.5Z" />,
  editor: <path d="M4 5.5h16v13H4zM8 9h8M8 12h5M8 15h7" />,
  preview: <><path d="M2.8 12s3.4-5 9.2-5 9.2 5 9.2 5-3.4 5-9.2 5-9.2-5-9.2-5Z"/><circle cx="12" cy="12" r="2.6" /></>,
  backend: <><rect x="4" y="4" width="16" height="6" rx="1.5"/><rect x="4" y="14" width="16" height="6" rx="1.5"/><path d="M8 7h.01M8 17h.01M12 7h5M12 17h5"/></>,
  export: <><path d="M12 15V3m0 0 4 4m-4-4L8 7"/><path d="M5 12v7h14v-7"/></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  undo: <><path d="M9 7 4 12l5 5"/><path d="M5 12h8a6 6 0 0 1 6 6"/></>,
  redo: <><path d="m15 7 5 5-5 5"/><path d="M19 12h-8a6 6 0 0 0-6 6"/></>,
  minus: <path d="M5 12h14" />,
  plus: <path d="M12 5v14M5 12h14" />,
  sun: <><circle cx="12" cy="12" r="3.5"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/></>,
  moon: <path d="M19.5 15.1A8 8 0 0 1 8.9 4.5 8.5 8.5 0 1 0 19.5 15.1Z" />,
  system: <><rect x="3.5" y="4.5" width="17" height="12" rx="1.5"/><path d="M9 20h6M12 16.5V20"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.12-1.3l2-1.55-2-3.46-2.45 1a7 7 0 0 0-2.25-1.3L13.8 3h-4l-.38 2.39a7 7 0 0 0-2.25 1.3l-2.45-1-2 3.46 2 1.55A7 7 0 0 0 4.6 12c0 .44.04.87.12 1.3l-2 1.55 2 3.46 2.45-1a7 7 0 0 0 2.25 1.3L9.8 21h4l.38-2.39a7 7 0 0 0 2.25-1.3l2.45 1 2-3.46-2-1.55c.08-.43.12-.86.12-1.3Z"/></>,
  collapse: <path d="m14 7-5 5 5 5" />,
  expand: <path d="m10 7 5 5-5 5" />,
  'arrow-up': <path d="m7 14 5-5 5 5" />,
  'arrow-down': <path d="m7 10 5 5 5-5" />,
  local: <><path d="M5 15.5A4.5 4.5 0 0 1 6.5 7a6 6 0 0 1 11.2 2A3.5 3.5 0 0 1 18 16H7"/><path d="m9 15 3 3 3-3M12 18v-7"/></>,
  pages: <><path d="M7 3h8l4 4v14H7z"/><path d="M15 3v5h4M10 12h6M10 16h6"/></>,
  content: <><path d="M4 5h16v14H4z"/><path d="M8 9h8M8 13h5M8 17h7"/></>,
  query: <><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 4 4M8 10h5M10.5 7.5v5"/></>,
  form: <><path d="M6 3h12v18H6z"/><path d="M9 8h6M9 12h6M9 16h3"/></>,
  filter: <path d="M4 5h16l-6 7v5l-4 2v-7Z" />,
  media: <><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8" cy="10" r="1.5"/><path d="m5 17 5-5 3 3 2-2 4 4"/></>,
  theme: <><path d="M12 3a9 9 0 1 0 0 18c1.2 0 2-.7 2-1.6 0-.7-.4-1.1-.4-1.8 0-1.1.9-2 2-2H18a3 3 0 0 0 3-3A9 9 0 0 0 12 3Z"/><circle cx="7.5" cy="10" r=".8"/><circle cx="10" cy="6.8" r=".8"/><circle cx="14" cy="6.8" r=".8"/></>,
  users: <><circle cx="9" cy="8" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 8.5a2.5 2.5 0 0 1 0 5M17 15a4 4 0 0 1 3.5 4"/></>,
  blueprint: <><path d="M4 4h16v16H4z"/><path d="M8 4v16M8 9h12M13 9v11"/></>,
  layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/></>,
  blocks: <><rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/></>,
  search: <><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 4 4"/></>,
  grid: <><path d="M4 4h16v16H4zM12 4v16M4 12h16"/></>,
  command: <><path d="M9 6.5A2.5 2.5 0 1 0 6.5 9H18M15 6.5A2.5 2.5 0 1 1 17.5 9H6M9 17.5A2.5 2.5 0 1 1 6.5 15H18M15 17.5A2.5 2.5 0 1 0 17.5 15H6"/></>,
  database: <><ellipse cx="12" cy="5.5" rx="7" ry="3"/><path d="M5 5.5v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6M5 11.5v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/></>,
  link: <><path d="M9.5 14.5 14.5 9.5"/><path d="M7.5 16.5 6 18a3.5 3.5 0 0 1-5-5l3-3a3.5 3.5 0 0 1 5 0M16.5 7.5 18 6a3.5 3.5 0 0 1 5 5l-3 3a3.5 3.5 0 0 1-5 0"/></>,
  palette: <><path d="M12 3a9 9 0 1 0 0 18c1.4 0 2.3-.8 2.3-1.8 0-.8-.5-1.4-.5-2.1 0-1.2 1-2.1 2.1-2.1H18a3 3 0 0 0 3-3 9 9 0 0 0-9-9Z"/></>,
  shield: <><path d="M12 3 5 6v5c0 4.5 2.8 8.1 7 10 4.2-1.9 7-5.5 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/></>,
  folder: <path d="M3 6h7l2 2h9v11H3z" />,
  image: <><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8" cy="9" r="1.5"/><path d="m4 17 5-5 4 4 2-2 5 5"/></>,
  list: <><path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/></>,
  code: <path d="m8 9-4 3 4 3M16 9l4 3-4 3M14 5l-4 14" />,
  check: <path d="m5 12 4 4L19 6" />,
  more: <path d="M5 12h.01M12 12h.01M19 12h.01" />,
};

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 16, ...props }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}
