import { Composition, registerRoot } from "remotion";
import {
  NOT_FOUND_DURATION,
  NOT_FOUND_FPS,
  NOT_FOUND_HEIGHT,
  NOT_FOUND_WIDTH,
  NotFoundScene,
} from "./not-found-scene";

export function NotFoundRoot() {
  return (
    <Composition
      id="not-found"
      component={NotFoundScene}
      durationInFrames={NOT_FOUND_DURATION}
      fps={NOT_FOUND_FPS}
      width={NOT_FOUND_WIDTH}
      height={NOT_FOUND_HEIGHT}
      defaultProps={{ theme: "dark" as const }}
    />
  );
}

registerRoot(NotFoundRoot);
