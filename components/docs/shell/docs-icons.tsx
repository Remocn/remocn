import type { ReactNode, SVGProps } from "react";
import type { DocsTabId } from "@/lib/docs-tabs";

/**
 * Line icons from the docs shell artboard: one per library (the switcher) and
 * one per sidebar category. All stroke `currentColor`, so the row decides the
 * colour (foreground when open or active, body otherwise).
 */
function Icon({
  children,
  strokeWidth = 1.7,
  ...props
}: SVGProps<SVGSVGElement> & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

type IconProps = { className?: string; strokeWidth?: number };

const TAB_PATHS: Record<DocsTabId, ReactNode> = {
  components: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="2" />
    </>
  ),
  primitives: (
    <>
      <rect x="2.5" y="7" width="19" height="10" rx="5" />
      <circle cx="16.5" cy="12" r="3" />
    </>
  ),
  shaders: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M5 7.5c3 1.5 5 4.5 5.5 9M9.5 3.8c3.5 2 6 5.5 6.5 10.5M15.5 4.3c2 2.2 3.2 5 3.4 8" />
    </>
  ),
  filters: (
    <>
      <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
      <circle cx="15" cy="7" r="2" />
      <circle cx="9" cy="17" r="2" />
    </>
  ),
  captions: (
    <>
      <path d="M5.5 4h13A2.5 2.5 0 0 1 21 6.5v8a2.5 2.5 0 0 1-2.5 2.5H11l-4.5 3.5V17h-1A2.5 2.5 0 0 1 3 14.5v-8A2.5 2.5 0 0 1 5.5 4Z" />
      <path d="M7.5 9h9M7.5 12.5h6" />
    </>
  ),
  templates: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4" />
    </>
  ),
  icons: (
    <>
      <path d="M12 3c.7 4.3 2.7 6.3 7 7-4.3.7-6.3 2.7-7 7-.7-4.3-2.7-6.3-7-7 4.3-.7 6.3-2.7 7-7Z" />
      <path d="M18.5 15.5c.3 1.9 1.1 2.7 3 3-1.9.3-2.7 1.1-3 3-.3-1.9-1.1-2.7-3-3 1.9-.3 2.7-1.1 3-3Z" />
    </>
  ),
};

/** Category icons, keyed by folder slug (`primitives:` for that library). */
const GROUP_PATHS: Record<string, ReactNode> = {
  "getting-started": (
    <>
      <path d="M12 15c-1.5-1.5-3-3-3-3s2.5-7 9-8c-1 6.5-8 9-8 9" />
      <path d="M9 12H5l3-4h4M12 15v4l4-3v-4" />
      <path d="M6.5 16.5C5 17 4.5 19.5 4.5 19.5S7 19 7.5 17.5" />
    </>
  ),
  guides: (
    <>
      <path d="M12 6.5C10 5 7 4.5 3.5 5v13c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5Z" />
      <path d="M12 6.5v13" />
    </>
  ),
  craft: (
    <>
      <path d="m4 20 11-11" />
      <path d="m13 7 2-2 4 4-2 2" />
      <path d="M18 3v2M21 6h-2M7 4v2M6 5h2M19 15v2M18 16h2" />
    </>
  ),
  layout: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="3" />
      <path d="M3.5 9.5h17M10 9.5v11" />
    </>
  ),
  typography: (
    <>
      <path d="M4 7V5h11v2M9.5 5v14M7.5 19h4" />
      <path d="M14 12v-1.5h6V12M17 10.5V19M15.5 19h3" />
    </>
  ),
  "ui-blocks": (
    <>
      <rect x="3.5" y="3.5" width="7" height="9" rx="2" />
      <rect x="13.5" y="3.5" width="7" height="5" rx="2" />
      <rect x="13.5" y="11.5" width="7" height="9" rx="2" />
      <rect x="3.5" y="15.5" width="7" height="5" rx="2" />
    </>
  ),
  ai: (
    <>
      <rect x="5" y="5" width="14" height="14" rx="3" />
      <path d="M9 2.5V5M15 2.5V5M9 19v2.5M15 19v2.5M2.5 9H5M2.5 15H5M19 9h2.5M19 15h2.5" />
      <path d="M9.5 14.5 11 9.5h1l1.5 5M10 13h2.5M15.5 9.5v5" />
    </>
  ),
  transitions: (
    <>
      <rect x="3" y="5" width="8" height="14" rx="2" />
      <path d="M15 5h4a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-4" />
      <path d="m13 9 3 3-3 3" />
    </>
  ),
  social: (
    <>
      <circle cx="18" cy="5.5" r="2.5" />
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="18.5" r="2.5" />
      <path d="m8.2 10.8 7.6-4.1M8.2 13.2l7.6 4.1" />
    </>
  ),
  templates: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="m10 9.5 4.5 2.5-4.5 2.5Z" />
    </>
  ),
  effects: (
    <>
      <path d="M10 3.5c.6 3.6 2.4 5.4 6 6-3.6.6-5.4 2.4-6 6-.6-3.6-2.4-5.4-6-6 3.6-.6 5.4-2.4 6-6Z" />
      <path d="M17.5 14.5c.3 1.7 1.2 2.7 3 3-1.8.3-2.7 1.3-3 3-.3-1.7-1.2-2.7-3-3 1.8-.3 2.7-1.3 3-3Z" />
    </>
  ),
  "motion-graphics": (
    <>
      <circle cx="7.5" cy="7.5" r="4" />
      <rect x="13" y="13" width="8" height="8" rx="1.5" />
      <path d="M17 3.5 21 10h-8Z" />
      <path d="m3.5 20.5 6-6" />
    </>
  ),
  "logo-stings": (
    <>
      <circle cx="12" cy="9" r="5.5" />
      <path d="m8.5 13.5-1.5 7 5-2.5 5 2.5-1.5-7" />
    </>
  ),
  "camera-physics": (
    <>
      <rect x="2.5" y="6" width="13" height="12" rx="2.5" />
      <path d="m15.5 10.5 6-3.5v10l-6-3.5" />
    </>
  ),
  "graphic-looks": (
    <>
      <path d="M12 3a9 9 0 1 0 0 18c1.2 0 2-.8 2-1.8 0-1.3-1-1.7-1-2.7 0-1 .8-1.5 1.8-1.5H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3Z" />
      <circle cx="7.5" cy="11" r="1" />
      <circle cx="10" cy="7" r="1" />
      <circle cx="15" cy="7.5" r="1" />
    </>
  ),
  compositions: (
    <>
      <path d="m12 3.5 9 4.5-9 4.5-9-4.5Z" />
      <path d="m3 12 9 4.5 9-4.5M3 16l9 4.5 9-4.5" />
    </>
  ),
  "primitives:components": (
    <>
      <rect x="3.5" y="5" width="17" height="14" rx="3" />
      <path d="M7.5 10h5M7.5 14h9" />
    </>
  ),
  "primitives:blocks": (
    <>
      <rect x="3.5" y="3.5" width="8" height="10" rx="2" />
      <rect x="14.5" y="3.5" width="6" height="6" rx="2" />
      <rect x="14.5" y="12.5" width="6" height="8" rx="2" />
      <rect x="3.5" y="16.5" width="8" height="4" rx="2" />
    </>
  ),
};

export function TabIcon({
  tab,
  className,
  strokeWidth = 1.5,
}: IconProps & { tab: DocsTabId }) {
  return (
    <Icon className={className} strokeWidth={strokeWidth}>
      {TAB_PATHS[tab]}
    </Icon>
  );
}

/** Category icon; unknown folders fall back to their library's icon. */
export function GroupIcon({
  tab,
  group,
  className,
}: IconProps & { tab: DocsTabId; group: string }) {
  const paths =
    GROUP_PATHS[`${tab}:${group}`] ?? GROUP_PATHS[group] ?? TAB_PATHS[tab];
  return <Icon className={className}>{paths}</Icon>;
}

export function ChevronIcon({ className }: IconProps) {
  return (
    <Icon className={className} strokeWidth={2}>
      <path d="m9 6 6 6-6 6" />
    </Icon>
  );
}

export function ArrowUpRightIcon({ className }: IconProps) {
  return (
    <Icon className={className} strokeWidth={2}>
      <path d="M7 17 17 7M8 7h9v9" />
    </Icon>
  );
}

export function ArrowIcon({
  className,
  direction = "right",
}: IconProps & { direction?: "left" | "right" }) {
  return (
    <Icon className={className} strokeWidth={2}>
      {direction === "right" ? (
        <path d="M5 12h14M13 6l6 6-6 6" />
      ) : (
        <path d="M19 12H5M11 6l-6 6 6 6" />
      )}
    </Icon>
  );
}

export function SearchIcon({ className }: IconProps) {
  return (
    <Icon className={className} strokeWidth={2}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </Icon>
  );
}

export function CopyIcon({ className }: IconProps) {
  return (
    <Icon className={className} strokeWidth={1.8}>
      <rect x="8" y="8" width="12" height="12" rx="2.5" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </Icon>
  );
}

export function CheckIcon({ className }: IconProps) {
  return (
    <Icon className={className} strokeWidth={2}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </Icon>
  );
}

export function PencilIcon({ className }: IconProps) {
  return (
    <Icon className={className} strokeWidth={1.8}>
      <path d="M4 20h4L19 9l-4-4L4 16Z" />
      <path d="m13.5 6.5 4 4" />
    </Icon>
  );
}

export function FilterIcon({ className }: IconProps) {
  return (
    <Icon className={className} strokeWidth={2}>
      <path d="M4 6h16M7 12h10M10 18h4" />
    </Icon>
  );
}

export function SidebarIcon({ className }: IconProps) {
  return (
    <Icon className={className} strokeWidth={1.8}>
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <path d="M9 4v16" />
    </Icon>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <Icon className={className} strokeWidth={2}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Icon>
  );
}

export function MarkdownIcon({ className }: IconProps) {
  return (
    <Icon className={className} strokeWidth={1.8}>
      <rect x="2.5" y="5.5" width="19" height="13" rx="2.5" />
      <path d="M6.5 15V9l2.5 3 2.5-3v6M15.5 9v6M13.5 13l2 2 2-2" />
    </Icon>
  );
}
