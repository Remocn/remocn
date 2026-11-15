/**
 * Modules the preview bundle takes from the page instead of bundling its own
 * copy. A second React or Remotion would not see the contexts of the Player
 * that renders the preview.
 *
 * scripts/previews/build.mts leaves every import of `react`, `react-dom` and
 * `remotion` (and their subpaths) out of the bundle and fails when the
 * previews import a subpath missing here. lib/previews/shared.ts hands the
 * listed modules over at runtime.
 */
export const SHARED_MODULES = [
  "react",
  "react-dom",
  "react/jsx-runtime",
  "react/jsx-dev-runtime",
  "remotion",
  "remotion/no-react",
] as const;

export type SharedModule = (typeof SHARED_MODULES)[number];

/** The global the page fills and the preview bundle reads. */
export const SHARED_GLOBAL = "__remocnShared";
