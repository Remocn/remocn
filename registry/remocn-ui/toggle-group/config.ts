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
    const state = (values.state as ToggleGroupState) ?? "Monthly";
    const size = values.size as string | undefined;
    const mode = values.mode as string | undefined;

    const props: string[] = [`  state="${state}"`];
    if (size !== undefined && size !== "default")
      props.push(`  size="${size}"`);
    if (mode !== undefined && mode !== "light")
      props.push(`  mode="${mode}"`);

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
