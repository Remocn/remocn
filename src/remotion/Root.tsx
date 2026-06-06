import { Composition, registerRoot } from "remotion";
import {
  GitHubStars,
  type GitHubStarsProps,
  SAMPLE_STARGAZERS,
} from "@/registry/remocn/github-stars";

/**
 * Sample props so the composition validates + renders standalone in the Remotion
 * bundle (Studio / pre-render). Real renders override these via `inputProps`.
 */
const DEFAULT_PROPS: GitHubStarsProps = {
  repo: "remotion-dev/remotion",
  totalStars: 24813,
  stargazers: SAMPLE_STARGAZERS,
  orientation: "horizontal",
  accentColor: "#ffbb00",
  speed: 1,
  theme: "light",
};

/**
 * Bundle root. Declares the single `github-stars` composition at full native
 * horizontal quality (1280×720 / 30fps / 300 frames). The server overrides
 * width/height per orientation at render time (see lib/server/render.ts) — one
 * composition, no duplicate vertical entry.
 */
export function RemotionRoot() {
  return (
    <Composition
      id="github-stars"
      component={GitHubStars}
      durationInFrames={300}
      fps={30}
      width={1280}
      height={720}
      defaultProps={DEFAULT_PROPS}
    />
  );
}

registerRoot(RemotionRoot);
