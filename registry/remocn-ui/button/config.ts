import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";
import type { ButtonState } from "@/registry/remocn-ui/button";

export const buttonConfig: ComponentConfig = {
  componentName: "Button",
  importPath: "@/components/remocn/button",
  controls: {
    label: {
      type: "text-content",
      default: "Continue",
      description: "Label",
    },
    variant: {
      type: "enum",
      default: "default",
      variants: {
        default: {},
        secondary: {},
        destructive: {},
        outline: {},
        ghost: {},
      },
      description: "Variant",
    },
    size: {
      type: "enum",
      default: "default",
      variants: {
        sm: {},
        default: {},
        lg: {},
      },
      description: "Size",
    },
    state: {
      type: "enum",
      default: "loading",
      variants: {
        idle: {},
        hover: {},
        press: {},
        loading: {},
        success: {},
      },
      description: "State",
    },
    primary: {
      type: "color",
      default: "#171717",
      description: "Primary",
    },
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
