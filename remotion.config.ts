import path from "node:path";
import { Config } from "@remotion/cli/config";

// The Remotion bundler (webpack) doesn't read tsconfig `paths` — mirror the
// alias override from scripts/bundle-remotion.mts so `@/registry/...` resolves
// in Studio too.
Config.overrideWebpackConfig((config) => ({
  ...config,
  resolve: {
    ...config.resolve,
    alias: {
      ...(config.resolve?.alias ?? {}),
      "@/components/remocn/number-wheel$": path.join(
        process.cwd(),
        "registry/remocn/number-wheel/index.tsx",
      ),
      "@/components/remocn/word-push$": path.join(
        process.cwd(),
        "registry/remocn/word-push/index.tsx",
      ),
      "@/components/remocn/radial-burst$": path.join(
        process.cwd(),
        "registry/remocn/radial-burst/index.tsx",
      ),
      "@": process.cwd(),
    },
  },
}));

Config.setEntryPoint("src/remotion/index.ts");
