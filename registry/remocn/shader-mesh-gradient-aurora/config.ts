import { presetConfig } from "@/lib/shader-presets";
import { shaderMeshGradientConfig } from "../shader-mesh-gradient/config";
import { shaderMeshGradientAuroraPreset } from ".";

export const shaderMeshGradientAuroraConfig = presetConfig(
  shaderMeshGradientConfig,
  shaderMeshGradientAuroraPreset,
  {
    slug: "shader-mesh-gradient-aurora",
    componentName: "ShaderMeshGradientAurora",
  },
);
