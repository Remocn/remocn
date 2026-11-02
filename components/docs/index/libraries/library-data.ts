import { getComponentEntries, getPage } from "../data";

/** One tile of a library gallery: a component page and its vibe. */
export type LibraryItem = {
  /** Registry name, also the key into `registry/__index__` and the manifest. */
  slug: string;
  title: string;
  url: string;
  vibe?: string;
};

/**
 * Component pages of a library tab (shaders, filters, captions) in sidebar
 * order, each with the `vibe` its page declares in frontmatter.
 */
export function getLibraryItems(prefix: string): LibraryItem[] {
  return getComponentEntries(prefix).flatMap((entry) =>
    entry.component
      ? [
          {
            slug: entry.component,
            title: entry.title,
            url: entry.url,
            vibe: getPage(entry.url)?.data.vibe,
          },
        ]
      : [],
  );
}
