import { type DocEntry, getComponentEntries, getPage } from "../data";

export type UiEntry = DocEntry & {
  slug: string;
  /** Frontmatter `length`: frames of own motion, or "state-driven". */
  length?: number | string;
};

/**
 * remocn-ui pages under one sub-folder of the Primitives tab
 * ("components" or "blocks"), in sidebar order, with their `length`.
 */
export function getUiEntries(folder: "components" | "blocks"): UiEntry[] {
  const prefix = `/docs/ui/${folder}/`;
  return getComponentEntries("/docs/ui")
    .filter((entry) => entry.url.startsWith(prefix))
    .map((entry) => ({
      ...entry,
      slug: entry.url.slice(prefix.length),
      length: getPage(entry.url)?.data.length,
    }));
}

/** "CheckoutFlow" → "Checkout Flow"; titles that already have spaces pass. */
export function spacedTitle(title: string): string {
  return title.includes(" ")
    ? title
    : title.replace(/([a-z])([A-Z])/g, "$1 $2");
}
