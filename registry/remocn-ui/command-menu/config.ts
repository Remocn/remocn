import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";
import type { CommandMenuState } from "@/registry/remocn-ui/command-menu";

const DEFAULT_QUERY = "";

export const commandMenuConfig: ComponentConfig = {
  componentName: "CommandMenu",
  importPath: "@/components/remocn/command-menu",
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
    query: {
      type: "text-content",
      default: "",
      description: "Query",
    },
    revealCount: {
      type: "number",
      min: 0,
      max: 20,
      step: 1,
      default: 0,
      description: "Reveal Count",
      hiddenFromList: false,
    },
    selectedIndex: {
      type: "number",
      min: -1,
      max: 5,
      step: 1,
      default: -1,
      description: "Selected Index",
      hiddenFromList: false,
    },
    highlightedIndex: {
      type: "number",
      min: -1,
      max: 5,
      step: 1,
      default: 0,
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
    const state = (values.state as CommandMenuState) ?? "opened";
    const query = values.query as string | undefined;
    const revealCount = values.revealCount as number | undefined;
    const selectedIndex = values.selectedIndex as number | undefined;
    const highlightedIndex = values.highlightedIndex as number | undefined;

    const props: string[] = [`  state="${state}"`];
    if (query !== undefined && query !== DEFAULT_QUERY)
      props.push(`  query="${query}"`);
    if (revealCount !== undefined && revealCount !== 0)
      props.push(`  revealCount={${revealCount}}`);
    if (selectedIndex !== undefined && selectedIndex !== -1)
      props.push(`  selectedIndex={${selectedIndex}}`);
    if (highlightedIndex !== undefined && highlightedIndex !== -1)
      props.push(`  highlightedIndex={${highlightedIndex}}`);

    return `import { CommandMenu } from "@/components/remocn/command-menu";

<CommandMenu
${props.join("\n")}
/>`;
  },
};
