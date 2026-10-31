import type { ReactNode, SVGProps } from 'react';

export type IconName =
  | 'search'
  | 'menu'
  | 'close'
  | 'arrow-right'
  | 'arrow-left'
  | 'chevron-down'
  | 'whatsapp'
  | 'phone'
  | 'mail'
  | 'pin'
  | 'clock'
  | 'plus'
  | 'minus'
  | 'check'
  | 'truck'
  | 'shield'
  | 'engine'
  | 'moto'
  | 'accessory'
  | 'fitment'
  | 'globe'
  | 'copy'
  | 'alert'
  | 'image'
  | 'facebook'
  | 'instagram'
  | 'package'
  | 'wrench'
  | 'external';

const paths: Record<IconName, ReactNode> = {
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m16.5 16.5 4 4" />
    </>
  ),
  menu: (
    <>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </>
  ),
  close: (
    <>
      <path d="m6 6 12 12" />
      <path d="m18 6-12 12" />
    </>
  ),
  'arrow-right': (
    <>
      <path d="M4 12h16" />
      <path d="m14 6 6 6-6 6" />
    </>
  ),
  'arrow-left': (
    <>
      <path d="M20 12H4" />
      <path d="m10 6-6 6 6 6" />
    </>
  ),
  'chevron-down': <path d="m6 9 6 6 6-6" />,
  whatsapp: (
    <>
      <path d="M20.5 11.6a8.4 8.4 0 0 1-12.4 7.5L3.5 20.5l1.4-4.5A8.4 8.4 0 1 1 20.5 11.6Z" />
      <path d="M8.8 8.2c.2-.4.4-.4.7-.4h.5c.2 0 .4 0 .6.5l.8 1.8c.1.3 0 .5-.1.7l-.6.8c-.2.2-.2.4 0 .7.6 1 1.5 1.9 2.6 2.4.3.1.5.1.7-.1l.8-1c.2-.2.4-.2.7-.1l1.8.9c.3.1.4.3.4.5 0 .5-.2 1.3-.7 1.7-.4.4-1.1.6-1.8.5-1.2-.2-2.9-.9-4.4-2.3-1.4-1.4-2.2-2.9-2.4-3.9-.2-.7 0-1.4.4-1.8Z" />
    </>
  ),
  phone: (
    <path d="M6.6 3.5h2.2l1.6 4-2 1.4a13 13 0 0 0 6.7 6.7l1.4-2 4 1.6v2.2a2.6 2.6 0 0 1-2.8 2.6C10.2 19 5 13.8 4 6.3a2.6 2.6 0 0 1 2.6-2.8Z" />
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
  minus: <path d="M5 12h14" />,
  check: <path d="m5 12.5 4.5 4.5L19 7" />,
  truck: (
    <>
      <path d="M3 6h10v10H3z" />
      <path d="M13 10h4l3 3v3h-7" />
      <circle cx="7" cy="17.5" r="1.8" />
      <circle cx="17" cy="17.5" r="1.8" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 5 6v5c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  engine: (
    <>
      <path d="M5 10h3l2-3h5v3h3l2 3v4h-4v2H8v-2H5z" />
      <path d="M10 10V8h4v2" />
      <path d="M3 13h2" />
      <path d="M20 14h1" />
    </>
  ),
  moto: (
    <>
      <circle cx="6" cy="16.5" r="3.2" />
      <circle cx="18" cy="16.5" r="3.2" />
      <path d="M6 16.5h4l3-5h3l2 5" />
      <path d="M12 8h3" />
      <path d="m9 11.5 2 5" />
    </>
  ),
  accessory: (
    <>
      <path d="M4 9.5 12 5l8 4.5v7L12 21l-8-4.5z" />
      <path d="M4 9.5 12 14l8-4.5" />
      <path d="M12 14v7" />
    </>
  ),
  fitment: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v3M12 17.5v3M3.5 12h3M17.5 12h3" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.8 9h16.4M3.8 15h16.4" />
      <path d="M12 3.5c2.2 2.4 3.2 5.2 3.2 8.5s-1 6.1-3.2 8.5c-2.2-2.4-3.2-5.2-3.2-8.5S9.8 5.9 12 3.5Z" />
    </>
  ),
  copy: (
    <>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3" />
    </>
  ),
  alert: (
    <>
      <path d="M12 3.5 21 20H3z" />
      <path d="M12 9v5" />
      <path d="M12 17.5h.01" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="8.5" cy="10" r="1.5" />
      <path d="m4 17 5-5 4 4 2-2 5 5" />
    </>
  ),
  facebook: (
    <path d="M14 21v-7h2.5l.5-3H14V9.2c0-.9.3-1.5 1.6-1.5H17V5.1c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.4-4 4V11H8v3h2.6v7" />
  ),
  instagram: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <path d="M17.2 6.8h.01" />
    </>
  ),
  package: (
    <>
      <path d="M3.5 8 12 3.5 20.5 8v8L12 20.5 3.5 16z" />
      <path d="m3.5 8 8.5 4.5L20.5 8" />
      <path d="M12 12.5v8" />
    </>
  ),
  wrench: (
    <path d="M14.5 6a4.5 4.5 0 0 0-6 5.5L3.5 16.5a2 2 0 1 0 3 3l5-5A4.5 4.5 0 0 0 17 8.5l-2.5 2.5-2-2L14.5 6Z" />
  ),
  external: (
    <>
      <path d="M14 4h6v6" />
      <path d="m20 4-8 8" />
      <path d="M19 14v5a1.5 1.5 0 0 1-1.5 1.5h-12A1.5 1.5 0 0 1 4 19V7a1.5 1.5 0 0 1 1.5-1.5H10" />
    </>
  ),
};

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 20, ...rest }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {paths[name]}
    </svg>
  );
}
