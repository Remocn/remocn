import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

const DEFAULT_STEPS = ["Account", "Plan", "Done"];

export const stepperConfig: ComponentConfig = {
  componentName: "Stepper",
  importPath: "@/components/remocn/stepper",
  controls: {
    activeIndex: {
      type: "number",
      default: 1,
      min: 0,
      max: 2,
      step: 1,
      label: "Active Index",
    },
  },
  durationInFrames: 120,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "oklch(1 0 0)" },
  snippet: (values) => {
    const activeIndex = values.activeIndex as number | undefined;

    const props: string[] = [`  activeIndex={${activeIndex ?? 0}}`];

    const stepsLiteral = JSON.stringify(DEFAULT_STEPS);
    return `import { Stepper } from "@/components/remocn/stepper";

<Stepper
  steps={${stepsLiteral}}
${props.join("\n")}
/>`;
  },
};
