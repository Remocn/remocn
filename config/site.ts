// Pastel accent palette — peach / lavender / mint.
// Used sparingly as low-opacity decorative glows; the base system is neutral.
export const PEACH = "#FFB38E";
export const LAVENDER = "#D4B3FF";
export const MINT = "#A1EEBD";

export const GITHUB_URL = "https://github.com/kapishdima/remocn";

/** Canonical example install command shown on the landing page. */
export const INSTALL_COMMAND = "npx shadcn@latest add remocn/blur-reveal";

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

export const FOOTER_NAV: NavLink[] = [
  { href: "/docs/getting-started/introduction", label: "Docs" },
  { href: GITHUB_URL, label: "GitHub" },
  { href: "/sponsors", label: "Sponsors" },
];
