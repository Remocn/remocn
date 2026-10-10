import { Composition, registerRoot } from "remotion";
import {
  FOMO_FPS,
  FOMO_FRAMES,
  FOMO_HEIGHT,
  FOMO_WIDTH,
  FomoLimitOrders,
} from "@/registry/remocn-templates/fomo-limit-orders";

function FomoRoot() {
  return (
    <Composition
      id="FomoLimitOrders"
      component={FomoLimitOrders}
      durationInFrames={FOMO_FRAMES}
      fps={FOMO_FPS}
      width={FOMO_WIDTH}
      height={FOMO_HEIGHT}
      defaultProps={{}}
    />
  );
}
registerRoot(FomoRoot);
