import { presetConfig } from "@/lib/shader-presets";
import { shaderWarpConfig } from "../shader-warp/config";
import { shaderWarpAcidPreset } from ".";

export const shaderWarpAcidConfig = presetConfig(
  shaderWarpConfig,
  shaderWarpAcidPreset,
  {
    slug: "shader-warp-acid",
    componentName: "ShaderWarpAcid",
  },
);
