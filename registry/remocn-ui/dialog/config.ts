import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";
import type { DialogState } from "@/registry/remocn-ui/dialog";

const DEFAULT_DESCRIPTION =
  "Make changes to your profile here. Click save when you're done.";

export const dialogConfig: ComponentConfig = {
  componentName: "Dialog",
  importPath: "@/components/remocn/dialog",
  controls: {
    title: { type: "text", default: "Edit profile", label: "Title" },
    description: {
      type: "text",
      default: DEFAULT_DESCRIPTION,
      label: "Description",
    },
    actionLabel: {
      type: "text",
      default: "Save changes",
      label: "Action Label",
    },
    cancelLabel: { type: "text", default: "Cancel", label: "Cancel Label" },
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
    const state = (values.state as DialogState) ?? "opened";
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

    return `import { Dialog } from "@/components/remocn/dialog";

<Dialog
${props.join("\n")}
/>`;
  },
};
