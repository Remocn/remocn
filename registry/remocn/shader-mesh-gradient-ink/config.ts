import { presetConfig } from "@/lib/shader-presets";
import { shaderMeshGradientConfig } from "../shader-mesh-gradient/config";
import { shaderMeshGradientInkPreset } from ".";

export const shaderMeshGradientInkConfig = presetConfig(
  shaderMeshGradientConfig,
  shaderMeshGradientInkPreset,
  {
    slug: "shader-mesh-gradient-ink",
    componentName: "ShaderMeshGradientInk",
  },
);
