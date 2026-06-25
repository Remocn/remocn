import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";
import type { AccordionState } from "@/registry/remocn-ui/accordion";

export const accordionConfig: ComponentConfig = {
  componentName: "Accordion",
  importPath: "@/components/remocn/accordion",
  controls: {
    title: { type: "text", default: "Is it accessible?", label: "Title" },
    content: {
      type: "text",
      default: "Yes. It adheres to the WAI-ARIA design pattern.",
      label: "Content",
    },
    variant: {
      type: "select",
      default: "default",
      options: ["default", "ghost"],
      label: "Variant",
    },
    state: {
      type: "select",
      default: "opened",
      options: ["opened", "closed"],
      label: "State",
    },
  },
  durationInFrames: 120,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "oklch(1 0 0)" },
  snippet: (values) => {
    const state = (values.state as AccordionState) ?? "opened";
    const title = values.title as string | undefined;
    const content = values.content as string | undefined;
    const variant = values.variant as string | undefined;

    const props: string[] = [`  state="${state}"`];
    if (title !== undefined && title !== "Is it accessible?")
      props.push(`  title="${title}"`);
    if (
      content !== undefined &&
      content !== "Yes. It adheres to the WAI-ARIA design pattern."
    )
      props.push(`  content="${content}"`);
    if (variant !== undefined && variant !== "default")
      props.push(`  variant="${variant}"`);

    return `import { Accordion } from "@/components/remocn/accordion";

<Accordion
${props.join("\n")}
/>`;
  },
};
