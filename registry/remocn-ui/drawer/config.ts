import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";
import type { DrawerState } from "@/registry/remocn-ui/drawer";

const DEFAULT_DESCRIPTION =
  "Make changes to your profile here. Click save when you're done.";

export const drawerConfig: ComponentConfig = {
  componentName: "Drawer",
  importPath: "@/components/remocn/drawer",
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
    const state = (values.state as DrawerState) ?? "opened";
    const title = values.title as string | undefined;
    const description = values.description as string | undefined;
    const actionLabel = values.actionLabel as string | undefined;
    const cancelLabel = values.cancelLabel as string | undefined;
    const mode = values.mode as string | undefined;

    const props: string[] = [`  state="${state}"`];
    if (title !== undefined && title !== "Edit profile")
      props.push(`  title="${title}"`);
    if (description !== undefined && description !== DEFAULT_DESCRIPTION)
      props.push(`  description="${description}"`);
    if (actionLabel !== undefined && actionLabel !== "Save changes")
      props.push(`  actionLabel="${actionLabel}"`);
    if (cancelLabel !== undefined && cancelLabel !== "Cancel")
      props.push(`  cancelLabel="${cancelLabel}"`);
    if (mode !== undefined && mode !== "light")
      props.push(`  mode="${mode}"`);

    return `import { Drawer } from "@/components/remocn/drawer";

<Drawer
${props.join("\n")}
/>`;
  },
};
