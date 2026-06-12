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
    const state = (values.state as TabsState) ?? "Account";
    const variant = values.variant as string | undefined;
    const mode = values.mode as string | undefined;

    const props: string[] = [`  state="${state}"`];
    if (variant !== undefined && variant !== "pill")
      props.push(`  variant="${variant}"`);
    if (mode !== undefined && mode !== "light")
      props.push(`  mode="${mode}"`);

    return `import { Tabs } from "@/components/remocn/tabs";

<Tabs
${props.join("\n")}
/>`;
  },
};
