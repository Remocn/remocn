import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";
import type {
  ResizableDirection,
  ResizableHandleState,
} from "@/registry/remocn-ui/resizable";

export const resizableConfig: ComponentConfig = {
  componentName: "Resizable",
  importPath: "@/components/remocn/resizable",
  controls: {
    ratio: {
      type: "number",
      default: 0.5,
      min: 0,
      max: 1,
      step: 0.05,
      label: "Ratio",
    },
    handleState: {
      type: "select",
      default: "idle",
      options: ["idle", "hover", "press"],
      label: "Handle State",
    },
    direction: {
      type: "select",
      default: "horizontal",
      options: ["horizontal", "vertical"],
      label: "Direction",
    },
  },
  durationInFrames: 120,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "oklch(1 0 0)" },
  snippet: (values) => {
    const ratio = values.ratio as number | undefined;
    const handleState = values.handleState as ResizableHandleState | undefined;
    const direction = values.direction as ResizableDirection | undefined;

    const props: string[] = [`  ratio={${ratio ?? 0.5}}`];
    if (handleState !== undefined && handleState !== "idle")
      props.push(`  handleState="${handleState}"`);
    if (direction !== undefined && direction !== "horizontal")
      props.push(`  direction="${direction}"`);

    return `import { Resizable } from "@/components/remocn/resizable";

<Resizable
${props.join("\n")}
/>`;
  },
};
