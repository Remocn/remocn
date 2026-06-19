import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";
import type { ButtonState } from "@/registry/remocn-ui/button";

export const buttonConfig: ComponentConfig = {
  componentName: "Button",
  importPath: "@/components/remocn/button",
  controls: {
    label: { type: "text", default: "Continue", label: "Label" },
    variant: {
      type: "select",
      default: "default",
      options: ["default", "secondary", "destructive", "outline", "ghost"],
      label: "Variant",
    },
    size: {
      type: "select",
      default: "default",
      options: ["sm", "default", "lg"],
      label: "Size",
    },
    state: {
      type: "select",
      default: "loading",
      options: ["idle", "hover", "press", "loading", "success"],
      label: "State",
    },
    primary: { type: "color", default: "#171717", label: "Primary" },
  },
  durationInFrames: 120,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "oklch(1 0 0)" },
  snippet: (values) => {
    const state = (values.state as ButtonState) ?? "loading";
    const label = values.label as string | undefined;
    const variant = values.variant as string | undefined;
    const size = values.size as string | undefined;
    const primary = values.primary as string | undefined;

    const props: string[] = [`  state="${state}"`];
    if (label !== undefined && label !== "Continue")
      props.push(`  label="${label}"`);
    if (variant !== undefined && variant !== "default")
      props.push(`  variant="${variant}"`);
    if (size !== undefined && size !== "default")
      props.push(`  size="${size}"`);
    if (primary !== undefined && primary !== "#171717")
      props.push(`  primary="${primary}"`);

    return `import { Button } from "@/components/remocn/button";

<Button
${props.join("\n")}
/>`;
  },
};
