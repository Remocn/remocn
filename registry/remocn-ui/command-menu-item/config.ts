import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";
import type { CommandMenuItemState } from "@/registry/remocn-ui/command-menu-item";

export const commandMenuItemConfig: ComponentConfig = {
  componentName: "CommandMenuItem",
  importPath: "@/components/remocn/command-menu-item",
  controls: {
    label: {
      type: "text-content",
      default: "Settings",
      description: "Label",
    },
    icon: {
      type: "enum",
      default: "settings",
      variants: {
        search: {},
        settings: {},
        user: {},
        file: {},
      },
      description: "Icon",
    },
    shortcut: {
      type: "text-content",
      default: "⌘ S",
      description: "Shortcut",
    },
    state: {
      type: "enum",
      default: "selected",
      variants: {
        idle: {},
        hover: {},
        press: {},
        selected: {},
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
    const state = (values.state as CommandMenuItemState) ?? "selected";
    const label = values.label as string | undefined;
    const icon = values.icon as string | undefined;
    const shortcut = values.shortcut as string | undefined;

    const props: string[] = [`  state="${state}"`];
    if (label !== undefined && label !== "Settings")
      props.push(`  label="${label}"`);
    if (icon !== undefined && icon !== "settings")
      props.push(`  icon="${icon}"`);
    if (shortcut !== undefined && shortcut !== "")
      props.push(`  shortcut="${shortcut}"`);

    return `import { CommandMenuItem } from "@/components/remocn/command-menu-item";

<CommandMenuItem
${props.join("\n")}
/>`;
  },
};
