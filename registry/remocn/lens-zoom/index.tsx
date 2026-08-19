"use client";

import type {
  TransitionPresentation,
  TransitionPresentationComponentProps,
} from "@remotion/transitions";
import type { ReactNode } from "react";
import { useId } from "react";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

export const LENS_ZOOM_DURATION_IN_FRAMES = 28;

export const SHAKE_STOPS = [-9 / 11, -3 / 11, 4 / 11, 8 / 11] as const;

export const LENS_ZOOM_EASE_IN = Easing.bezier(0.54, 0, 0.82, 0.8);
export const LENS_ZOOM_EASE_OUT = Easing.bezier(0.18, 0.2, 0.46, 1);

export type LensZoomProps = {
  inScaleFrom?: number;
  inScaleTo?: number;
  inFovFrom?: number;
  inFovTo?: number;
  inBlurFrom?: number;
  inBlurTo?: number;
  inRotationFrom?: number;
  inRotationTo?: number;
  outScaleFrom?: number;
  outScaleTo?: number;
  outFovFrom?: number;
  outFovTo?: number;
  outBlurFrom?: number;
  outBlurTo?: number;
  outRotationFrom?: number;
  outRotationTo?: number;
  anticipateScale?: number;
  anticipatePortion?: number;
  lensSteps?: number;
  blurSamples?: number;
  blurScaleGain?: number;
  blurFade?: number;
  shakeAmount?: number;
  shakeFrequency?: number;
  shakeCyclesPerUnit?: number;
  shakeTranslatePx?: number;
  shakeRotateDeg?: number;
  redScale?: number;
  greenScale?: number;
  blueScale?: number;
  letterboxAspect?: number;
  width?: number;
  height?: number;
  distortionCenterX?: number;
  distortionCenterY?: number;
};

function hashed(seed: number, i: number): number {
  let t = Math.imul(i ^ seed, 0x27d4eb2d);
  t ^= t >>> 15;
  t = Math.imul(t, 0x85ebca6b);
  t ^= t >>> 13;
  return ((t >>> 0) / 4294967296) * 2 - 1;
}

function valueNoise(seed: number, t: number): number {
  const i = Math.floor(t);
  const f = t - i;
  const u = f * f * (3 - 2 * f);
  return hashed(seed, i) * (1 - u) + hashed(seed, i + 1) * u;
}

function fovHalf(fov: number): number {
  return (Math.min(fov, 178) / 2) * (Math.PI / 180);
}

function lensMagnification(r: number, fov: number): number {
  if (fov < 0.01) return 1;
  const theta = fovHalf(fov);
  const peak = Math.tan(theta) / theta;
  if (r <= 0) return peak;
  const a = r * theta;
  if (a >= Math.PI / 2 - 1e-3) return 1;
  const rSource = Math.tan(a) / Math.tan(theta);
  if (rSource <= 1e-6) return peak;
  return Math.max(1, r / rSource);
}

function radiusForMagnification(target: number, fov: number): number {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (lensMagnification(mid, fov) > target) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

function ringClip(
  rInner: number,
  rOuter: number | null,
  w: number,
  h: number,
  cx: number,
  cy: number,
): string {
  const circle = (r: number, clockwise: boolean) => {
    const s = clockwise ? 1 : 0;
    return `M ${cx + r} ${cy} A ${r} ${r} 0 1 ${s} ${cx - r} ${cy} A ${r} ${r} 0 1 ${s} ${cx + r} ${cy} Z`;
  };
  const outer =
    rOuter === null
      ? `M 0 0 L ${w} 0 L ${w} ${h} L 0 ${h} Z`
      : circle(rOuter, true);
  return rInner > 0 ? `${outer} ${circle(rInner, false)}` : outer;
}

type HalfProps = {
  scene: ReactNode;
  scale: number;
  fov: number;
  blur: number;
  rotation: number;
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  lensSteps: number;
  blurSamples: number;
  blurScaleGain: number;
  blurFade: number;
};

function TransitionHalf({
  scene,
  scale,
  fov,
  blur,
  rotation,
  centerX,
  centerY,
  width,
  height,
  lensSteps,
  blurSamples,
  blurScaleGain,
  blurFade,
}: HalfProps) {
  const origin = `${centerX}px ${centerY}px`;
  const base = scale / 100;

  const peak = lensMagnification(0, fov);
  const steps = peak <= 1.001 ? 0 : lensSteps;
  const rings = Array.from({ length: steps }, (_, i) => {
    const s = 1 + ((peak - 1) * (i + 0.5)) / steps;
    return { s, r: radiusForMagnification(s, fov) };
  });

  const samples =
    blur <= 0.05 ? 1 : Math.max(2, Math.round((blurSamples * blur) / 60));
  const weights = Array.from(
    { length: samples },
    (_, j) => (1 - j / samples) ** blurFade,
  );

  const groups: {
    key: number;
    alpha: number;
    copies: { key: string; clip: string; k: number }[];
  }[] = [];
  let running = 0;
  for (let j = samples - 1; j >= 0; j--) {
    running += weights[j];
    const g =
      samples === 1
        ? 1
        : 1 + (blur / 100) * blurScaleGain * (j / (samples - 1));
    const halfWidth = (width / 2) * g;
    const copies: { key: string; clip: string; k: number }[] = [];

    copies.push({
      key: "base",
      clip: ringClip(
        rings.length ? rings[0].r * halfWidth : 0,
        null,
        width,
        height,
        centerX,
        centerY,
      ),
      k: g * base,
    });

    for (let i = 0; i < rings.length; i++) {
      const inner = i + 1 < rings.length ? rings[i + 1].r * halfWidth : 0;
      copies.push({
        key: `${i}`,
        clip: ringClip(
          inner,
          rings[i].r * halfWidth,
          width,
          height,
          centerX,
          centerY,
        ),
        k: g * rings[i].s * base,
      });
    }

    groups.push({ key: j, alpha: weights[j] / running, copies });
  }

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {groups.map(({ key, alpha, copies }) => (
        <div
          key={key}
          style={{ position: "absolute", inset: 0, opacity: alpha }}
        >
          {copies.map(({ key: ck, clip, k }) => (
            <div
              key={ck}
              style={{
                position: "absolute",
                inset: 0,
                clipPath: `path("${clip}")`,
                transform: `rotate(${rotation}deg) scale(${k})`,
                transformOrigin: origin,
              }}
            >
              {scene}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

interface LensZoomStageProps extends HalfProps {
  shakeEnvelope: number;
  shakeFrequency: number;
  shakeCyclesPerUnit: number;
  shakeTranslatePx: number;
  shakeRotateDeg: number;
  redScale: number;
  greenScale: number;
  blueScale: number;
  letterboxAspect: number;
}

function LensZoomStage({
  shakeEnvelope,
  shakeFrequency,
  shakeCyclesPerUnit,
  shakeTranslatePx,
  shakeRotateDeg,
  redScale,
  greenScale,
  blueScale,
  letterboxAspect,
  ...half
}: LensZoomStageProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const filterId = useId();
  const { width, height, centerX, centerY } = half;

  const core = <TransitionHalf {...half} />;

  const split = redScale !== greenScale || blueScale !== greenScale;
  const channels: { id: string; scale: number; matrix: string }[] = [
    {
      id: "r",
      scale: redScale,
      matrix: "1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0",
    },
    {
      id: "g",
      scale: greenScale,
      matrix: "0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0",
    },
    {
      id: "b",
      scale: blueScale,
      matrix: "0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0",
    },
  ];

  const composited = split ? (
    <div style={{ position: "absolute", inset: 0, backgroundColor: "#000000" }}>
      {channels.map((c) => (
        <div
          key={c.id}
          style={{
            position: "absolute",
            inset: 0,
            mixBlendMode: "screen",
            filter: `url(#${filterId}-${c.id})`,
            transform: `scale(${c.scale})`,
            transformOrigin: `${centerX}px ${centerY}px`,
          }}
        >
          {core}
        </div>
      ))}
    </div>
  ) : (
    core
  );

  const t = (frame / fps) * shakeFrequency * shakeCyclesPerUnit;
  const octave = (seed: number) =>
    valueNoise(seed, t) + 0.45 * valueNoise(seed + 977, t * 2.6);
  const shakeX = octave(11) * shakeTranslatePx * shakeEnvelope;
  const shakeY = octave(23) * shakeTranslatePx * shakeEnvelope;
  const shakeR = octave(41) * shakeRotateDeg * shakeEnvelope;

  const barHeight =
    letterboxAspect > 0
      ? Math.max(0, (height - width / letterboxAspect) / 2)
      : 0;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        width,
        height,
        overflow: "hidden",
        backgroundColor: "#000000",
      }}
    >
      {split ? (
        <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
          <defs>
            {channels.map((c) => (
              <filter
                key={c.id}
                id={`${filterId}-${c.id}`}
                colorInterpolationFilters="sRGB"
              >
                <feColorMatrix type="matrix" values={c.matrix} />
              </filter>
            ))}
          </defs>
        </svg>
      ) : null}

      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translate(${shakeX}px, ${shakeY}px) rotate(${shakeR}deg)`,
          transformOrigin: `${centerX}px ${centerY}px`,
        }}
      >
        {composited}
      </div>

      {barHeight > 0 ? (
        <>
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              height: barHeight,
              backgroundColor: "#000000",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: barHeight,
              backgroundColor: "#000000",
            }}
          />
        </>
      ) : null}
    </div>
  );
}

const LensZoomPresentation: React.FC<
  TransitionPresentationComponentProps<LensZoomProps>
> = ({
  children,
  presentationDirection,
  presentationProgress,
  passedProps,
}) => {
  const config = useVideoConfig();
  const {
    inScaleFrom = 100,
    inScaleTo = 150,
    inFovFrom = 0,
    inFovTo = 160,
    inBlurFrom = 0,
    inBlurTo = 60,
    inRotationFrom = 0,
    inRotationTo = -15,

    outScaleFrom = 135,
    outScaleTo = 100,
    outFovFrom = 135,
    outFovTo = 0,
    outBlurFrom = 45,
    outBlurTo = 0,
    outRotationFrom = 345,
    outRotationTo = 360,

    anticipateScale = 100,
    anticipatePortion = 0.35,

    lensSteps = 9,
    blurSamples = 7,
    blurScaleGain = 1,
    blurFade = 1.5,

    shakeAmount = 50,
    shakeFrequency = 1.4,
    shakeCyclesPerUnit = 8,
    shakeTranslatePx = 73,
    shakeRotateDeg = 1.1,

    redScale = 1.01,
    greenScale = 1.0,
    blueScale = 0.99,

    letterboxAspect = 0,

    width = config.width,
    height = config.height,
    distortionCenterX = width / 2,
    distortionCenterY = height / 2,
  } = passedProps;

  const exiting = presentationDirection === "exiting";

  if (exiting ? presentationProgress >= 0.5 : presentationProgress < 0.5)
    return null;

  const p = exiting
    ? interpolate(presentationProgress, [0, 0.5], [0, 1], {
        easing: LENS_ZOOM_EASE_IN,
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : interpolate(presentationProgress, [0.5, 1], [0, 1], {
        easing: LENS_ZOOM_EASE_OUT,
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });

  const anticipating =
    exiting && anticipatePortion > 0 && anticipateScale < inScaleFrom;

  const pFx =
    anticipating && exiting
      ? interpolate(p, [anticipatePortion, 1], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : p;

  const lerp = (from: number, to: number) => from + (to - from) * pFx;

  const exitScale = anticipating
    ? interpolate(
        p,
        [0, anticipatePortion, 1],
        [inScaleFrom, anticipateScale, inScaleTo],
        {
          easing: Easing.inOut(Easing.ease),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        },
      )
    : lerp(inScaleFrom, inScaleTo);

  const shakeEnvelope =
    interpolate(
      presentationProgress,
      SHAKE_STOPS.map((s) => 0.5 + s / 2),
      [0, shakeAmount, shakeAmount, 0],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
    ) / 100;

  return (
    <LensZoomStage
      scene={children}
      scale={exiting ? exitScale : lerp(outScaleFrom, outScaleTo)}
      fov={exiting ? lerp(inFovFrom, inFovTo) : lerp(outFovFrom, outFovTo)}
      blur={exiting ? lerp(inBlurFrom, inBlurTo) : lerp(outBlurFrom, outBlurTo)}
      rotation={
        exiting
          ? lerp(inRotationFrom, inRotationTo)
          : lerp(outRotationFrom, outRotationTo)
      }
      centerX={distortionCenterX}
      centerY={distortionCenterY}
      width={width}
      height={height}
      lensSteps={lensSteps}
      blurSamples={blurSamples}
      blurScaleGain={blurScaleGain}
      blurFade={blurFade}
      shakeEnvelope={shakeEnvelope}
      shakeFrequency={shakeFrequency}
      shakeCyclesPerUnit={shakeCyclesPerUnit}
      shakeTranslatePx={shakeTranslatePx}
      shakeRotateDeg={shakeRotateDeg}
      redScale={redScale}
      greenScale={greenScale}
      blueScale={blueScale}
      letterboxAspect={letterboxAspect}
    />
  );
};

export function lensZoom(
  props: LensZoomProps = {},
): TransitionPresentation<LensZoomProps> {
  return {
    component: LensZoomPresentation,
    props,
  };
}
