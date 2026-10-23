import { Composition, Folder, registerRoot } from "remotion";
import { cameraPhysicsDrafts } from "./motion-pack/camera-physics";
import { generativeDrafts } from "./motion-pack/generative";
import { graphicLookDrafts } from "./motion-pack/graphic-looks";
import { logoStingDrafts } from "./motion-pack/logo-stings";
import type { DraftShelf } from "./motion-pack/shared";
import { transitionDrafts } from "./motion-pack/transitions";

// Studio shelves for the motion pack (October 2026 release).
// Run: bun run studio:motion-pack
const SHELVES: DraftShelf[] = [
  { id: "Transitions", entries: transitionDrafts },
  { id: "Logo-stings", entries: logoStingDrafts },
  { id: "Generative-loops", entries: generativeDrafts },
  { id: "Camera-and-physics", entries: cameraPhysicsDrafts },
  { id: "Graphic-looks", entries: graphicLookDrafts },
];

function MotionPackRoot() {
  return (
    <>
      {SHELVES.map((shelf) => (
        <Folder key={shelf.id} name={shelf.id}>
          {shelf.entries.map((entry) => (
            <Composition
              key={entry.id}
              id={entry.id}
              component={entry.component}
              durationInFrames={entry.durationInFrames}
              fps={30}
              width={1280}
              height={720}
              defaultProps={entry.defaultProps ?? {}}
            />
          ))}
        </Folder>
      ))}
    </>
  );
}

registerRoot(MotionPackRoot);
