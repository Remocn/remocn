import { Composition, registerRoot } from "remotion";
import { CenterStageDemo, centerStageDemoLength } from "./center-stage-demo";

// Hard-cut demo reel from Center Stage clips of staging.remocn.dev.
// The clips are not in the repo; point --public-dir at their folder.
function CenterStageDemoRoot() {
  return (
    <Composition
      id="center-stage-demo"
      component={CenterStageDemo}
      durationInFrames={centerStageDemoLength}
      fps={30}
      width={1920}
      height={1080}
    />
  );
}

registerRoot(CenterStageDemoRoot);
