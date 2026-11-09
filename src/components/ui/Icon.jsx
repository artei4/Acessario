/** Ícones em SVG desenhados à mão (traço 2px, viewBox 24). Decorativos por padrão. */
const PATHS = {
  map: <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Zm0 0v14m6-12v14" />,
  routes: <path d="M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm12-10a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM8 17h7a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7" />,
  plus: <path d="M12 5v14M5 12h14" />,
  user: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0" />,
  back: <path d="M15 5 8 12l7 7" />,
  chevron: <path d="m9 6 6 6-6 6" />,
  check: <path d="m5 12 5 5 9-10" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  pin: <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Zm0-9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />,
  origin: <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Zm0-9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />,
  camera: <path d="M4 8h3l2-3h6l2 3h3v11H4V8Zm8 9a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />,
  warning: <path d="M12 4 2.5 20h19L12 4Zm0 6v4m0 3v.01" />,
  edit: <path d="M4 20h4L19 9l-4-4L4 16v4Zm10-14 4 4" />,
  trash: <path d="M5 7h14M10 7V4h4v3m-7 0 1 13h8l1-13" />,
  clock: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13v5l3 2" />,
  locate: <path d="M12 19a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm0-4a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm0-13v3m0 14v3M2 12h3m14 0h3" />,
  swap: <path d="M7 4v16m0 0-3-3m3 3 3-3M17 20V4m0 0-3 3m3-3 3 3" />,
  wheelchair: (
    <path d="M12 5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm-1 2v6h6l2 5h2M11 10h5M8.5 10.5A5.5 5.5 0 1 0 16 17" />
  ),
  walk: <path d="M13 5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm-3 17 2-7 2 2v5m-6-9 2-4 3 1 2 3 3 1M10 15l-1-3" />,
  eye: <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />,
  cane: <path d="M11 5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm-2 17 1.5-7L12 17v5m-3-8 1-5 3 2 2 2m2-2v12" />,
  logout: <path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10" />,
  shield: <path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z" />,
  sun: <path d="M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0-14v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />,
  moon: <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />,
  auto: <path d="M12 21a9 9 0 1 0 0-18v18Zm0-18a9 9 0 0 1 0 18" />,
  navigation: <path d="m4 11 16-7-7 16-2-7-7-2Z" />,
};

export function Icon({ name, size = 20, label, className, strokeWidth = 2 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      {PATHS[name] ?? null}
    </svg>
  );
}
