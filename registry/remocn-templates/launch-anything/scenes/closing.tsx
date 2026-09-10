import type { SceneProps } from "../content";
import { clamp, smooth, tween } from "../motion";
import { BrandMark, Center, Title } from "../ui";

export function Address({ scene, t }: SceneProps) {
  const url = scene.brandUrl;
  const prefixLength = url
    .toLowerCase()
    .startsWith(scene.content.launch.toLowerCase())
    ? scene.content.launch.length
    : 0;
  const typing = clamp((t - 21.94) / 0.59);
  const text = url.slice(
    0,
    prefixLength + Math.floor((url.length - prefixLength) * typing),
  );
  const glow = tween(t, 22.15, 22.45) * (1 - tween(t, 22.6, 23.25));
  return (
    <Center style={{ background: "#000", color: "#fff9f3" }}>
      <Title
        text={text}
        size={tween(t, 21.55, 21.9, 43, 32, smooth)}
        style={{
          fontWeight: 400,
          letterSpacing: "-0.06em",
          color: glow > 0.5 ? "#b2e3ff" : "#fff9f3",
          textShadow: `0 0 ${glow * 5}px #fff, 0 0 ${glow * 20}px #245afb, 0 0 ${glow * 32}px #3352d3`,
        }}
      />
    </Center>
  );
}

export function ClosingMark({ scene, t }: SceneProps) {
  return (
    <Center
      style={{
        background: "linear-gradient(#faf9fe,#fefefe)",
        color: "#030202",
      }}
    >
      <div
        style={{
          transform: `scale(${tween(t, 23.717, 26.666, 1, 0.63, smooth)})`,
        }}
      >
        <BrandMark size={64} src={scene.logoSrc} />
      </div>
    </Center>
  );
}
