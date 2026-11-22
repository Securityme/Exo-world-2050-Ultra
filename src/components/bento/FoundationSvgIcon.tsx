/**
 * [L7] EXW.L7.FOUNDATION_SVG_ICON | v5.0.0 | SADT A5.1
 * Custom Foundation-inspired geometric emblem SVG icons for Medals, Domains & Resources.
 */
export type FoundationIconKind =
  | 'FOUNDER_PRISM'
  | 'STAR_COMPASS'
  | 'ORBIT_CROWN'
  | 'BIO_LEAF'
  | 'AEGIS_SHIELD';

export function FoundationSvgIcon({
  kind,
  className = 'h-6 w-6',
}: {
  readonly kind: FoundationIconKind;
  readonly className?: string;
}) {
  if (kind === 'FOUNDER_PRISM') {
    return (
      <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
        <polygon points="16,2 29,11 24,28 8,28 3,11" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.16" />
        <polygon points="16,7 23,13 20,23 12,23 9,13" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="16" cy="16" r="2.6" fill="currentColor" />
      </svg>
    );
  }
  if (kind === 'ORBIT_CROWN') {
    return (
      <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
        <path d="M5 23L8 10L16 16L24 10L27 23H5Z" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.16" />
        <ellipse cx="16" cy="25.5" rx="11" ry="2.2" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    );
  }
  if (kind === 'BIO_LEAF') {
    return (
      <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
        <path d="M26 6C15 6 7 13 7 25C19 25 26 17 26 6Z" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.18" />
        <path d="M7 25L20 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  if (kind === 'AEGIS_SHIELD') {
    return (
      <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
        <path d="M16 3L27 7V15C27 22 22 26.8 16 29C10 26.8 5 22 5 15V7L16 3Z" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.16" />
        <path d="M16 8V23M10 14H22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <circle cx="16" cy="16" r="12" stroke="currentColor" strokeWidth="1.8" />
      <polygon points="16,5 19,13 27,16 19,19 16,27 13,19 5,16 13,13" fill="currentColor" fillOpacity="0.24" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
