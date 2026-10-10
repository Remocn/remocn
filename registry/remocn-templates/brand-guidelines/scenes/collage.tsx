import { useMemo } from "react";
import { AbsoluteFill } from "remotion";
import type { BrandGuidelinesScene, SceneProps } from "../content";
import { fitSize, slide } from "../motion";
import { BrandImage, FormStudyMark, Label } from "../ui";

type Plate = {
  id: string;
  kind: "ceramics" | "materials" | "chair" | "poster" | "mark" | "specimen";
  x: number;
  y: number;
  width: number;
  height: number;
  velocity: number;
  delay: number;
  direction: number;
  depth?: number;
};

// Coordinates at frame 710. Independent tracks continue beyond the cut.
const plates: Plate[] = [
  {
    id: "back-materials",
    kind: "materials",
    x: 35,
    y: -135,
    width: 245,
    height: 190,
    velocity: 1.15,
    delay: 0,
    direction: -1,
    depth: 0.7,
  },
  {
    id: "back-type",
    kind: "specimen",
    x: 645,
    y: -145,
    width: 260,
    height: 205,
    velocity: -1.1,
    delay: 2,
    direction: -1,
  },
  {
    id: "back-chair",
    kind: "chair",
    x: 695,
    y: 330,
    width: 210,
    height: 280,
    velocity: -1.6,
    delay: 6,
    direction: 1,
  },
  {
    id: "left-poster",
    kind: "poster",
    x: 23,
    y: 88,
    width: 252,
    height: 178,
    velocity: 1.15,
    delay: 2,
    direction: -1,
  },
  {
    id: "right-materials",
    kind: "materials",
    x: 666,
    y: 72,
    width: 265,
    height: 195,
    velocity: -1.6,
    delay: 3,
    direction: 1,
  },
  {
    id: "left-ceramics",
    kind: "ceramics",
    x: 62,
    y: 280,
    width: 266,
    height: 340,
    velocity: 1.15,
    delay: 5,
    direction: 1,
  },
  {
    id: "upper-mark",
    kind: "mark",
    x: 317,
    y: -118,
    width: 260,
    height: 193,
    velocity: -1.05,
    delay: 10,
    direction: -1,
    depth: 0.5,
  },
  {
    id: "lower-type",
    kind: "specimen",
    x: 403,
    y: 452,
    width: 285,
    height: 225,
    velocity: -1.05,
    delay: 7,
    direction: 1,
  },
  {
    id: "foreground-chair",
    kind: "chair",
    x: 290,
    y: 86,
    width: 276,
    height: 362,
    velocity: -1.05,
    delay: 4,
    direction: -1,
  },
  {
    id: "foreground-mark",
    kind: "mark",
    x: 554,
    y: 268,
    width: 260,
    height: 204,
    velocity: -1.6,
    delay: 9,
    direction: 1,
  },
];

function Poster({
  scene,
  kind,
}: {
  scene: BrandGuidelinesScene;
  kind: Plate["kind"];
}) {
  const { theme, content } = scene;
  if (kind === "mark")
    return (
      <AbsoluteFill
        style={{
          background: theme.ink,
          color: theme.paper,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <FormStudyMark scene={scene} color={theme.paper} size={74} />
        <Label
          style={{ position: "absolute", bottom: 17, left: 18, fontSize: 10 }}
        >
          {content.brandName}
        </Label>
      </AbsoluteFill>
    );
  if (kind === "poster")
    return (
      <AbsoluteFill
        style={{
          background: theme.accent,
          color: theme.paper,
          padding: 19,
          boxSizing: "border-box",
        }}
      >
        <Label style={{ fontSize: 9 }}>{content.collectionLabel}</Label>
        <div
          style={{
            marginTop: 17,
            fontSize: fitSize(content.collageTitle, 32, 490),
            lineHeight: 1.02,
            letterSpacing: "-0.045em",
            fontWeight: 500,
            maxWidth: 200,
          }}
        >
          {content.collageTitle}
        </div>
        <div style={{ position: "absolute", right: 16, bottom: 13 }}>
          <FormStudyMark scene={scene} color={theme.paper} size={27} />
        </div>
      </AbsoluteFill>
    );
  return (
    <AbsoluteFill
      style={{
        background: scene.theme.stone,
        color: scene.theme.ink,
        padding: 21,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          fontSize: fitSize(content.brandName, 44, 238),
          lineHeight: 1,
          letterSpacing: "-0.06em",
          fontWeight: 800,
        }}
      >
        {content.brandName}
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 26 }}>
        {Object.values(theme).map((color, i) => (
          <div
            key={["ink", "accent", "stone", "paper"][i]}
            style={{
              width: 45,
              height: 45,
              borderRadius: i === 1 ? "50%" : 0,
              background: color,
            }}
          />
        ))}
      </div>
      <Label style={{ position: "absolute", bottom: 20, fontSize: 10 }}>
        {content.openingTagline}
      </Label>
    </AbsoluteFill>
  );
}

export function ObjectCollage({ scene, frame }: SceneProps) {
  // Photo/poster content changes with props, not with the camera or track positions.
  const contents = useMemo(
    () =>
      plates.map((plate) => {
        const kind = plate.kind;
        return kind === "ceramics" ||
          kind === "materials" ||
          kind === "chair" ? (
          <BrandImage
            key={plate.id}
            src={scene.photos[kind]}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <Poster key={plate.id} scene={scene} kind={kind} />
        );
      }),
    [scene],
  );
  return (
    <AbsoluteFill
      style={{
        scale: scene.reducedMotion ? 1 : 1 + 0.045 * slide(frame, 640, 806),
      }}
    >
      {plates.map((plate, index) => {
        const enter = slide(frame, 614 + plate.delay, 642 + plate.delay);
        const y = scene.reducedMotion
          ? plate.y
          : plate.y +
            (frame - 710) * plate.velocity +
            (1 - enter) * 730 * plate.direction;
        return (
          <div
            key={plate.id}
            style={{
              position: "absolute",
              left: plate.x,
              top: 0,
              width: plate.width,
              height: plate.height,
              translate: `0 ${y}px`,
              overflow: "hidden",
              boxShadow: "0 8px 24px rgb(0 0 0 / 0.07)",
              filter:
                !scene.reducedMotion && plate.depth
                  ? `blur(${plate.depth}px)`
                  : undefined,
            }}
          >
            {contents[index]}
          </div>
        );
      })}
    </AbsoluteFill>
  );
}
