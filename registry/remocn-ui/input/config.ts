import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";
import type { InputState } from "@/registry/remocn-ui/input";

export const inputConfig: ComponentConfig = {
  componentName: "Input",
  importPath: "@/components/remocn/input",
  controls: {
    placeholder: {
      type: "text-content",
      default: "you@example.com",
      description: "Placeholder",
    },
    value: {
      type: "text-content",
      default: "remotion@remocn.dev",
      description: "Value",
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
      default: "typing",
      variants: {
        idle: {},
        hover: {},
        active: {},
        typing: {},
        blur: {},
        invalid: {},
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
    const state = (values.state as InputState) ?? "typing";
    const placeholder = values.placeholder as string | undefined;
    const value = values.value as string | undefined;
    const size = values.size as string | undefined;
    const primary = values.primary as string | undefined;

    const props: string[] = [`  state="${state}"`];
    if (placeholder !== undefined && placeholder !== "you@example.com")
      props.push(`  placeholder="${placeholder}"`);
    if (value !== undefined && value !== "remotion@remocn.dev")
      props.push(`  value="${value}"`);
    if (size !== undefined && size !== "default")
      props.push(`  size="${size}"`);
    if (primary !== undefined && primary !== "#171717")
      props.push(`  primary="${primary}"`);

    return `import { Input } from "@/components/remocn/input";

<Input
${props.join("\n")}
/>`;
  },
};
