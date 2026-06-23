// Pastel accent palette — peach / lavender / mint.
// Used sparingly as low-opacity decorative glows; the base system is neutral.
export const PEACH = "#FFB38E";
export const LAVENDER = "#D4B3FF";
export const MINT = "#A1EEBD";

export const GITHUB_URL = "https://github.com/kapishdima/remocn";

/** Canonical example install command shown on the landing page. */
export const INSTALL_COMMAND = "npx shadcn@latest add remocn/soft-blur-in";

export const SPRING_BOUNCE = {
  type: "spring" as const,
  stiffness: 120,
  damping: 14,
};
export const SPRING_SOFT = {
  type: "spring" as const,
  stiffness: 180,
  damping: 22,
};

export type NavLink = {
  href: string;
  label: string;
  /** Hidden on mobile (matches the existing `hidden sm:inline` pattern). */
  smOnly?: boolean;
};

// Единый источник топ-навигации для landing / sponsors / docs.
export const NAV_LINKS: NavLink[] = [
  { href: "/docs/typography", label: "Components" },
  { href: "/sponsors", label: "Sponsors" },
  { href: "/docs/getting-started/introduction", label: "Docs" },
];

/**
 * Docs whose sidebar menu item should carry the animated "NEW" badge. Keyed by
 * the page's docs URL (the Fumadocs page-tree `item.url`). Add a path here to
 * tag another menu item — no component changes needed. See `withNewBadges`.
 */
export const NEW_BADGE_PATHS = new Set<string>([
  "/docs/typography/number-wheel",
  "/docs/typography/rolling-number",
  "/docs/typography/soft-blur-in",
  "/docs/typography/per-character-rise",
  "/docs/typography/bottom-up-letters",
  "/docs/typography/top-down-letters",
  "/docs/typography/spring-scale-in",
  "/docs/typography/micro-scale-fade",
  "/docs/typography/scale-down-fade",
  "/docs/typography/blur-out-up",
  "/docs/typography/focus-blur-resolve",
  "/docs/typography/line-by-line-slide",
  "/docs/typography/mask-reveal-up",
  "/docs/typography/per-word-crossfade",
  "/docs/typography/fade-through",
  "/docs/typography/shared-axis-y",
  "/docs/typography/shared-axis-z",
  "/docs/typography/short-slide-right",
  "/docs/typography/kinetic-center-build",
  "/docs/typography/short-slide-down",
]);

export const FOOTER_NAV: NavLink[] = [
  { href: "/docs/getting-started/introduction", label: "Docs" },
  { href: GITHUB_URL, label: "GitHub" },
  { href: "/sponsors", label: "Sponsors" },
];
