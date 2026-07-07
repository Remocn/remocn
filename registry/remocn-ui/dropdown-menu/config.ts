import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";
import type { DropdownMenuState } from "@/registry/remocn-ui/dropdown-menu";

export const dropdownMenuConfig: ComponentConfig = {
  componentName: "DropdownMenu",
  importPath: "@/components/remocn/dropdown-menu",
  controls: {
    label: { type: "text", default: "Options", label: "Label" },
    state: {
      type: "select",
      default: "opened",
      options: ["opened", "closed"],
      label: "State",
    },
    highlightedIndex: {
      type: "number",
      default: 0,
      min: -1,
      max: 3,
      step: 1,
      label: "Highlighted Index",
    },
  },
  durationInFrames: 120,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "oklch(1 0 0)" },
  snippet: (values) => {
    const state = (values.state as DropdownMenuState) ?? "opened";
    const label = values.label as string | undefined;
    const highlightedIndex = values.highlightedIndex as number | undefined;

    const props: string[] = [`  state="${state}"`];
    if (label !== undefined && label !== "Options")
      props.push(`  label="${label}"`);
    if (highlightedIndex !== undefined && highlightedIndex !== -1)
      props.push(`  highlightedIndex={${highlightedIndex}}`);

    return `import { DropdownMenu } from "@/components/remocn/dropdown-menu";

<DropdownMenu
${props.join("\n")}
/>`;
  },
};
