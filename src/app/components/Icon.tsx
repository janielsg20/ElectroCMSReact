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
  | 'settings'
  | 'collapse'
  | 'expand'
  | 'arrow-up'
  | 'arrow-down'
  | 'local';

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
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.12-1.3l2-1.55-2-3.46-2.45 1a7 7 0 0 0-2.25-1.3L13.8 3h-4l-.38 2.39a7 7 0 0 0-2.25 1.3l-2.45-1-2 3.46 2 1.55A7 7 0 0 0 4.6 12c0 .44.04.87.12 1.3l-2 1.55 2 3.46 2.45-1a7 7 0 0 0 2.25 1.3L9.8 21h4l.38-2.39a7 7 0 0 0 2.25-1.3l2.45 1 2-3.46-2-1.55c.08-.43.12-.86.12-1.3Z"/></>,
  collapse: <path d="m14 7-5 5 5 5" />,
  expand: <path d="m10 7 5 5-5 5" />,
  'arrow-up': <path d="m7 14 5-5 5 5" />,
  'arrow-down': <path d="m7 10 5 5 5-5" />,
  local: <><path d="M5 15.5A4.5 4.5 0 0 1 6.5 7a6 6 0 0 1 11.2 2A3.5 3.5 0 0 1 18 16H7"/><path d="m9 15 3 3 3-3M12 18v-7"/></>,
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
