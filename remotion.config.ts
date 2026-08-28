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
        __dirname,
        "registry/remocn/number-wheel/index.tsx",
      ),
      "@": __dirname,
    },
  },
}));

Config.setEntryPoint("src/remotion/index.ts");
