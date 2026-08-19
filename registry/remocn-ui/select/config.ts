import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";
import type { SelectState } from "@/registry/remocn-ui/select";

export const selectConfig: ComponentConfig = {
  componentName: "Select",
  importPath: "@/components/remocn/select",
  controls: {
    label: {
      type: "text-content",
      default: "Select a fruit",
      description: "Label",
    },
    state: {
      type: "enum",
      default: "opened",
      variants: {
        opened: {},
        closed: {},
      },
      description: "State",
    },
    selectedIndex: {
      type: "number",
      min: -1,
      max: 3,
      step: 1,
      default: 1,
      description: "Selected Index",
      hiddenFromList: false,
    },
    highlightedIndex: {
      type: "number",
      min: -1,
      max: 3,
      step: 1,
      default: -1,
      description: "Highlighted Index",
      hiddenFromList: false,
    },
  },
  durationInFrames: 120,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "oklch(1 0 0)" },
  snippet: (values) => {
    const state = (values.state as SelectState) ?? "opened";
    const label = values.label as string | undefined;
    const selectedIndex = values.selectedIndex as number | undefined;
    const highlightedIndex = values.highlightedIndex as number | undefined;

    const props: string[] = [`  state="${state}"`];
    if (label !== undefined && label !== "Select a fruit")
      props.push(`  label="${label}"`);
    if (selectedIndex !== undefined && selectedIndex !== -1)
      props.push(`  selectedIndex={${selectedIndex}}`);
    if (highlightedIndex !== undefined && highlightedIndex !== -1)
      props.push(`  highlightedIndex={${highlightedIndex}}`);

    return `import { Select } from "@/components/remocn/select";

<Select
${props.join("\n")}
/>`;
  },
};
