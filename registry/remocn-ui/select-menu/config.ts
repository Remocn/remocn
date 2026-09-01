import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

const DEFAULT_OPTIONS = ["New Game", "Continue", "Settings", "Quit"];

export const selectMenuConfig: ComponentConfig = {
  componentName: "SelectMenu",
  importPath: "@/components/remocn/select-menu",
  controls: {
    selectedIndex: {
      type: "number",
      min: 0,
      max: 3,
      step: 1,
      default: 1,
      // description:
      //   "Selected index (0–3 is the demo's 4 options; the component accepts any number)",
      hiddenFromList: false,
    },
    variant: {
      type: "enum",
      default: "soft",
      variants: {
        soft: {},
        solid: {},
      },
      description: "Variant",
    },
  },
  dimensions: { width: 300, height: 202 },
  durationInFrames: 128,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "oklch(1 0 0)" },
  snippet: (values) => {
    const selectedIndex = values.selectedIndex as number | undefined;
    const variant = values.variant as string | undefined;

    const props: string[] = [`  selectedIndex={${selectedIndex ?? 1}}`];
    if (variant !== undefined && variant !== "soft")
      props.push(`  variant="${variant}"`);

    return `import { SelectMenu } from "@/components/remocn/select-menu";

<SelectMenu
  options={${JSON.stringify(DEFAULT_OPTIONS)}}
${props.join("\n")}
/>`;
  },
};
