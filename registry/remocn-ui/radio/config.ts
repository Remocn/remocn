import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";
import type { RadioState } from "@/registry/remocn-ui/radio";

export const radioConfig: ComponentConfig = {
  componentName: "Radio",
  importPath: "@/components/remocn/radio",
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
    mode: {
      type: "select",
      default: "light",
      options: ["light", "dark"],
      label: "Mode",
    },
    primary: { type: "color", default: "#171717", label: "Primary" },
  },
  durationInFrames: 120,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  snippet: (values) => {
    const state = (values.state as RadioState) ?? "checked";
    const label = values.label as string | undefined;
    const size = values.size as string | undefined;
    const mode = values.mode as string | undefined;
    const primary = values.primary as string | undefined;

    const props: string[] = [`  state="${state}"`];
    if (label !== undefined && label !== "")
      props.push(`  label="${label}"`);
    if (size !== undefined && size !== "default")
      props.push(`  size="${size}"`);
    if (mode !== undefined && mode !== "light")
      props.push(`  mode="${mode}"`);
    if (primary !== undefined && primary !== "#171717")
      props.push(`  primary="${primary}"`);

    return `import { Radio } from "@/components/remocn/radio";

<Radio
${props.join("\n")}
/>`;
  },
};
