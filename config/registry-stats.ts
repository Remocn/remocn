import newDocs from "@/config/new-docs.json";
import remocnRegistry from "@/registry/remocn/registry.json";
import remocnIconsRegistry from "@/registry/remocn-icons/registry.json";
import remocnUiRegistry from "@/registry/remocn-ui/registry.json";

/**
 * Facts derived from the registry manifests. Kept apart from `config/site.ts`,
 * which client components import for URLs and nav links: anything imported
 * here ships the registry JSON with it, so only server code should use it.
 */

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

/**
 * Docs whose sidebar menu item should carry the animated "NEW" badge. Keyed by
 * the page's docs URL (the Fumadocs page-tree `item.url`). The list lives in
 * `config/new-docs.json`: add or remove a path there to tag a menu item.
 */
export const NEW_BADGE_PATHS = new Set<string>(newDocs);
