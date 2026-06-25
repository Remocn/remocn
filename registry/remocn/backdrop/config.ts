import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const backdropConfig: ComponentConfig = {
  componentName: "Backdrop",
  importPath: "@/components/remocn/backdrop",
  controls: {
    fillType: {
      type: "select",
      default: "gradient",
      options: ["color", "gradient", "image"],
      label: "Fill type",
    },
    color: { type: "color", default: "#6366f1", label: "Color" },
    gradient: {
      type: "text",
      default: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
      label: "Gradient (CSS)",
    },
    image: {
      type: "text",
      default: "/hero.png",
      label: "Image URL",
    },
    padding: {
      type: "number",
      default: 4,
      min: 0,
      max: 12,
      step: 0.5,
      label: "Padding",
    },
    radius: {
      type: "number",
      default: 1,
      min: 0,
      max: 4,
      step: 0.25,
      label: "Radius",
    },
    shadow: {
      type: "text",
      default: "0 20px 60px rgba(0,0,0,0.4)",
      label: "Shadow",
    },
  },
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  snippet: (values) => {
    const fillType = values.fillType as string;
    const color = values.color as string;
    const gradient = values.gradient as string;
    const image = values.image as string;
    const padding = values.padding as number;
    const radius = values.radius as number;
    const shadow = values.shadow as string;

    const fill =
      fillType === "color"
        ? `{{ type: "color", value: "${color}" }}`
        : fillType === "image"
          ? `{{ type: "image", src: "${image}" }}`
          : `{{ type: "gradient", value: "${gradient}" }}`;

    return `import { Backdrop } from "@/components/remocn/backdrop";

<Backdrop
  fill=${fill}
  padding={${padding}}
  radius={${radius}}
  shadow="${shadow}"
>
  <YourContent />
</Backdrop>`;
  },
};
