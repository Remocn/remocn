import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const typingIndicatorConfig: ComponentConfig = {
  componentName: "TypingIndicator",
  importPath: "@/components/remocn/typing-indicator",
  controls: {
    dotCount: {
      type: "number",
      default: 3,
      min: 2,
      max: 5,
      step: 1,
      label: "Dots",
    },
    size: {
      type: "number",
      default: 8,
      min: 4,
      max: 16,
      step: 1,
      label: "Dot size",
    },
    amplitude: {
      type: "number",
      default: 5,
      min: 0,
      max: 14,
      step: 1,
      label: "Bounce",
    },
  },
  durationInFrames: 90,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "oklch(1 0 0)" },
  snippet: (values) => {
    const dotCount = (values.dotCount as number | undefined) ?? 3;
    const size = (values.size as number | undefined) ?? 8;
    const amplitude = (values.amplitude as number | undefined) ?? 5;
    const speed = (values.speed as number | undefined) ?? 1;

    const props: string[] = [];
    if (dotCount !== 3) props.push(`  dotCount={${dotCount}}`);
    if (size !== 8) props.push(`  size={${size}}`);
    if (amplitude !== 5) props.push(`  amplitude={${amplitude}}`);
    if (speed !== 1) props.push(`  speed={${speed}}`);

    const body = props.length > 0 ? `\n${props.join("\n")}\n` : " ";
    return `import { TypingIndicator } from "@/components/remocn/typing-indicator";

<TypingIndicator${body}/>`;
  },
};
