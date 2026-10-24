const BASE = 'size-5';
const props = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" className={BASE} {...props} aria-hidden="true">
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
      <path d="M16 6.2a3 3 0 0 1 0 5.6M17.5 19a5.5 5.5 0 0 0-2-4.2" />
    </svg>
  );
}

export function DumbbellIcon() {
  return (
    <svg viewBox="0 0 24 24" className={BASE} {...props} aria-hidden="true">
      <path d="M3 9v6M6 7v10M21 9v6M18 7v10M6 12h12" />
    </svg>
  );
}

export function PlateIcon() {
  return (
    <svg viewBox="0 0 24 24" className={BASE} {...props} aria-hidden="true">
      <path d="M12 3.5c-3.6 0-6.5 3.8-6.5 8.5s2.9 8.5 6.5 8.5 6.5-3.8 6.5-8.5S15.6 3.5 12 3.5Z" />
      <path d="M12 8.5c-1.2 0-2.2 1.6-2.2 3.5s1 3.5 2.2 3.5 2.2-1.6 2.2-3.5-1-3.5-2.2-3.5Z" />
    </svg>
  );
}

export function LogIcon() {
  return (
    <svg viewBox="0 0 24 24" className={BASE} {...props} aria-hidden="true">
      <rect x="4" y="4" width="16" height="17" rx="2.5" />
      <path d="M8 2.5v3M16 2.5v3M4 9.5h16M8.5 14h3M8.5 17.5h7" />
    </svg>
  );
}

export function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" className={BASE} {...props} aria-hidden="true">
      <path d="M4 19.5V4.5M4 19.5h16" />
      <path d="M7.5 15.5l3.5-4 3 2.5 4.5-6" />
    </svg>
  );
}
