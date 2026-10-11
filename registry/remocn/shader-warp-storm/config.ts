import { presetConfig } from "@/lib/shader-presets";
import { shaderWarpConfig } from "../shader-warp/config";
import { shaderWarpStormPreset } from ".";

export const shaderWarpStormConfig = presetConfig(
  shaderWarpConfig,
  shaderWarpStormPreset,
  {
    slug: "shader-warp-storm",
    componentName: "ShaderWarpStorm",
  },
);
