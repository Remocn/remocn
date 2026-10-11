import { presetConfig } from "@/lib/shader-presets";
import { shaderMeshGradientConfig } from "../shader-mesh-gradient/config";
import { shaderMeshGradientLavenderPreset } from ".";

export const shaderMeshGradientLavenderConfig = presetConfig(
  shaderMeshGradientConfig,
  shaderMeshGradientLavenderPreset,
  {
    slug: "shader-mesh-gradient-lavender",
    componentName: "ShaderMeshGradientLavender",
  },
);
