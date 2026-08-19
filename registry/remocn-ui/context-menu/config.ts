import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";
import type { ContextMenuState } from "@/registry/remocn-ui/context-menu";

const DEFAULT_ITEMS = ["Back", "Reload", "Save As…", "Inspect"];

export const contextMenuConfig: ComponentConfig = {
  componentName: "ContextMenu",
  importPath: "@/components/remocn/context-menu",
  controls: {
    state: {
      type: "enum",
      default: "opened",
      variants: {
        opened: {},
        closed: {},
      },
      description: "State",
    },
    highlightedIndex: {
      type: "number",
      min: -1,
      max: 5,
      step: 1,
      default: 1,
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
    const state = (values.state as ContextMenuState) ?? "opened";
    const highlightedIndex = values.highlightedIndex as number | undefined;

    const props: string[] = [`  state="${state}"`];
    if (highlightedIndex !== undefined && highlightedIndex !== -1)
      props.push(`  highlightedIndex={${highlightedIndex}}`);

    const itemsLiteral = JSON.stringify(DEFAULT_ITEMS);
    return `import { ContextMenu } from "@/components/remocn/context-menu";

<ContextMenu
${props.join("\n")}
  items={${itemsLiteral}}
/>`;
  },
};
