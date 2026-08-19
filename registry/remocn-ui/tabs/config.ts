import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";
import type { TabsState } from "@/registry/remocn-ui/tabs";

export const tabsConfig: ComponentConfig = {
  componentName: "Tabs",
  importPath: "@/components/remocn/tabs",
  controls: {
    state: {
      type: "enum",
      default: "Account",
      variants: {
        Account: {},
        Password: {},
        Settings: {},
      },
      description: "State",
    },
    variant: {
      type: "enum",
      default: "pill",
      variants: {
        pill: {},
        underline: {},
      },
      description: "Variant",
    },
  },
  durationInFrames: 120,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "oklch(1 0 0)" },
  snippet: (values) => {
    const state = (values.state as TabsState) ?? "Account";
    const variant = values.variant as string | undefined;

    const props: string[] = [`  state="${state}"`];
    if (variant !== undefined && variant !== "pill")
      props.push(`  variant="${variant}"`);

    return `import { Tabs } from "@/components/remocn/tabs";

<Tabs
${props.join("\n")}
/>`;
  },
};
