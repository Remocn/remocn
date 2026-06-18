import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";
import type { InputState } from "@/registry/remocn-ui/input";

export const inputConfig: ComponentConfig = {
  componentName: "Input",
  importPath: "@/components/remocn/input",
  controls: {
    placeholder: {
      type: "text",
      default: "you@example.com",
      label: "Placeholder",
    },
    value: { type: "text", default: "remotion@remocn.dev", label: "Value" },
    size: {
      type: "select",
      default: "default",
      options: ["sm", "default", "lg"],
      label: "Size",
    },
    state: {
      type: "select",
      default: "typing",
      options: ["idle", "hover", "active", "typing", "blur", "invalid"],
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
