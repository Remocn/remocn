import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";
import type { DropdownMenuItemState } from "@/registry/remocn-ui/dropdown-menu-item";

export const dropdownMenuItemConfig: ComponentConfig = {
  componentName: "DropdownMenuItem",
  importPath: "@/components/remocn/dropdown-menu-item",
  controls: {
    label: { type: "text", default: "Profile", label: "Label" },
    state: {
      type: "select",
      default: "hover",
      options: ["idle", "hover", "press"],
      label: "State",
    },
  },
  durationInFrames: 120,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "oklch(1 0 0)" },
  snippet: (values) => {
    const state = (values.state as DropdownMenuItemState) ?? "hover";
    const label = values.label as string | undefined;

    const props: string[] = [`  state="${state}"`];
    if (label !== undefined && label !== "Profile")
      props.push(`  label="${label}"`);

    return `import { DropdownMenuItem } from "@/components/remocn/dropdown-menu-item";

<DropdownMenuItem
${props.join("\n")}
/>`;
  },
};
