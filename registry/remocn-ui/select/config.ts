import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";
import type { SelectState } from "@/registry/remocn-ui/select";

export const selectConfig: ComponentConfig = {
  componentName: "Select",
  importPath: "@/components/remocn/select",
  controls: {
    label: { type: "text", default: "Select a fruit", label: "Label" },
    state: {
      type: "select",
      default: "opened",
      options: ["opened", "closed"],
      label: "State",
    },
    selectedIndex: {
      type: "number",
      default: 1,
      min: -1,
      max: 3,
      step: 1,
      label: "Selected Index",
    },
    highlightedIndex: {
      type: "number",
      default: -1,
      min: -1,
      max: 3,
      step: 1,
      label: "Highlighted Index",
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
    const state = (values.state as SelectState) ?? "opened";
    const label = values.label as string | undefined;
    const selectedIndex = values.selectedIndex as number | undefined;
    const highlightedIndex = values.highlightedIndex as number | undefined;
    const mode = values.mode as string | undefined;

    const props: string[] = [`  state="${state}"`];
    if (label !== undefined && label !== "Select a fruit")
      props.push(`  label="${label}"`);
    if (selectedIndex !== undefined && selectedIndex !== -1)
      props.push(`  selectedIndex={${selectedIndex}}`);
    if (highlightedIndex !== undefined && highlightedIndex !== -1)
      props.push(`  highlightedIndex={${highlightedIndex}}`);
    if (mode !== undefined && mode !== "light")
      props.push(`  mode="${mode}"`);

    return `import { Select } from "@/components/remocn/select";

<Select
${props.join("\n")}
/>`;
  },
};
