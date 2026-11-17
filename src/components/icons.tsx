type P = { size?: number; strokeWidth?: number; className?: string };

const base = (size = 20, strokeWidth = 1.4) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
});

export const IconSearch = ({ size, strokeWidth, className }: P) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-4.2-4.2" />
  </svg>
);

export const IconUser = ({ size, strokeWidth, className }: P) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <circle cx="12" cy="8" r="3.6" />
    <path d="M4.5 20c1.2-3.6 4-5.4 7.5-5.4s6.3 1.8 7.5 5.4" />
  </svg>
);

export const IconBag = ({ size, strokeWidth, className }: P) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <path d="M5 8h14l-1 12H6L5 8Z" />
    <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
  </svg>
);

export const IconHeart = ({ size, strokeWidth, className, filled }: P & { filled?: boolean }) => (
  <svg {...base(size, strokeWidth)} className={className} fill={filled ? 'currentColor' : 'none'}>
    <path d="M12 20s-7.5-4.6-7.5-9.6A4.4 4.4 0 0 1 12 7.6a4.4 4.4 0 0 1 7.5 2.8C19.5 15.4 12 20 12 20Z" />
  </svg>
);

export const IconArrow = ({ size, strokeWidth, className }: P) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <path d="M4 12h15" />
    <path d="m13 6 6 6-6 6" />
  </svg>
);

export const IconArrowLeft = ({ size, strokeWidth, className }: P) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <path d="M20 12H5" />
    <path d="m11 6-6 6 6 6" />
  </svg>
);

export const IconClose = ({ size, strokeWidth, className }: P) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const IconMenu = ({ size, strokeWidth, className }: P) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <path d="M4 8h16M4 16h16" />
  </svg>
);

export const IconChevron = ({ size, strokeWidth, className }: P) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export const IconCheck = ({ size, strokeWidth, className }: P) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <path d="m5 12.5 4.5 4.5L19 7" />
  </svg>
);

export const IconMinus = ({ size, strokeWidth, className }: P) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <path d="M5 12h14" />
  </svg>
);

export const IconPlus = ({ size, strokeWidth, className }: P) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const IconStar = ({ size = 14, className, filled = true }: P & { filled?: boolean }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth={1.2}
    strokeLinejoin="round"
    aria-hidden="true"
    className={className}
  >
    <path d="m12 3.6 2.6 5.3 5.9.8-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8L3.5 9.7l5.9-.8L12 3.6Z" />
  </svg>
);

export const IconTrash = ({ size, strokeWidth, className }: P) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <path d="M4 7h16M9 7V5h6v2M6.5 7l.8 13h9.4l.8-13" />
  </svg>
);

export const IconTruck = ({ size, strokeWidth, className }: P) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <path d="M2.5 7h10v9h-10zM12.5 10.5h4l3 3V16h-7z" />
    <circle cx="6" cy="18" r="1.6" />
    <circle cx="16.5" cy="18" r="1.6" />
  </svg>
);

export const IconShield = ({ size, strokeWidth, className }: P) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <path d="M12 3.5 5.5 6v6c0 4 2.8 6.9 6.5 8.5 3.7-1.6 6.5-4.5 6.5-8.5V6L12 3.5Z" />
    <path d="m9 12 2.2 2.2L15.5 10" />
  </svg>
);

export const IconSparkle = ({ size, strokeWidth, className }: P) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <path d="M12 3.5c.6 4.4 2.6 6.4 7 7-4.4.6-6.4 2.6-7 7-.6-4.4-2.6-6.4-7-7 4.4-.6 6.4-2.6 7-7Z" />
  </svg>
);

export const IconScissors = ({ size, strokeWidth, className }: P) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <circle cx="6" cy="6.5" r="2.3" />
    <circle cx="6" cy="17.5" r="2.3" />
    <path d="M8 8 20 19M8 16 20 5" />
  </svg>
);

export const IconPackage = ({ size, strokeWidth, className }: P) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <path d="m12 3 8 4.2v9.6L12 21l-8-4.2V7.2L12 3Z" />
    <path d="m4 7.2 8 4.2 8-4.2M12 11.4V21" />
  </svg>
);

export const IconChart = ({ size, strokeWidth, className }: P) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <path d="M4 20V4M4 20h16" />
    <path d="M8 16v-4M12 16V8M16 16v-6" />
  </svg>
);

export const IconGrid = ({ size, strokeWidth, className }: P) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <rect x="4" y="4" width="6.5" height="6.5" rx="1" />
    <rect x="13.5" y="4" width="6.5" height="6.5" rx="1" />
    <rect x="4" y="13.5" width="6.5" height="6.5" rx="1" />
    <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1" />
  </svg>
);

export const IconUsers = ({ size, strokeWidth, className }: P) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3.5 19c.8-3 3-4.6 5.5-4.6s4.7 1.6 5.5 4.6" />
    <path d="M16 5.2a3 3 0 0 1 0 5.8M17.5 14.6c1.7.5 2.8 1.9 3.2 4.4" />
  </svg>
);

export const IconTag = ({ size, strokeWidth, className }: P) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <path d="M11 3.5H4.5V10l9.5 9.5 6-6L11 3.5Z" />
    <circle cx="8" cy="7" r="1.2" />
  </svg>
);

export const IconMessage = ({ size, strokeWidth, className }: P) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <path d="M4 5.5h16v10H9l-5 4v-14Z" />
  </svg>
);

export const IconLock = ({ size, strokeWidth, className }: P) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <rect x="5" y="10.5" width="14" height="9.5" rx="1.5" />
    <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
  </svg>
);

export const IconEdit = ({ size, strokeWidth, className }: P) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <path d="M4 20h4l10-10-4-4L4 16v4Z" />
    <path d="m13.5 6.5 4 4" />
  </svg>
);

export const IconMail = ({ size, strokeWidth, className }: P) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <rect x="3" y="5.5" width="18" height="13" rx="2" />
    <path d="m3.5 7 8.5 6 8.5-6" />
  </svg>
);

export const IconPin = ({ size, strokeWidth, className }: P) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" />
    <circle cx="12" cy="10" r="2.6" />
  </svg>
);

export const IconLogout = ({ size, strokeWidth, className }: P) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <path d="M14 4h4.5A1.5 1.5 0 0 1 20 5.5v13A1.5 1.5 0 0 1 18.5 20H14" />
    <path d="M10 8l-4 4 4 4" />
    <path d="M6 12h9" />
  </svg>
);

export const IconStore = ({ size, strokeWidth, className }: P) => (
  <svg {...base(size, strokeWidth)} className={className}>
    <path d="M4 9.5V19a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9.5" />
    <path d="M3 9.5 5 4h14l2 5.5a2.6 2.6 0 0 1-4.6 1.7 2.6 2.6 0 0 1-4.4 0 2.6 2.6 0 0 1-4.4 0A2.6 2.6 0 0 1 3 9.5Z" />
    <path d="M9.5 20v-5h5v5" />
  </svg>
);
