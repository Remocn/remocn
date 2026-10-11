import { presetConfig } from "@/lib/shader-presets";
import { shaderMeshGradientConfig } from "../shader-mesh-gradient/config";
import { shaderMeshGradientSynthwavePreset } from ".";

export const shaderMeshGradientSynthwaveConfig = presetConfig(
  shaderMeshGradientConfig,
  shaderMeshGradientSynthwavePreset,
  {
    slug: "shader-mesh-gradient-synthwave",
    componentName: "ShaderMeshGradientSynthwave",
  },
);
