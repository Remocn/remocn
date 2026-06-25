import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";
import type { TabsState } from "@/registry/remocn-ui/tabs";

export const tabsConfig: ComponentConfig = {
  componentName: "Tabs",
  importPath: "@/components/remocn/tabs",
  controls: {
    state: {
      type: "select",
      default: "Account",
      options: ["Account", "Password", "Settings"],
      label: "State",
    },
    variant: {
      type: "select",
      default: "pill",
      options: ["pill", "underline"],
      label: "Variant",
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
