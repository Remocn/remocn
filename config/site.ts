import type { CtaId } from "@/lib/analytics";
import remocnRegistry from "@/registry/remocn/registry.json";
import remocnIconsRegistry from "@/registry/remocn-icons/registry.json";
import remocnUiRegistry from "@/registry/remocn-ui/registry.json";

// Pastel accent palette — peach / lavender / mint.
// Used sparingly as low-opacity decorative glows; the base system is neutral.
export const PEACH = "#FFB38E";
export const LAVENDER = "#D4B3FF";
export const MINT = "#A1EEBD";

export const GITHUB_URL = "https://github.com/Remocn/remocn";

export const X_URL = "https://x.com/_remocn";

export const THREADS_URL = "https://www.threads.com/@_remocn";

export const STUDIO_URL = "https://remocn.studio";

export const SUPPORT_EMAIL = "kapish@remocn.dev";

export const INSTALL_ALL_NAMES: string[] = [
  ...remocnRegistry.items,
  ...remocnUiRegistry.items,
].map((item) => item.name);

export const INSTALL_ALL_COMMAND = `npx shadcn@latest add ${INSTALL_ALL_NAMES.map(
  (name) => `@remocn/${name}`,
).join(" ")}`;

export const COMPONENT_COUNT =
  remocnRegistry.items.length +
  remocnUiRegistry.items.length +
  remocnIconsRegistry.items.length;

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
  external?: boolean;
};

export function externalLinkProps(link: NavLink, cta: CtaId) {
  if (!link.external) return {};
  return {
    target: "_blank",
    rel: "noreferrer",
    "data-track": "cta_clicked",
    "data-cta": cta,
    "data-destination": link.href,
  };
}

// Единый источник топ-навигации для landing / sponsors / docs.
export const NAV_LINKS: NavLink[] = [
  { href: "/docs/typography", label: "Components" },
  { href: "/docs/shaders/getting-started/introduction", label: "Shaders" },
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
  "/docs/transitions/iris-wipe",
  "/docs/transitions/venetian-blinds",
  "/docs/transitions/paper-tear",
  "/docs/transitions/pixel-sort",
  "/docs/transitions/light-leak",
  "/docs/transitions/hyperspace",
  "/docs/logo-stings/orbit-lock",
  "/docs/logo-stings/puzzle-snap",
  "/docs/logo-stings/spotlight",
  "/docs/logo-stings/neon-sign",
  "/docs/logo-stings/inflate",
  "/docs/logo-stings/liquid-fill",
  "/docs/logo-stings/accordion-unfold",
  "/docs/logo-stings/anamorphic-flare",
  "/docs/motion-graphics/pendulum-wave",
  "/docs/motion-graphics/flow-field",
  "/docs/motion-graphics/isometric-build",
  "/docs/motion-graphics/life-grid",
  "/docs/motion-graphics/string-art",
  "/docs/motion-graphics/topo-lines",
  "/docs/motion-graphics/phyllotaxis",
  "/docs/camera/parallax-depth",
  "/docs/camera/dolly-zoom",
  "/docs/camera/turntable",
  "/docs/camera/tiny-planet",
  "/docs/camera/exploded-view",
  "/docs/camera/gravity-pile",
  "/docs/camera/cloth-reveal",
  "/docs/camera/impact-shake",
  "/docs/graphic-looks/riso-print",
  "/docs/graphic-looks/line-boil",
  "/docs/graphic-looks/blueprint",
  "/docs/graphic-looks/duotone-beat",
  "/docs/graphic-looks/comic-panels",
  "/docs/graphic-looks/long-shadow",
  "/docs/graphic-looks/synthwave",
  "/docs/graphic-looks/brick-mosaic",
  "/docs/graphic-looks/x-ray-scan",
]);

export type FooterGroup = {
  label: string;
  links: NavLink[];
};

export const FOOTER_GROUPS: FooterGroup[] = [
  {
    label: "Registry",
    links: [
      { href: "/docs/typography", label: "Components" },
      { href: "/docs/shaders/getting-started/introduction", label: "Shaders" },
      { href: "/docs/icons/gallery", label: "Icons" },
    ],
  },
  {
    label: "Learn",
    links: [
      { href: "/docs/getting-started/introduction", label: "Docs" },
      { href: "/blog", label: "Blog" },
      { href: "/changelog", label: "Changelog" },
    ],
  },
  {
    label: "Project",
    links: [
      { href: STUDIO_URL, label: "Studio", external: true },
      { href: "/showcases", label: "Showcases" },
      { href: "/sponsors", label: "Sponsors" },
      { href: "/legal", label: "Privacy & Terms" },
    ],
  },
];
