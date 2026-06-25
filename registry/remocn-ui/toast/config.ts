import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";
import type { ToastState } from "@/registry/remocn-ui/toast";

const DEFAULT_TITLE = "Changes saved";
const DEFAULT_DESCRIPTION = "Your profile has been updated.";

export const toastConfig: ComponentConfig = {
  componentName: "Toast",
  importPath: "@/components/remocn/toast",
  controls: {
    title: { type: "text", default: DEFAULT_TITLE, label: "Title" },
    description: {
      type: "text",
      default: DEFAULT_DESCRIPTION,
      label: "Description",
    },
    variant: {
      type: "select",
      default: "success",
      options: ["default", "success", "error"],
      label: "Variant",
    },
    state: {
      type: "select",
      default: "visible",
      options: ["hidden", "visible"],
      label: "State",
    },
  },
  durationInFrames: 120,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "oklch(1 0 0)" },
  snippet: (values) => {
    const state = (values.state as ToastState) ?? "visible";
    const title = values.title as string | undefined;
    const description = values.description as string | undefined;
    const variant = values.variant as string | undefined;

    const props: string[] = [
      `  state="${state}"`,
      `  title="${title ?? DEFAULT_TITLE}"`,
    ];
    if (description !== undefined && description !== DEFAULT_DESCRIPTION)
      props.push(`  description="${description}"`);
    if (variant !== undefined && variant !== "default")
      props.push(`  variant="${variant}"`);

    return `import { Toast } from "@/components/remocn/toast";

<Toast
${props.join("\n")}
/>`;
  },
};
