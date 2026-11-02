import { presetConfig } from "@/lib/shader-presets";
import { shaderWarpConfig } from "../shader-warp/config";
import { shaderWarpSilkPreset } from ".";

export const shaderWarpSilkConfig = presetConfig(
  shaderWarpConfig,
  shaderWarpSilkPreset,
  {
    slug: "shader-warp-silk",
    componentName: "ShaderWarpSilk",
  },
);
