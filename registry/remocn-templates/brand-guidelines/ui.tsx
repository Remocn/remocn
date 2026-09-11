import type { CSSProperties } from "react";
import { Img, Interactive, useRemotionEnvironment } from "remotion";
import type { BrandGuidelinesScene } from "./content";

export function BrandImage({
  src,
  style,
}: {
  src: string;
  style: CSSProperties;
}) {
  // Studio 4.0.513 can loop while registering nested, moving Img layers.
  // Keep the preview static; exports and embedded Players retain Img's load gate.
  const { isStudio, isRendering } = useRemotionEnvironment();
  if (isStudio && !isRendering) {
    // biome-ignore lint/performance/noImgElement: Studio-only workaround for nested media registration; exports use Remotion Img below.
    return <img src={src} alt="" style={style} />;
  }
  return <Img src={src} style={style} />;
}

/** An original architectural monogram: a slab and two quarter-circle modules. */
export function FormStudyMark({
  scene,
  color,
  size = 100,
}: {
  scene: BrandGuidelinesScene;
  color: string;
  size?: number;
}) {
  if (scene.logoSrc)
    return (
      <BrandImage
        src={scene.logoSrc}
        style={{ width: size, height: size, objectFit: "contain" }}
      />
    );
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      fill={color}
      role="img"
      aria-label={`${scene.content.brandName} mark`}
    >
      <rect x="9" y="7" width="25" height="86" />
      <path d="M42 7h49v9c0 18-14 32-32 32H42Z" />
      <path d="M42 56h36v5c0 17-13 30-30 30h-6Z" />
    </svg>
  );
}

export function Label({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: CSSProperties;
}) {
  return (
    <Interactive.Div
      name="Identity label"
      style={{
        fontFamily: '"Inter", sans-serif',
        fontSize: 13,
        fontWeight: 400,
        lineHeight: 1.25,
        ...style,
      }}
    >
      {children}
    </Interactive.Div>
  );
}
