import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";
import type { AlertDialogState } from "@/registry/remocn-ui/alert-dialog";

const DEFAULT_DESCRIPTION =
  "This action cannot be undone. This will permanently remove your data from our servers.";

export const alertDialogConfig: ComponentConfig = {
  componentName: "AlertDialog",
  importPath: "@/components/remocn/alert-dialog",
  controls: {
    title: { type: "text", default: "Delete account?", label: "Title" },
    description: {
      type: "text",
      default: DEFAULT_DESCRIPTION,
      label: "Description",
    },
    actionLabel: { type: "text", default: "Delete", label: "Action Label" },
    cancelLabel: { type: "text", default: "Cancel", label: "Cancel Label" },
    state: {
      type: "select",
      default: "opened",
      options: ["opened", "closed"],
      label: "State",
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
    const state = (values.state as AlertDialogState) ?? "opened";
    const title = values.title as string | undefined;
    const description = values.description as string | undefined;
    const actionLabel = values.actionLabel as string | undefined;
    const cancelLabel = values.cancelLabel as string | undefined;
    const mode = values.mode as string | undefined;

    const props: string[] = [`  state="${state}"`];
    if (title !== undefined && title !== "Delete account?")
      props.push(`  title="${title}"`);
    if (description !== undefined && description !== DEFAULT_DESCRIPTION)
      props.push(`  description="${description}"`);
    if (actionLabel !== undefined && actionLabel !== "Delete")
      props.push(`  actionLabel="${actionLabel}"`);
    if (cancelLabel !== undefined && cancelLabel !== "Cancel")
      props.push(`  cancelLabel="${cancelLabel}"`);
    if (mode !== undefined && mode !== "light")
      props.push(`  mode="${mode}"`);

    return `import { AlertDialog } from "@/components/remocn/alert-dialog";

<AlertDialog
${props.join("\n")}
/>`;
  },
};
