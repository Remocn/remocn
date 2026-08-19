import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";
import type { SkeletonState } from "@/registry/remocn-ui/skeleton";

export const skeletonConfig: ComponentConfig = {
  componentName: "Skeleton",
  importPath: "@/components/remocn/skeleton",
  controls: {
    layout: {
      type: "enum",
      default: "card",
      variants: {
        lines: {},
        card: {},
      },
      description: "Layout",
    },
    state: {
      type: "enum",
      default: "loading",
      variants: {
        loading: {},
        loaded: {},
      },
      description: "State",
    },
  },
  durationInFrames: 120,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "oklch(1 0 0)" },
  snippet: (values) => {
    const state = (values.state as SkeletonState) ?? "loading";
    const layout = values.layout as string | undefined;

    const props: string[] = [`  state="${state}"`];
    if (layout !== undefined && layout !== "lines")
      props.push(`  layout="${layout}"`);

    return `import { Skeleton } from "@/components/remocn/skeleton";

<Skeleton
${props.join("\n")}
>
  {/* your real content */}
</Skeleton>`;
  },
};
