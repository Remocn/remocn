import { AbsoluteFill, Composition, registerRoot } from "remotion";
import {
  ShaderWarp,
  type ShaderWarpProps,
} from "@/registry/remocn/shader-warp";

export const HERO_BG_WIDTH = 1200;
export const HERO_BG_HEIGHT = 630;
export const HERO_BG_FPS = 30;
export const HERO_BG_DURATION = 300;

export const HERO_BG_COLORS = ["#000d14", "#001929", "#00263d", "#00355a"];

export const HERO_BG_DEFAULTS: ShaderWarpProps = {
  colors: HERO_BG_COLORS,
  proportion: 0.5,
  softness: 0.15,
  distortion: 0.2,
  swirl: 0.4,
  swirlIterations: 10,
  shape: "checks",
  shapeScale: 0.5,
  scale: 1,
  rotation: 0,
};

export function HeroBgScene(props: ShaderWarpProps) {
  const colors = props.colors ?? HERO_BG_COLORS;
  return (
    <AbsoluteFill style={{ backgroundColor: colors[0] }}>
      <ShaderWarp {...props} />
    </AbsoluteFill>
  );
}

export function HeroBgRoot() {
  return (
    <Composition
      id="hero-bg"
      component={HeroBgScene}
      durationInFrames={HERO_BG_DURATION}
      fps={HERO_BG_FPS}
      width={HERO_BG_WIDTH}
      height={HERO_BG_HEIGHT}
      defaultProps={HERO_BG_DEFAULTS}
    />
  );
}

registerRoot(HeroBgRoot);
