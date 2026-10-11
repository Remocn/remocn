import { presetConfig } from "@/lib/shader-presets";
import { shaderWarpConfig } from "../shader-warp/config";
import { shaderWarpCreamPreset } from ".";

export const shaderWarpCreamConfig = presetConfig(
  shaderWarpConfig,
  shaderWarpCreamPreset,
  {
    slug: "shader-warp-cream",
    componentName: "ShaderWarpCream",
  },
);
