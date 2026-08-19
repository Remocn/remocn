import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const skeletonBlockConfig: ComponentConfig = {
  componentName: "SkeletonBlock",
  importPath: "@/components/remocn/skeleton-block",
  controls: {
    width: {
      type: "number",
      min: 40,
      max: 600,
      step: 10,
      default: 240,
      description: "Width",
      hiddenFromList: false,
    },
    height: {
      type: "number",
      min: 8,
      max: 120,
      step: 2,
      default: 20,
      description: "Height",
      hiddenFromList: false,
    },
    radius: {
      type: "number",
      min: 0,
      max: 60,
      step: 1,
      default: 6,
      description: "Radius",
      hiddenFromList: false,
    },
  },
  durationInFrames: 120,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  snippet: (values) => {
    const width = values.width as number | undefined;
    const height = values.height as number | undefined;
    const radius = values.radius as number | undefined;

    const props: string[] = [];
    if (width !== undefined && width !== 240) props.push(`  width={${width}}`);
    if (height !== undefined && height !== 20)
      props.push(`  height={${height}}`);
    if (radius !== undefined && radius !== 6)
      props.push(`  radius={${radius}}`);

    const propsBlock = props.length ? `\n${props.join("\n")}\n` : "";
    return `import { SkeletonBlock } from "@/components/remocn/skeleton-block";

<SkeletonBlock${propsBlock}/>`;
  },
};
