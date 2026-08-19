import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";
import type { SliderThumbState } from "@/registry/remocn-ui/slider";

export const sliderConfig: ComponentConfig = {
  componentName: "Slider",
  importPath: "@/components/remocn/slider",
  controls: {
    value: {
      type: "number",
      min: 0,
      max: 100,
      step: 1,
      default: 40,
      description: "Value",
      hiddenFromList: false,
    },
    thumbState: {
      type: "enum",
      default: "idle",
      variants: {
        idle: {},
        hover: {},
        press: {},
      },
      description: "Thumb State",
    },
    width: {
      type: "number",
      min: 120,
      max: 640,
      step: 20,
      default: 320,
      description: "Width",
      hiddenFromList: false,
    },
    showValue: {
      type: "boolean",
      default: true,
      description: "Show Value",
    },
  },
  durationInFrames: 120,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "oklch(1 0 0)" },
  snippet: (values) => {
    const value = values.value as number | undefined;
    const thumbState = values.thumbState as SliderThumbState | undefined;
    const width = values.width as number | undefined;
    const showValue = values.showValue as boolean | undefined;

    const props: string[] = [`  value={${value ?? 0}}`];
    if (thumbState !== undefined && thumbState !== "idle")
      props.push(`  thumbState="${thumbState}"`);
    if (width !== undefined && width !== 320) props.push(`  width={${width}}`);
    if (showValue) props.push(`  showValue`);

    return `import { Slider } from "@/components/remocn/slider";

<Slider
${props.join("\n")}
/>`;
  },
};
