import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";
import type { PopoverState } from "@/registry/remocn-ui/popover";

const _DEFAULT_TITLE = "Dimensions";
const _DEFAULT_DESCRIPTION = "Set the dimensions for the layer.";

export const popoverConfig: ComponentConfig = {
  componentName: "Popover",
  importPath: "@/components/remocn/popover",
  controls: {
    title: {
      type: "text-content",
      default: "Dimensions",
      description: "Title",
    },
    description: {
      type: "text-content",
      default: "Set the dimensions for the layer.",
      description: "Description",
    },
    side: {
      type: "enum",
      default: "bottom",
      variants: {
        top: {},
        bottom: {},
        left: {},
        right: {},
      },
      description: "Side",
    },
    width: {
      type: "number",
      min: 160,
      max: 480,
      step: 8,
      default: 288,
      description: "Width",
      hiddenFromList: false,
    },
    state: {
      type: "enum",
      default: "opened",
      variants: {
        opened: {},
        closed: {},
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
    const state = (values.state as PopoverState) ?? "opened";
    const title = values.title as string | undefined;
    const description = values.description as string | undefined;
    const side = values.side as string | undefined;
    const width = values.width as number | undefined;

    const props: string[] = [`  state="${state}"`];
    if (title !== undefined && title !== "") props.push(`  title="${title}"`);
    if (description !== undefined && description !== "")
      props.push(`  description="${description}"`);
    if (side !== undefined && side !== "bottom") props.push(`  side="${side}"`);
    if (width !== undefined && width !== 288) props.push(`  width={${width}}`);

    return `import { Popover } from "@/components/remocn/popover";

<Popover
${props.join("\n")}
/>`;
  },
};
