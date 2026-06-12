import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";
import type { SelectItemState } from "@/registry/remocn-ui/select-item";

export const selectItemConfig: ComponentConfig = {
  componentName: "SelectItem",
  importPath: "@/components/remocn/select-item",
  controls: {
    label: { type: "text", default: "Banana", label: "Label" },
    state: {
      type: "select",
      default: "selected",
      options: ["idle", "hover", "press", "selected"],
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
    const state = (values.state as SelectItemState) ?? "selected";
    const label = values.label as string | undefined;
    const mode = values.mode as string | undefined;

    const props: string[] = [`  state="${state}"`];
    if (label !== undefined && label !== "Banana")
      props.push(`  label="${label}"`);
    if (mode !== undefined && mode !== "light")
      props.push(`  mode="${mode}"`);

    return `import { SelectItem } from "@/components/remocn/select-item";

<SelectItem
${props.join("\n")}
/>`;
  },
};
