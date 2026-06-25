import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";
import type { CheckboxState } from "@/registry/remocn-ui/checkbox";

export const checkboxConfig: ComponentConfig = {
  componentName: "Checkbox",
  importPath: "@/components/remocn/checkbox",
  controls: {
    label: { type: "text", default: "", label: "Label" },
    size: {
      type: "select",
      default: "default",
      options: ["sm", "default", "lg"],
      label: "Size",
    },
    state: {
      type: "select",
      default: "checked",
      options: ["unchecked", "checked"],
      label: "State",
    },
    primary: { type: "color", default: "#171717", label: "Primary" },
  },
  durationInFrames: 120,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "oklch(1 0 0)" },
  snippet: (values) => {
    const state = (values.state as CheckboxState) ?? "checked";
    const label = values.label as string | undefined;
    const size = values.size as string | undefined;
    const primary = values.primary as string | undefined;

    const props: string[] = [`  state="${state}"`];
    if (label !== undefined && label !== "")
      props.push(`  label="${label}"`);
    if (size !== undefined && size !== "default")
      props.push(`  size="${size}"`);
    if (primary !== undefined && primary !== "#171717")
      props.push(`  primary="${primary}"`);

    return `import { Checkbox } from "@/components/remocn/checkbox";

<Checkbox
${props.join("\n")}
/>`;
  },
};
