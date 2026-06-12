import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";
import type { ContextMenuState } from "@/registry/remocn-ui/context-menu";

const DEFAULT_ITEMS = ["Back", "Reload", "Save As…", "Inspect"];

export const contextMenuConfig: ComponentConfig = {
  componentName: "ContextMenu",
  importPath: "@/components/remocn/context-menu",
  controls: {
    state: {
      type: "select",
      default: "opened",
      options: ["opened", "closed"],
      label: "State",
    },
    highlightedIndex: {
      type: "number",
      default: 1,
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
    const state = (values.state as ContextMenuState) ?? "opened";
    const highlightedIndex = values.highlightedIndex as number | undefined;
    const mode = values.mode as string | undefined;

    const props: string[] = [`  state="${state}"`];
    if (highlightedIndex !== undefined && highlightedIndex !== -1)
      props.push(`  highlightedIndex={${highlightedIndex}}`);
    if (mode !== undefined && mode !== "light")
      props.push(`  mode="${mode}"`);

    const itemsLiteral = JSON.stringify(DEFAULT_ITEMS);
    return `import { ContextMenu } from "@/components/remocn/context-menu";

<ContextMenu
${props.join("\n")}
  items={${itemsLiteral}}
/>`;
  },
};
