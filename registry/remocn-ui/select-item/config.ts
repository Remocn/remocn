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
  },
  durationInFrames: 120,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "oklch(1 0 0)" },
  snippet: (values) => {
    const state = (values.state as SelectItemState) ?? "selected";
    const label = values.label as string | undefined;

    const props: string[] = [`  state="${state}"`];
    if (label !== undefined && label !== "Banana")
      props.push(`  label="${label}"`);

    return `import { SelectItem } from "@/components/remocn/select-item";

<SelectItem
${props.join("\n")}
/>`;
  },
};
