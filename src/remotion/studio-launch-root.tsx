import { Composition, registerRoot } from "remotion";
import {
  STUDIO_FPS,
  STUDIO_FRAMES,
  STUDIO_HEIGHT,
  STUDIO_WIDTH,
  StudioLaunch,
} from "@/registry/remocn-templates/studio-launch";

function Root() {
  return (
    <Composition
      id="StudioLaunch"
      component={StudioLaunch}
      durationInFrames={STUDIO_FRAMES}
      fps={STUDIO_FPS}
      width={STUDIO_WIDTH}
      height={STUDIO_HEIGHT}
      defaultProps={{}}
    />
  );
}
registerRoot(Root);
