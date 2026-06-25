import {
  type ComponentConfig,
  FPS,
  H,
  SHARED_CONTROLS,
  W,
} from "@/lib/customizer-config";
import type {
  BlurInDirection,
  BlurInState,
} from "@/registry/remocn-ui/blur-in";

export const blurInConfig: ComponentConfig = {
  componentName: "BlurIn",
  importPath: "@/components/remocn/blur-in",
  controls: {
    state: {
      type: "select",
      default: "revealed",
      options: ["hidden", "revealed"],
      label: "State",
    },
    blur: {
      type: "number",
      default: 8,
      min: 0,
      max: 40,
      step: 1,
      label: "Blur",
    },
    distance: {
      type: "number",
      default: 12,
      min: 0,
      max: 80,
      step: 1,
      label: "Distance",
    },
    direction: {
      type: "select",
      default: "up",
      options: ["up", "down", "left", "right"],
      label: "Direction",
    },
    ...SHARED_CONTROLS,
  },
  durationInFrames: 120,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  snippet: (values) => {
    const state = (values.state as BlurInState) ?? "revealed";
    const blur = values.blur as number | undefined;
    const distance = values.distance as number | undefined;
    const direction = values.direction as BlurInDirection | undefined;

    const props: string[] = [`  state="${state}"`];
    if (direction !== undefined && direction !== "up")
      props.push(`  direction="${direction}"`);
    if (blur !== undefined && blur !== 8) props.push(`  blur={${blur}}`);
    if (distance !== undefined && distance !== 12)
      props.push(`  distance={${distance}}`);

    return `import { BlurIn } from "@/components/remocn/blur-in";

<BlurIn
${props.join("\n")}
>
  {/* your element */}
</BlurIn>`;
  },
};
