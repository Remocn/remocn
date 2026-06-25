/**
 * Download Remotion's Chrome Headless Shell ahead of time so the first render
 * doesn't pay for it at runtime. Uses @remotion/renderer's `ensureBrowser()`
 * directly — the `remotion` package has NO CLI binary (that's `@remotion/cli`,
 * which we don't install), so `bunx remotion browser ensure` does not work here.
 *
 * Run: `bun run remotion:browser` (baked into the Docker / Coolify build).
 */
import { ensureBrowser } from "@remotion/renderer";

await ensureBrowser();
console.log("Remotion browser (Chrome Headless Shell) ensured.");
