import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";
import type { SkeletonState } from "@/registry/remocn-ui/skeleton";

export const skeletonConfig: ComponentConfig = {
  componentName: "Skeleton",
  importPath: "@/components/remocn/skeleton",
  controls: {
    layout: {
      type: "select",
      default: "card",
      options: ["lines", "card"],
      label: "Layout",
    },
    state: {
      type: "select",
      default: "loading",
      options: ["loading", "loaded"],
      label: "State",
    },
    mode: {
      type: "select",
      default: "light",
      options: ["light", "dark"],
      label: "Mode",
    },
  },
  durationInFrames: 120,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  snippet: (values) => {
    const state = (values.state as SkeletonState) ?? "loading";
    const layout = values.layout as string | undefined;
    const mode = values.mode as string | undefined;

    const props: string[] = [`  state="${state}"`];
    if (layout !== undefined && layout !== "lines")
      props.push(`  layout="${layout}"`);
    if (mode !== undefined && mode !== "light")
      props.push(`  mode="${mode}"`);

    return `import { Skeleton } from "@/components/remocn/skeleton";

<Skeleton
${props.join("\n")}
>
  {/* your real content */}
</Skeleton>`;
  },
};
