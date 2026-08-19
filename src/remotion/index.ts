// Bundler entry point. Importing Root runs `registerRoot(RemotionRoot)`, which
// is what `@remotion/bundler` (and the Remotion CLI) look for. Keep this file
// side-effect-only so the entry stays a stable, single source of truth.
import "./Root";
