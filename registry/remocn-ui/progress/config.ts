import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const progressConfig: ComponentConfig = {
  componentName: "Progress",
  importPath: "@/components/remocn/progress",
  controls: {
    value: { type: "number", default: 62, min: 0, max: 100, step: 1, label: "Value" },
    width: {
      type: "number",
      default: 320,
      min: 120,
      max: 640,
      step: 20,
      label: "Width",
    },
    showLabel: { type: "boolean", default: true, label: "Show Label" },
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
    const value = values.value as number | undefined;
    const width = values.width as number | undefined;
    const showLabel = values.showLabel as boolean | undefined;
    const mode = values.mode as string | undefined;

    const props: string[] = [`  value={${value ?? 0}}`];
    if (width !== undefined && width !== 320) props.push(`  width={${width}}`);
    if (showLabel) props.push(`  showLabel`);
    if (mode !== undefined && mode !== "light") props.push(`  mode="${mode}"`);

    return `import { Progress } from "@/components/remocn/progress";

<Progress
${props.join("\n")}
/>`;
  },
};
