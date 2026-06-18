import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const cursorConfig: ComponentConfig = {
  componentName: "Cursor",
  importPath: "@/components/remocn/cursor",
  controls: {
    variant: {
      type: "select",
      default: "arrow",
      options: ["arrow", "pointer"],
      label: "Variant",
    },
    size: { type: "number", default: 28, min: 16, max: 64, step: 2, label: "Size" },
    rippleColor: { type: "color", default: "#171717", label: "Ripple" },
  },
  durationInFrames: 120,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "oklch(1 0 0)" },
  snippet: (values) => {
    const variant = values.variant as string | undefined;
    const size = values.size as number | undefined;

    const props: string[] = ["  style={style}"];
    if (variant !== undefined && variant !== "arrow")
      props.push(`  variant="${variant}"`);
    if (size !== undefined && size !== 28) props.push(`  size={${size}}`);

    return `import { Cursor } from "@/components/remocn/cursor";
import { useCursorPath } from "@/components/remocn/use-cursor-path";

// The cursor is value-channel driven: \`useCursorPath\` reads the frame and
// returns the animated \`CursorStyle\`; \`<Cursor>\` itself stays pure.
const style = useCursorPath([
  { at: 0, x: 120, y: 120 },
  { at: 24, x: 360, y: 200, click: true },
]);

<Cursor
${props.join("\n")}
/>`;
  },
};
