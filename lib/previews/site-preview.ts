import {
  type PreviewManifestEntry,
  previewManifest,
} from "@/registry/__manifest__";
import { atPreviewRate } from "./frame-rate";

// One object per preview, so an entry can sit in a dependency list.
const cache = new Map<string, PreviewManifestEntry>();

/**
 * A preview's manifest entry at the frame rate the site plays it at. The
 * manifest itself keeps each config's own numbers.
 */
export function sitePreview(name: string): PreviewManifestEntry | undefined {
  // A name can come from a URL: `constructor` must not resolve to a member
  // of `Object.prototype`.
  if (!Object.hasOwn(previewManifest, name)) return undefined;
  const own = previewManifest[name];
  let entry = cache.get(name);
  if (!entry) {
    entry = atPreviewRate(own);
    cache.set(name, entry);
  }
  return entry;
}
