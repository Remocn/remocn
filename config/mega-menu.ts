import shadersMeta from "@/content/docs/shaders/components/meta.json";
import remocnIconsRegistry from "@/registry/remocn-icons/registry.json";

export type MegaMenuItem = {
  label: string;
  href: string;
  /** Ключ из registry/__index__, который играет в preview-панели при ховере строки. */
  preview: string;
};

export type MegaMenuSection = {
  /** href пункта NAV_LINKS, к которому привязана секция. */
  href: string;
  /** Ширина колонки списка в px; панель анимирует ширину между секциями. */
  listWidth: number;
  items: MegaMenuItem[];
};

const humanize = (slug: string) =>
  slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const COMPONENT_CATEGORIES: MegaMenuItem[] = [
  { label: "Typography", href: "/docs/typography", preview: "soft-blur-in" },
  { label: "Layout", href: "/docs/layout", preview: "drift" },
  { label: "UI", href: "/docs/ui", preview: "accordion" },
  {
    label: "Transitions",
    href: "/docs/transitions",
    preview: "grain-dissolve",
  },
  { label: "Effects", href: "/docs/effects", preview: "tv-power-off" },
  {
    label: "Motion Graphics",
    href: "/docs/motion-graphics",
    preview: "bauhaus-build",
  },
  {
    label: "Filters",
    href: "/docs/filters/getting-started/introduction",
    preview: "camera-lens",
  },
];

const SHADER_ITEMS: MegaMenuItem[] = shadersMeta.pages.map((slug) => ({
  label: humanize(slug.replace(/^shader-/, "")),
  href: `/docs/shaders/components/${slug}`,
  preview: slug,
}));

/**
 * Курируемая выборка: весь каталог (100 иконок) в меню без скролла не влезает,
 * а каждая строка всё равно ведёт в галерею.
 */
const FEATURED_ICONS = [
  "icon-check",
  "icon-x",
  "icon-heart",
  "icon-star",
  "icon-search",
  "icon-bell",
  "icon-download",
  "icon-copy",
  "icon-trash",
  "icon-plus",
  "icon-send",
  "icon-loader",
  "icon-play",
  "icon-settings",
  "icon-thumbs-up",
  "icon-party-popper",
  "icon-arrow-right",
  "icon-refresh-cw",
];

const ICON_ITEMS: MegaMenuItem[] = FEATURED_ICONS.flatMap((name) => {
  const item = remocnIconsRegistry.items.find((entry) => entry.name === name);
  if (!item) return [];
  return {
    label: item.title,
    href: "/docs/icons/gallery",
    preview: item.name,
  };
});

export const MEGA_MENU_SECTIONS: MegaMenuSection[] = [
  { href: "/docs/typography", listWidth: 176, items: COMPONENT_CATEGORIES },
  {
    href: "/docs/shaders/getting-started/introduction",
    listWidth: 552,
    items: SHADER_ITEMS,
  },
  { href: "/docs/icons/gallery", listWidth: 496, items: ICON_ITEMS },
];
