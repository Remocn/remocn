import type { SceneProps } from "../content";
import { fitSize, mix, motion, progress, useSceneTime } from "../motion";
import { EditingPreview, PreviewTile } from "../previews";
import { CornerLabel, Stage } from "../shared";

export function GalleryScene(props: SceneProps) {
  const { content, theme } = props;
  const t = useSceneTime();
  const spread = progress(t, 0.06, 0.7, motion.uiApproach);
  const exit = progress(t, 3.48, 0.52, motion.camera);
  const positions = [
    [190, 350, -5],
    [1020, 320, 5],
    [160, 710, 3],
    [1080, 715, -4],
  ];
  return (
    <Stage theme={theme} light>
      <CornerLabel theme={theme} light>
        {content.productName} / The building blocks
      </CornerLabel>
      <div
        style={{
          position: "absolute",
          left: 220,
          top: 184,
          fontSize: fitSize(content.galleryTitle, 88, 1480),
          letterSpacing: "-0.055em",
          opacity: 1 - exit,
        }}
      >
        {content.galleryTitle}
      </div>
      {positions.map(([x, y, rotation], i) => {
        const p =
          i === 0
            ? spread
            : progress(t, 0.15 + i * 0.08, 0.75, motion.uiApproach);
        return (
          <div key={i} style={{ opacity: i === 0 ? 1 : p * (1 - exit) }}>
            <PreviewTile
              {...props}
              kind={i}
              time={t}
              x={mix(mix(220, x, p), 980, exit)}
              y={mix(mix(466, y, p), 305, exit)}
              width={mix(mix(1480, 690, p), 800, exit)}
              height={mix(mix(414, 295, p), 600, exit)}
              rotate={mix(rotation * p, 0, exit)}
              startAt={i === 0 ? -1.65 : i * 0.08}
            />
            <div
              style={{
                position: "absolute",
                left: x + 20,
                top: y - 42,
                fontSize: 19,
                fontWeight: 500,
                opacity: p * (1 - exit),
                letterSpacing: "0.04em",
              }}
            >
              {content.featureLabels[i]}
            </div>
          </div>
        );
      })}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: theme.ink,
          opacity: exit,
        }}
      />
      <EditingPreview {...props} opacity={exit} />
    </Stage>
  );
}
