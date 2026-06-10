import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";
import type { ComboboxState } from "@/registry/remocn-ui/combobox";

const DEFAULT_QUERY = "";
const DEFAULT_PLACEHOLDER = "Select a fruit…";

export const comboboxConfig: ComponentConfig = {
  componentName: "Combobox",
  importPath: "@/components/remocn/combobox",
  controls: {
    state: {
      type: "select",
      // Default to `opened` so the preview shows the revealed panel.
      default: "opened",
      options: ["opened", "closed"],
      label: "State",
    },
    query: { type: "text", default: DEFAULT_QUERY, label: "Query" },
    revealCount: {
      type: "number",
      default: 0,
      min: 0,
      max: 20,
      step: 1,
      label: "Reveal Count",
    },
    placeholder: {
      type: "text",
      default: DEFAULT_PLACEHOLDER,
      label: "Placeholder",
    },
    selectedIndex: {
      type: "number",
      default: -1,
      min: -1,
      max: 5,
      step: 1,
      label: "Selected Index",
    },
    highlightedIndex: {
      type: "number",
      default: 0,
      min: -1,
      max: 5,
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
    const state = (values.state as ComboboxState) ?? "opened";
    const query = values.query as string | undefined;
    const revealCount = values.revealCount as number | undefined;
    const placeholder = values.placeholder as string | undefined;
    const selectedIndex = values.selectedIndex as number | undefined;
    const highlightedIndex = values.highlightedIndex as number | undefined;
    const mode = values.mode as string | undefined;

    const props: string[] = [`  state="${state}"`];
    if (query !== undefined && query !== DEFAULT_QUERY)
      props.push(`  query="${query}"`);
    if (revealCount !== undefined && revealCount !== 0)
      props.push(`  revealCount={${revealCount}}`);
    if (placeholder !== undefined && placeholder !== DEFAULT_PLACEHOLDER)
      props.push(`  placeholder="${placeholder}"`);
    if (selectedIndex !== undefined && selectedIndex !== -1)
      props.push(`  selectedIndex={${selectedIndex}}`);
    if (highlightedIndex !== undefined && highlightedIndex !== -1)
      props.push(`  highlightedIndex={${highlightedIndex}}`);
    if (mode !== undefined && mode !== "light")
      props.push(`  mode="${mode}"`);

    return `import { Combobox } from "@/components/remocn/combobox";

<Combobox
${props.join("\n")}
/>`;
  },
};
