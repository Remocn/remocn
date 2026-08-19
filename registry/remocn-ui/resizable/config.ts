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
      min: 0,
      max: 1,
      step: 0.05,
      default: 0.5,
      description: "Ratio",
      hiddenFromList: false,
    },
    handleState: {
      type: "enum",
      default: "idle",
      variants: {
        idle: {},
        hover: {},
        press: {},
      },
      description: "Handle State",
    },
    direction: {
      type: "enum",
      default: "horizontal",
      variants: {
        horizontal: {},
        vertical: {},
      },
      description: "Direction",
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
