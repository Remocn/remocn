import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";
import type { TooltipState } from "@/registry/remocn-ui/tooltip";

const DEFAULT_LABEL = "Add to library";

export const tooltipConfig: ComponentConfig = {
  componentName: "Tooltip",
  importPath: "@/components/remocn/tooltip",
  controls: {
    label: {
      type: "text-content",
      default: "Add to library",
      description: "Label",
    },
    side: {
      type: "enum",
      default: "top",
      variants: {
        top: {},
        bottom: {},
        left: {},
        right: {},
      },
      description: "Side",
    },
    state: {
      type: "enum",
      default: "visible",
      variants: {
        hidden: {},
        visible: {},
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
    const state = (values.state as TooltipState) ?? "visible";
    const label = values.label as string | undefined;
    const side = values.side as string | undefined;

    const props: string[] = [
      `  state="${state}"`,
      `  label="${label ?? DEFAULT_LABEL}"`,
    ];
    if (side !== undefined && side !== "top") props.push(`  side="${side}"`);

    return `import { Tooltip } from "@/components/remocn/tooltip";

<Tooltip
${props.join("\n")}
/>`;
  },
};
