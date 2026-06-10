import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const skeletonBlockConfig: ComponentConfig = {
  componentName: "SkeletonBlock",
  importPath: "@/components/remocn/skeleton-block",
  controls: {
    width: { type: "number", default: 240, min: 40, max: 600, step: 10, label: "Width" },
    height: { type: "number", default: 20, min: 8, max: 120, step: 2, label: "Height" },
    radius: { type: "number", default: 6, min: 0, max: 60, step: 1, label: "Radius" },
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
    if (height !== undefined && height !== 20) props.push(`  height={${height}}`);
    if (radius !== undefined && radius !== 6) props.push(`  radius={${radius}}`);

    const propsBlock = props.length ? `\n${props.join("\n")}\n` : "";
    return `import { SkeletonBlock } from "@/components/remocn/skeleton-block";

<SkeletonBlock${propsBlock}/>`;
  },
};
