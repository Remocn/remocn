import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";
import type { PopoverState } from "@/registry/remocn-ui/popover";

const DEFAULT_TITLE = "Dimensions";
const DEFAULT_DESCRIPTION = "Set the dimensions for the layer.";

export const popoverConfig: ComponentConfig = {
  componentName: "Popover",
  importPath: "@/components/remocn/popover",
  controls: {
    title: { type: "text", default: DEFAULT_TITLE, label: "Title" },
    description: {
      type: "text",
      default: DEFAULT_DESCRIPTION,
      label: "Description",
    },
    side: {
      type: "select",
      default: "bottom",
      options: ["top", "bottom", "left", "right"],
      label: "Side",
    },
    width: {
      type: "number",
      default: 288,
      min: 160,
      max: 480,
      step: 8,
      label: "Width",
    },
    state: {
      type: "select",
      default: "opened",
      options: ["opened", "closed"],
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
    const state = (values.state as PopoverState) ?? "opened";
    const title = values.title as string | undefined;
    const description = values.description as string | undefined;
    const side = values.side as string | undefined;
    const width = values.width as number | undefined;
    const mode = values.mode as string | undefined;

    const props: string[] = [`  state="${state}"`];
    if (title !== undefined && title !== "")
      props.push(`  title="${title}"`);
    if (description !== undefined && description !== "")
      props.push(`  description="${description}"`);
    if (side !== undefined && side !== "bottom")
      props.push(`  side="${side}"`);
    if (width !== undefined && width !== 288)
      props.push(`  width={${width}}`);
    if (mode !== undefined && mode !== "light")
      props.push(`  mode="${mode}"`);

    return `import { Popover } from "@/components/remocn/popover";

<Popover
${props.join("\n")}
/>`;
  },
};
