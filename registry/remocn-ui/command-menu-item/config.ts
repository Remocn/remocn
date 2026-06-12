import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";
import type { CommandMenuItemState } from "@/registry/remocn-ui/command-menu-item";

export const commandMenuItemConfig: ComponentConfig = {
  componentName: "CommandMenuItem",
  importPath: "@/components/remocn/command-menu-item",
  controls: {
    label: { type: "text", default: "Settings", label: "Label" },
    icon: {
      type: "select",
      default: "settings",
      options: ["search", "settings", "user", "file"],
      label: "Icon",
    },
    shortcut: { type: "text", default: "⌘ S", label: "Shortcut" },
    state: {
      type: "select",
      default: "selected",
      options: ["idle", "hover", "press", "selected"],
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
    const state = (values.state as CommandMenuItemState) ?? "selected";
    const label = values.label as string | undefined;
    const icon = values.icon as string | undefined;
    const shortcut = values.shortcut as string | undefined;
    const mode = values.mode as string | undefined;

    const props: string[] = [`  state="${state}"`];
    if (label !== undefined && label !== "Settings")
      props.push(`  label="${label}"`);
    if (icon !== undefined && icon !== "settings")
      props.push(`  icon="${icon}"`);
    if (shortcut !== undefined && shortcut !== "")
      props.push(`  shortcut="${shortcut}"`);
    if (mode !== undefined && mode !== "light")
      props.push(`  mode="${mode}"`);

    return `import { CommandMenuItem } from "@/components/remocn/command-menu-item";

<CommandMenuItem
${props.join("\n")}
/>`;
  },
};
