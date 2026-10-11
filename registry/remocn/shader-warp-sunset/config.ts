import { presetConfig } from "@/lib/shader-presets";
import { shaderWarpConfig } from "../shader-warp/config";
import { shaderWarpSunsetPreset } from ".";

export const shaderWarpSunsetConfig = presetConfig(
  shaderWarpConfig,
  shaderWarpSunsetPreset,
  {
    slug: "shader-warp-sunset",
    componentName: "ShaderWarpSunset",
  },
);
