// Functional UI icons, drawn on a 24px grid with one consistent 1.6 stroke.
const base = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
};

const make = paths =>
  function Icon({ size = 18, className, ...rest }) {
    return (
      <svg {...base} width={size} height={size} className={className} {...rest}>
        {paths}
      </svg>
    );
  };

export const SearchIcon = make(
  <>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4 4" />
  </>
);
export const CloseIcon = make(<path d="M6 6l12 12M18 6 6 18" />);
export const MenuIcon = make(<path d="M4 8h16M4 16h16" />);
export const ArrowRight = make(<path d="M5 12h14M13 6l6 6-6 6" />);
export const ArrowLeft = make(<path d="M19 12H5M11 6l-6 6 6 6" />);
export const ArrowUp = make(<path d="M12 19V5M6 11l6-6 6 6" />);
export const ArrowUpRight = make(<path d="M7 17 17 7M8 7h9v9" />);
export const ChevronDown = make(<path d="m6 9 6 6 6-6" />);
export const PlusIcon = make(<path d="M12 5v14M5 12h14" />);
export const CheckIcon = make(<path d="m5 12.5 4.5 4.5L19 7.5" />);
export const BookIcon = make(
  <>
    <rect x="5" y="3.5" width="14" height="17" rx="2" />
    <path d="M8.5 3.5v17M11.5 8h4.5" />
  </>
);
export const PapersIcon = make(
  <>
    <rect x="3.5" y="5" width="17" height="14" rx="2.5" />
    <path d="M7 9h5v4H7zM15 9h2M15 12h2M7 16h10" />
  </>
);
export const PenIcon = make(
  <>
    <path d="M4 20 6.6 12.6 12.4 6.8 17.2 11.6 11.4 17.4Z" />
    <path d="M4 20 9.4 14.6" />
    <circle cx="10.6" cy="13.4" r="1.2" />
    <path d="M13.6 5.6 16 3.2 20.8 8 18.4 10.4" />
  </>
);
export const BookmarkIcon = make(<path d="M7 3.5h10a1 1 0 0 1 1 1v16l-6-4-6 4v-16a1 1 0 0 1 1-1Z" />);
export const PencilIcon = make(
  <>
    <path d="M15.5 4.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
    <path d="m13.5 6.5 3 3" />
  </>
);
export const GroupIcon = make(
  <>
    <circle cx="9" cy="9" r="3" />
    <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
    <path d="M15.5 6.5a2.6 2.6 0 0 1 0 5M17 14.2a5 5 0 0 1 3.5 4.8" />
  </>
);
export const MailIcon = make(
  <>
    <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" />
    <path d="m4.5 7 7.5 6 7.5-6" />
  </>
);
export const ClockIcon = make(
  <>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 8v4.5l3 1.8" />
  </>
);
export const UndoIcon = make(<path d="M9 7 4.5 11.5 9 16M5 11.5h9.5a5 5 0 0 1 0 10H12" />);
export const UserIcon = make(
  <>
    <circle cx="12" cy="8.5" r="3.5" />
    <path d="M5 20a7 7 0 0 1 14 0" />
  </>
);

// Mac & AuraLoop specific icons
export const AppleIcon = make(
  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.61-.75 1.04-1.8 1.01-2.87-.96.04-2.07.64-2.73 1.41-.57.66-.99 1.72-.94 2.76 1.05.08 2.05-.55 2.66-1.3" />
);

export const DisplayIcon = make(
  <>
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </>
);

export const SparklesIcon = make(
  <>
    <path d="m12 3 1.9 4.8L19 9.5l-4 3.6 1.2 5.4-4.2-2.8-4.2 2.8 1.2-5.4-4-3.6 5.1-1.7L12 3z" />
  </>
);

export const DownloadIcon = make(
  <>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </>
);

export const PlayIcon = make(
  <polygon points="5 3 19 12 5 21 5 3" />
);

export const InfinityIcon = make(
  <path d="M18.178 8c5.096 0 5.096 8 0 8-5.095 0-7.267-8-12.356-8-5.096 0-5.096 8 0 8 5.096 0 7.261-8 12.356-8z" />
);

export function Spinner({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={`ch-spin ${className}`}>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity=".25" strokeWidth="2.4" />
      <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}
