import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";
import type { SheetState } from "@/registry/remocn-ui/sheet";

const DEFAULT_DESCRIPTION =
  "Make changes to your profile here. Click save when you're done.";

export const sheetConfig: ComponentConfig = {
  componentName: "Sheet",
  importPath: "@/components/remocn/sheet",
  controls: {
    title: {
      type: "text-content",
      default: "Edit profile",
      description: "Title",
    },
    description: {
      type: "text-content",
      default:
        "Make changes to your profile here. Click save when you're done.",
      description: "Description",
    },
    actionLabel: {
      type: "text-content",
      default: "Save changes",
      description: "Action Label",
    },
    cancelLabel: {
      type: "text-content",
      default: "Cancel",
      description: "Cancel Label",
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
  },
  durationInFrames: 120,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "oklch(1 0 0)" },
  snippet: (values) => {
    const state = (values.state as SheetState) ?? "opened";
    const title = values.title as string | undefined;
    const description = values.description as string | undefined;
    const actionLabel = values.actionLabel as string | undefined;
    const cancelLabel = values.cancelLabel as string | undefined;

    const props: string[] = [`  state="${state}"`];
    if (title !== undefined && title !== "Edit profile")
      props.push(`  title="${title}"`);
    if (description !== undefined && description !== DEFAULT_DESCRIPTION)
      props.push(`  description="${description}"`);
    if (actionLabel !== undefined && actionLabel !== "Save changes")
      props.push(`  actionLabel="${actionLabel}"`);
    if (cancelLabel !== undefined && cancelLabel !== "Cancel")
      props.push(`  cancelLabel="${cancelLabel}"`);

    return `import { Sheet } from "@/components/remocn/sheet";

<Sheet
${props.join("\n")}
/>`;
  },
};
