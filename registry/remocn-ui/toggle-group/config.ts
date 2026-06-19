import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";
import type { ToggleGroupState } from "@/registry/remocn-ui/toggle-group";

export const toggleGroupConfig: ComponentConfig = {
  componentName: "ToggleGroup",
  importPath: "@/components/remocn/toggle-group",
  controls: {
    state: {
      type: "select",
      default: "Monthly",
      options: ["Monthly", "Yearly"],
      label: "State",
    },
    size: {
      type: "select",
      default: "default",
      options: ["default", "sm"],
      label: "Size",
    },
  },
  durationInFrames: 120,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "oklch(1 0 0)" },
  snippet: (values) => {
    const state = (values.state as ToggleGroupState) ?? "Monthly";
    const size = values.size as string | undefined;

    const props: string[] = [`  state="${state}"`];
    if (size !== undefined && size !== "default")
      props.push(`  size="${size}"`);

    return `import { ToggleGroup } from "@/components/remocn/toggle-group";

<ToggleGroup
${props.join("\n")}
  items={[
    { value: "Monthly", label: "Monthly" },
    { value: "Yearly", label: "Yearly" },
  ]}
/>`;
  },
};
