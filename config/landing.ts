// Pastel accent palette — peach / lavender / mint.
// Used sparingly as low-opacity decorative glows; the base system is neutral.
export const PEACH = "#FFB38E";
export const LAVENDER = "#D4B3FF";
export const MINT = "#A1EEBD";

// Page width wrapper. Implemented as the scoped `.page-shell .container`
// CSS class (see app/globals.css) so it stays a single source of truth.
export const SECTION = "container";

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

export const STACK = [
  "Remotion",
  "React",
  "Next.js",
  "Tailwind",
  "TypeScript",
  "shadcn/ui",
  "Vercel",
] as const;

export type NavLink = {
  href: string;
  label: string;
  /** Hidden on mobile (matches the existing `hidden sm:inline` pattern). */
  smOnly?: boolean;
};

export const HOME_NAV: NavLink[] = [
  { href: "#components", label: "Components", smOnly: true },
  { href: "#showcase", label: "Showcase", smOnly: true },
  { href: "#get-started", label: "Get started", smOnly: true },
  { href: "/sponsors", label: "Sponsors", smOnly: true },
  { href: "/docs/getting-started/introduction", label: "Docs" },
];

export const SPONSORS_NAV: NavLink[] = [
  { href: "/#showcase", label: "Showcase", smOnly: true },
  { href: "/#components", label: "Components", smOnly: true },
  { href: "/sponsors", label: "Sponsors", smOnly: true },
  { href: "/docs/getting-started/introduction", label: "Docs" },
];

export const FOOTER_NAV: NavLink[] = [
  { href: "/docs/getting-started/introduction", label: "Docs" },
  { href: GITHUB_URL, label: "GitHub" },
  { href: "/sponsors", label: "Sponsors" },
];
