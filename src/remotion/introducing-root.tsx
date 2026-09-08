import { Composition, registerRoot } from "remotion";
import {
  INTRODUCING_DURATION,
  INTRODUCING_FPS,
  INTRODUCING_HEIGHT,
  INTRODUCING_WIDTH,
  IntroducingProduct,
} from "@/registry/remocn-templates/introducing-product";

function IntroducingRoot() {
  return (
    <Composition
      id="IntroducingRemocn"
      component={IntroducingProduct}
      durationInFrames={INTRODUCING_DURATION * INTRODUCING_FPS}
      fps={INTRODUCING_FPS}
      width={INTRODUCING_WIDTH}
      height={INTRODUCING_HEIGHT}
      defaultProps={{}}
    />
  );
}
registerRoot(IntroducingRoot);
