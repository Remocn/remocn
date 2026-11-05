import { cn } from "@/lib/utils";

/** The 24px line glyphs of the introduction screen, drawn in currentColor. */
const GLYPHS = {
  components: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.8" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.8" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.8" />
      <path d="M17 13.5v7M13.5 17h7" />
    </>
  ),
  grid: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.8" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.8" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.8" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.8" />
    </>
  ),
  sparkle: (
    <>
      <path d="M12 3.5c.6 3.9 2.6 5.9 6.5 6.5-3.9.6-5.9 2.6-6.5 6.5-.6-3.9-2.6-5.9-6.5-6.5 3.9-.6 5.9-2.6 6.5-6.5Z" />
      <path
        d="M18.5 15.5c.3 1.6 1 2.3 2.5 2.5-1.5.3-2.2 1-2.5 2.5-.3-1.5-1-2.2-2.5-2.5 1.5-.2 2.2-.9 2.5-2.5Z"
        fill="currentColor"
      />
    </>
  ),
  folder: (
    <>
      <path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2.5h7a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2Z" />
      <path d="m9 14 2 2 4-4" />
    </>
  ),
  terminal: (
    <>
      <rect x="3" y="4.5" width="18" height="15" rx="3" />
      <path d="m7 10 3 2.5L7 15M12.5 15H17" />
    </>
  ),
  play: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="M10 9.5v5l4.5-2.5Z" fill="currentColor" />
    </>
  ),
  timer: (
    <>
      <circle cx="12" cy="13" r="7.5" />
      <path d="M12 9.5V13l2.5 1.5M10 3h4" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5M12 7.8v.2" />
    </>
  ),
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  cross: <path d="M6 6l12 12M18 6 6 18" />,
  chevron: <path d="m6 9 6 6 6-6" />,
  editor: (
    <>
      <rect x="3.5" y="5" width="17" height="14" rx="2.5" />
      <path d="M3.5 14h17M8 14v5M13 14v5" />
    </>
  ),
  cloud: (
    <path d="M7 18.5a4.5 4.5 0 0 1-.6-9 6 6 0 0 1 11.4 1.6A3.8 3.8 0 0 1 17.5 18.5Z" />
  ),
  fork: (
    <>
      <circle cx="7" cy="5.5" r="2" />
      <circle cx="17" cy="5.5" r="2" />
      <circle cx="12" cy="18.5" r="2" />
      <path d="M7 7.5v1.5a3 3 0 0 0 3 3h4a3 3 0 0 0 3-3V7.5M12 12v4.5" />
    </>
  ),
  chat: (
    <path d="M20 12a7.5 7.5 0 0 1-11 6.6L4.5 20l1.3-4.3A7.5 7.5 0 1 1 20 12Z" />
  ),
} as const;

export type GlyphName = keyof typeof GLYPHS;

export function Glyph({
  name,
  className,
  strokeWidth = 1.8,
}: {
  name: GlyphName;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("size-[18px] shrink-0", className)}
    >
      {GLYPHS[name]}
    </svg>
  );
}

/** A glyph struck through, for the "What remocn is not" cards. */
export function StruckGlyph({ name }: { name: GlyphName }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-[18px] shrink-0"
    >
      <g className="stroke-muted-foreground">{GLYPHS[name]}</g>
      <path d="M4 20 20 4" strokeWidth={2} className="stroke-foreground" />
    </svg>
  );
}
