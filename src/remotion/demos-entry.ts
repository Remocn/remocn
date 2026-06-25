// Bundler entry for the demos render script (scripts/render-demos.mts).
// Importing the root runs `registerRoot(DemosRoot)`. Kept separate from
// index.ts so the github-stars server bundle and the demos bundle don't collide
// (a bundle registers exactly one root). Side-effect-only by design.
import "./demos-root";
