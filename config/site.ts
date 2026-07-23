import remocnRegistry from "@/registry/remocn/registry.json";
import remocnUiRegistry from "@/registry/remocn-ui/registry.json";

// Pastel accent palette — peach / lavender / mint.
// Used sparingly as low-opacity decorative glows; the base system is neutral.
export const PEACH = "#FFB38E";
export const LAVENDER = "#D4B3FF";
export const MINT = "#A1EEBD";

export const GITHUB_URL = "https://github.com/Remocn/remocn";

/** Canonical example install command shown on the landing page. */
export const INSTALL_COMMAND = "npx shadcn@latest add remocn/soft-blur-in";

export const INSTALL_ALL_NAMES: string[] = [
  ...remocnRegistry.items,
  ...remocnUiRegistry.items,
].map((item) => item.name);

export const INSTALL_ALL_COMMAND = `npx shadcn@latest add ${INSTALL_ALL_NAMES.map(
  (name) => `@remocn/${name}`,
).join(" ")}`;

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
  { href: "/docs/shaders/getting-started/introduction", label: "Shaders" },
  { href: "/docs/icons/gallery", label: "Icons" },
  { href: "/showcases", label: "Showcases" },
  { href: "/blog", label: "Blog" },
  { href: "/sponsors", label: "Sponsors" },
];

/**
 * Docs whose sidebar menu item should carry the animated "NEW" badge. Keyed by
 * the page's docs URL (the Fumadocs page-tree `item.url`). Add a path here to
 * tag another menu item — no component changes needed. See `withNewBadges`.
 */
export const NEW_BADGE_PATHS = new Set<string>([
  "/docs/typography/handwrite",
  "/docs/typography/ink-underline",
  "/docs/effects/paper-wobble",
  "/docs/effects/ink-arrow",
  "/docs/ui-blocks/paper-sticker",
  "/docs/ui-blocks/polaroid",
  "/docs/transitions/page-turn",
  "/docs/ui-blocks/check-list",
  "/docs/effects/scribble-circle",
  "/docs/typography/hand-count",
  "/docs/effects/crumple-toss",
  "/docs/transitions/ascii-dissolve",
  "/docs/transitions/caret-wipe",
  "/docs/transitions/icon-scatter",
  "/docs/shaders/components/shader-caustics",
  "/docs/shaders/components/shader-gem-smoke",
  "/docs/shaders/components/shader-strata",
  "/docs/shaders/components/shader-weave",
  "/docs/ui-blocks/reel",
]);

export const FOOTER_NAV: NavLink[] = [
  { href: "/docs/getting-started/introduction", label: "Docs" },
  { href: "/changelog", label: "Changelog" },
  { href: "/blog", label: "Blog" },
  { href: "/showcases", label: "Showcases" },
  { href: GITHUB_URL, label: "GitHub" },
  { href: "/sponsors", label: "Sponsors" },
];
