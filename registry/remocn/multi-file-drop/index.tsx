"use client";

import { loadFont as loadHanken } from "@remotion/google-fonts/HankenGrotesk";
import { loadFont as loadJetBrains } from "@remotion/google-fonts/JetBrainsMono";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { GradientParams } from "@/lib/remocn/gsh/gradient-engine";
import { GshGround } from "@/lib/remocn/gsh/gsh-ground";
import type { GshPresetId } from "@/lib/remocn/gsh/presets";

const hanken = loadHanken("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});
const mono = loadJetBrains("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

const ENTER = Easing.bezier(0.32, 0.72, 0, 1);
const EXIT = Easing.bezier(0.55, 0, 1, 0.45);
const MOVE = Easing.bezier(0.65, 0, 0.35, 1);
const SWAY = Easing.bezier(0.45, 0, 0.55, 1);
const HEAVY = { mass: 1, damping: 26, stiffness: 120 };
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };
const MORPH = { damping: 200 };

const B = {
  head: -12,
  card: -8,
  fly: 4,
  hover: 26,
  drop: 38,
  deal: 40,
  dealStep: 2,
  land: 10,
  resolve: [62, 74, 84, 92],
  cursorOut: 52,
  ready: 100,
  send: 112,
  leave: 122,
  end: 144,
};

export const MULTI_FILE_DROP_DURATION = B.end;

const ramp = (f: number, start: number, dur: number, easing = ENTER) =>
  interpolate(f, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

const mix = (a: number, b: number, t: number) => a + (b - a) * t;

export type DropFileKind = "image" | "sketch" | "doc" | "sheet";
export interface DropFile {
  name: string;
  kind: DropFileKind;
  src?: string;
  size?: string;
}

const DEFAULT_FILES: DropFile[] = [
  { name: "wireframe.png", kind: "sketch" },
  {
    name: "hero.jpg",
    kind: "image",
    src: staticFile("templates/launch-anything/desk.jpg"),
  },
  { name: "brief.pdf", kind: "doc", size: "412 KB" },
  { name: "pricing.csv", kind: "sheet", size: "18 KB" },
];

const FAN = [
  { x: -96, y: 18, r: -12 },
  { x: -34, y: -8, r: -4 },
  { x: 30, y: -2, r: 5 },
  { x: 92, y: 20, r: 12 },
];

function Progress({
  size,
  color,
  value,
}: {
  size: number;
  color: string;
  value: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      style={{ transform: "rotate(-90deg)" }}
      aria-hidden
    >
      <circle
        cx={12}
        cy={12}
        r={9}
        fill="none"
        stroke={color}
        strokeOpacity={0.25}
        strokeWidth={2}
      />
      <circle
        cx={12}
        cy={12}
        r={9}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeDasharray={`${Math.max(0.01, value) * 56.55} 60`}
      />
    </svg>
  );
}

function FileFace({
  file,
  w,
  h,
  idx,
}: {
  file: DropFile;
  w: number;
  h: number;
  idx: number;
}) {
  const m = Math.min(w, h);
  if (file.kind === "image") {
    return (
      <Img
        src={file.src ?? staticFile("templates/launch-anything/desk.jpg")}
        alt=""
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
    );
  }
  if (file.kind === "sketch") {
    const j = (k: string) => (random(`mfd-sk-${idx}-${k}`) - 0.5) * 3;
    const ln = (a: number, b: number, c: number, d: number, k: string) =>
      `M ${a + j(`${k}1`)} ${b + j(`${k}2`)} L ${c + j(`${k}3`)} ${d + j(`${k}4`)}`;
    const paths = [
      ln(10, 12, 90, 13, "a"),
      ln(90, 13, 89, 88, "b"),
      ln(89, 88, 11, 87, "c"),
      ln(11, 87, 10, 12, "d"),
      ln(18, 24, 50, 24, "e"),
      ln(18, 34, 82, 34, "f"),
      ln(82, 34, 82, 62, "g"),
      ln(82, 62, 18, 62, "h"),
      ln(18, 62, 18, 34, "i"),
      ln(18, 34, 82, 62, "k"),
      ln(18, 72, 60, 72, "l"),
      ln(18, 79, 44, 79, "n"),
    ];
    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, #f2f0ea 0%, #e6e3dc 100%)",
        }}
      >
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={{
            position: "absolute",
            inset: "6%",
            width: "88%",
            height: "88%",
          }}
          aria-hidden
        >
          {paths.map((d) => (
            <path
              key={d}
              d={d}
              fill="none"
              stroke="#33322e"
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
              strokeLinecap="round"
            />
          ))}
        </svg>
      </div>
    );
  }
  const sheet = file.kind === "sheet";
  const tag = sheet ? "#1f9d63" : "#e5484d";
  const ext = file.name.split(".").pop()?.toUpperCase() ?? "";
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "#ffffff",
        fontFamily: hanken.fontFamily,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "11%",
          top: "11%",
          width: m * 0.3,
          height: m * 0.3,
          borderRadius: m * 0.07,
          background: tag,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg viewBox="0 0 24 24" width={m * 0.19} height={m * 0.19} aria-hidden>
          <g
            fill="none"
            stroke="#ffffff"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {sheet ? (
              <path d="M4.5 4.5h15v15h-15zM4.5 9.5h15M4.5 14.5h15M10 9.5v10" />
            ) : (
              <>
                <path d="M6 2.8h7.6L18.5 7.7v13.5H6z" />
                <path d="M13.3 2.8v5.2h5.2M9 13h6M9 16.5h4" />
              </>
            )}
          </g>
        </svg>
      </div>
      <div
        style={{
          position: "absolute",
          left: "11%",
          right: "6%",
          bottom: "9%",
          lineHeight: 1.25,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        <div style={{ fontSize: m * 0.16, color: "#20232c" }}>{file.name}</div>
        <div
          style={{
            fontSize: m * 0.145,
            color: "rgba(32,35,44,0.55)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {file.size ? `${ext} · ${file.size}` : ext}
        </div>
      </div>
    </div>
  );
}

function Cursor({ size }: { size: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      style={{
        display: "block",
        filter: "drop-shadow(0 3px 5px rgba(0,0,0,0.35))",
      }}
      aria-hidden
    >
      <path
        d="M5 3.2v15.6l4.3-4.1 2.7 6.1 2.6-1.1-2.7-6h6z"
        fill="#0d0f10"
        stroke="#fff"
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
    </svg>
  );
}

export interface MultiFileDropProps {
  theme?: "dark" | "light";
  accent?: string;
  heading?: string;
  prompt?: string;
  files?: DropFile[];
  resolveOrder?: number[];
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

export function MultiFileDrop({
  theme = "dark",
  accent = "#3B5BFD",
  heading = "What are we launching?",
  prompt = "Build a launch page for v2 with a hero video, a pricing table and a waitlist.",
  files = DEFAULT_FILES,
  resolveOrder = [0, 2, 1, 3],
  ground,
  groundParams,
}: MultiFileDropProps) {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const dark = theme === "dark";
  const portrait = height > width * 1.2;
  const stageW = portrait ? 1080 : 1280;
  const stageH = portrait ? 1920 : 720;
  const sc = width / stageW;
  const u = portrait ? 2 : 1.1;

  const ink = dark ? "#eef0fa" : "#141722";
  const soft = dark ? "rgba(226,230,248,0.72)" : "rgba(20,23,34,0.7)";
  const muted = dark ? "rgba(226,230,248,0.46)" : "rgba(20,23,34,0.46)";
  const hair = dark ? "rgba(255,255,255,0.1)" : "rgba(20,24,48,0.1)";
  const slotBg = dark ? "rgba(255,255,255,0.05)" : "#f1f2f6";
  const surface = dark
    ? "linear-gradient(180deg, rgba(25,28,40,0.9) 0%, rgba(13,15,24,0.94) 100%)"
    : "linear-gradient(180deg, #ffffff 0%, #fafbfd 100%)";
  const ring = dark ? "rgba(255,255,255,0.09)" : "rgba(20,24,48,0.07)";
  const shadow = dark
    ? "inset 0 1px 0 rgba(255,255,255,0.05), 0 30px 70px rgba(2,4,24,0.55)"
    : "0 1px 2px rgba(40,40,110,0.06), 0 24px 60px rgba(40,40,110,0.14)";

  const n = Math.min(4, files.length);
  const list = files.slice(0, n);
  const order = resolveOrder.filter((k) => k < n);
  const resolveAt = (i: number) => {
    const k = order.indexOf(i);
    return B.resolve[k >= 0 ? k : i] ?? B.resolve[B.resolve.length - 1];
  };

  const pad = 22 * u;
  const fontSize = 24 * u;
  const lh = fontSize * 1.42;
  const textH = lh * 2;
  const footH = 40 * u;
  const slot = 100 * u;
  const slotGap = 12 * u;
  const cardW = portrait ? 960 : 900;
  const cardX = (stageW - cardW) / 2;
  const headSize = portrait ? 84 : 48;
  const headH = headSize * 1.2;
  const headGap = portrait ? 64 : 30;

  const grow = spring({
    frame: frame - B.deal,
    fps,
    config: MORPH,
    durationInFrames: 16,
  });
  const baseH = pad + textH + 18 * u + footH + pad;
  const cardH = baseH + grow * (slot + 16 * u);
  const groupH = headH + headGap + baseH + slot + 16 * u;
  const groupTop = (stageH - groupH) / 2 + (portrait ? 150 : 14);
  const cardTop =
    groupTop + headH + headGap + (1 - grow) * (slot + 16 * u) * 0.5;

  const headIn = ramp(frame, B.head, 15);
  const cardIn = spring({ frame: frame - B.card, fps, config: HEAVY });

  const fanW = 168 * u;
  const fanH = 128 * u;
  const hoverX = portrait ? cardX + cardW * 0.56 : cardX + cardW - fanW * 0.85;
  const hoverY = cardTop + (portrait ? baseH + fanH * 0.12 : baseH * 0.08);
  const startX = stageW + fanW * 0.9;
  const startY = portrait ? stageH + fanH * 0.4 : -fanH * 0.6;
  const ctrlX = mix(startX, hoverX, 0.35);
  const ctrlY = portrait ? hoverY + 240 : hoverY - 120;
  const bez = (t: number, a: number, c: number, b: number) =>
    (1 - t) * (1 - t) * a + 2 * (1 - t) * t * c + t * t * b;
  const flyAt = (f: number) =>
    spring({ frame: f - B.fly, fps, config: CARD, durationInFrames: 24 });
  const fp = flyAt(frame);
  const fpPrev = flyAt(frame - 1);
  const hoverAmt = ramp(frame, B.hover - 4, 10) * (1 - ramp(frame, B.drop, 4));
  const fanCx =
    bez(fp, startX, ctrlX, hoverX) +
    Math.sin((frame - B.hover) / 7) * 4 * u * hoverAmt;
  const fanCy =
    bez(fp, startY, ctrlY, hoverY) +
    Math.cos((frame - B.hover) / 9) * 4 * u * hoverAmt +
    10 * u * ramp(frame, B.drop - 3, 4, EXIT);
  const fanSpeed = Math.hypot(
    fanCx - bez(fpPrev, startX, ctrlX, hoverX),
    fanCy - bez(fpPrev, startY, ctrlY, hoverY),
  );
  const fanSpread =
    mix(0.35, 1, ramp(frame, B.fly + 6, 18)) *
    (1 - 0.25 * ramp(frame, B.drop - 3, 4, EXIT));
  const fanTilt = mix(14, 0, fp);
  const dropZone =
    ramp(frame, B.hover - 8, 10) * (1 - ramp(frame, B.deal, 8, EXIT));

  const slotX = (i: number) => cardX + pad + i * (slot + slotGap) + slot / 2;
  const slotY = cardTop + pad + slot / 2;

  const curDX = fanW * 0.42;
  const curDY = fanH * 0.38;
  const sendX = cardX + cardW - pad - 19 * u;
  const sendY = cardTop + cardH - pad - footH / 2;
  const curGo = spring({
    frame: frame - B.cursorOut,
    fps,
    config: HEAVY,
    durationInFrames: 36,
  });
  const curLeave = spring({ frame: frame - B.leave, fps, config: HEAVY });
  const curX = mix(fanCx + curDX, sendX + 6 * u, curGo) + curLeave * 70 * u;
  const curY =
    mix(fanCy + curDY, sendY + 8 * u, curGo) +
    curLeave * 46 * u -
    Math.sin(Math.PI * Math.min(1, curLeave)) * 10 * u;
  const sendPress = Math.max(
    0,
    spring({ frame: frame - B.send + 2, fps, config: CHIP }) -
      spring({ frame: frame - B.send - 2, fps, config: CHIP }),
  );
  const sent = ramp(frame, B.send + 1, 8);
  const badge =
    spring({ frame: frame - B.fly - 8, fps, config: CHIP }) *
    (1 - ramp(frame, B.drop - 2, 5, EXIT));
  const curPress =
    Math.max(
      0,
      spring({ frame: frame - B.drop + 3, fps, config: CHIP }) -
        spring({ frame: frame - B.drop - 1, fps, config: CHIP }),
    ) + sendPress;

  const resolvedCount = list.filter((_, i) => frame >= resolveAt(i) + 2).length;
  const ready = ramp(frame, B.ready, 8);
  const readyPop = spring({ frame: frame - B.ready, fps, config: CHIP });
  const push = 1 + 0.035 * ramp(frame, B.deal, B.end - B.deal, SWAY);
  const settle = spring({ frame: frame + 6, fps, config: HEAVY });
  const rotX = mix(14, 3, settle) - 2 * ramp(frame, B.deal, 40, MOVE);

  const resolvedGround: GshPresetId =
    ground ?? (dark ? "cobalt-rise" : "paper-crease");
  const resolvedParams = groundParams;

  return (
    <AbsoluteFill style={{ fontFamily: hanken.fontFamily, overflow: "hidden" }}>
      <GshGround
        preset={resolvedGround}
        params={resolvedParams}
        timeOffset={3}
        timeScale={0.5}
        style={portrait ? { transform: "scaleY(-1)" } : undefined}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: stageW,
          height: stageH,
          transform: `scale(${sc})`,
          transformOrigin: "0 0",
          perspective: 2200,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            transformStyle: "preserve-3d",
            transformOrigin: `${stageW / 2}px ${cardTop + cardH / 2}px`,
            transform: `scale(${push}) rotateX(${rotX}deg)`,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: groupTop,
              height: headH,
              overflow: "hidden",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: headSize,
                lineHeight: 1.2,
                fontWeight: 300,
                letterSpacing: "-0.035em",
                color: ink,
                transform: `translateY(${mix(100, 0, headIn)}%)`,
              }}
            >
              {heading}
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: cardX,
              top: cardTop,
              width: cardW,
              height: cardH,
              borderRadius: 20 * u,
              background: surface,
              boxShadow: `0 0 0 1px ${dropZone > 0 ? `color-mix(in oklab, ${accent} ${Math.round(dropZone * 85)}%, ${ring})` : ring}, 0 0 0 ${4 * u * dropZone}px color-mix(in oklab, ${accent} ${Math.round(dropZone * 20)}%, transparent), ${shadow}`,
              opacity: cardIn,
              transform: `translateY(${mix(40 * u, 0, cardIn)}px)`,
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 20 * u,
                background: `color-mix(in oklab, ${accent} ${Math.round(dropZone * (dark ? 14 : 8))}%, transparent)`,
              }}
            />
            {list.map((f, i) => (
              <div
                key={f.name}
                style={{
                  position: "absolute",
                  left: pad + i * (slot + slotGap),
                  top: pad,
                  width: slot,
                  height: slot,
                  borderRadius: 12 * u,
                  background: slotBg,
                  border: `1px dashed ${hair}`,
                  opacity:
                    grow * (1 - ramp(frame, B.deal + i * B.dealStep + 6, 4)),
                }}
              />
            ))}
            <div
              style={{
                position: "absolute",
                left: pad,
                right: pad,
                top: pad + grow * (slot + 16 * u),
                height: textH,
                fontSize,
                lineHeight: `${lh}px`,
                color: ink,
                overflow: "hidden",
              }}
            >
              {prompt}
            </div>
            <div
              style={{
                position: "absolute",
                left: pad,
                right: pad,
                bottom: pad,
                height: footH,
                display: "flex",
                alignItems: "center",
                gap: 10 * u,
                fontSize: 17 * u,
                color: soft,
              }}
            >
              <div
                style={{
                  height: footH,
                  padding: `0 ${14 * u}px`,
                  borderRadius: 99,
                  border: `1px solid ${hair}`,
                  display: "flex",
                  alignItems: "center",
                  gap: 8 * u,
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  width={18 * u}
                  height={18 * u}
                  aria-hidden
                >
                  <path
                    d="M16.5 7.5 9.4 14.6a1.8 1.8 0 0 0 2.6 2.6l7.4-7.4a3.6 3.6 0 0 0-5.1-5.1l-7.6 7.6a5.4 5.4 0 0 0 7.6 7.6l5.2-5.2"
                    fill="none"
                    stroke={soft}
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span style={{ fontVariantNumeric: "tabular-nums" }}>
                  {frame < B.deal
                    ? "Attach"
                    : resolvedCount < n
                      ? `Uploading ${resolvedCount}/${n}`
                      : `${n} files · 3.4 MB`}
                </span>
              </div>
              <div style={{ marginLeft: "auto" }}>Build</div>
              <svg
                viewBox="0 0 24 24"
                width={16 * u}
                height={16 * u}
                aria-hidden
              >
                <path
                  d="m7 10 5 5 5-5"
                  fill="none"
                  stroke={soft}
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <svg
                viewBox="0 0 24 24"
                width={20 * u}
                height={20 * u}
                aria-hidden
                style={{ marginLeft: 6 * u }}
              >
                <g
                  fill="none"
                  stroke={soft}
                  strokeWidth={1.5}
                  strokeLinecap="round"
                >
                  <rect x={9} y={3.5} width={6} height={11} rx={3} />
                  <path d="M6 11.5a6 6 0 0 0 12 0M12 17.5v3" />
                </g>
              </svg>
              <div
                style={{
                  width: 38 * u,
                  height: 38 * u,
                  borderRadius: 11 * u,
                  marginLeft: 4 * u,
                  background:
                    ready > 0
                      ? accent
                      : dark
                        ? "rgba(255,255,255,0.1)"
                        : "rgba(20,24,48,0.08)",
                  transform: `scale(${(1 + 0.06 * Math.sin(Math.PI * Math.min(1, readyPop)) * ready) * (1 - 0.04 * sendPress)})`,
                  boxShadow:
                    ready > 0
                      ? "inset 0 1px 0 rgba(255,255,255,0.22), 0 1px 2px rgba(4,6,30,0.3)"
                      : undefined,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  width={18 * u}
                  height={18 * u}
                  aria-hidden
                >
                  <path
                    d="M12 19V5M6 11l6-6 6 6"
                    fill="none"
                    stroke={ready > 0 ? "#fff" : muted}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={1 - sent}
                    transform={`translate(0 ${-4 * sent})`}
                  />
                  <rect
                    x={7.5}
                    y={7.5}
                    width={9}
                    height={9}
                    rx={2}
                    fill="#fff"
                    opacity={sent}
                    transform={`translate(12 12) scale(${mix(0.4, 1, sent)}) translate(-12 -12)`}
                  />
                </svg>
              </div>
            </div>
          </div>

          {list.map((f, i) => {
            const k = n - 1 - i;
            const fan = FAN[i] ?? FAN[0];
            const dealT = B.deal + k * B.dealStep;
            const go = spring({ frame: frame - dealT, fps, config: CARD });
            const goPrev = spring({
              frame: frame - dealT - 1,
              fps,
              config: CARD,
            });
            const fx = fanCx + fan.x * u * fanSpread;
            const fy = fanCy + fan.y * u * fanSpread;
            const x = mix(fx, slotX(i), go);
            const y = mix(fy, slotY, go);
            const px = mix(fx, slotX(i), goPrev);
            const py = mix(fy, slotY, goPrev);
            const vel = frame > dealT ? Math.hypot(x - px, y - py) : fanSpeed;
            const w = mix(fanW, slot, go);
            const h = mix(fanH, slot, go);
            const r = mix(fan.r * fanSpread + fanTilt, 0, go);
            const landed = ramp(frame, dealT + B.land - 4, 6);
            const rs = resolveAt(i);
            const done = ramp(frame, rs, 6);
            const pop = spring({ frame: frame - rs, fps, config: CHIP });
            const punch =
              1 + 0.07 * Math.sin(Math.PI * Math.min(1, pop)) * done;
            const loading = landed * (1 - done);
            const progress = interpolate(
              frame,
              [dealT + B.land - 4, rs],
              [0.06, 1],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: MOVE,
              },
            );
            const lift = 1 - go;
            return (
              <div
                key={f.name}
                style={{
                  position: "absolute",
                  left: x - w / 2,
                  top: y - h / 2,
                  width: w,
                  height: h,
                  transform: `rotate(${r}deg) scale(${punch})`,
                  borderRadius: mix(14, 12, go) * u,
                  overflow: "hidden",
                  outline: `1px solid ${dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
                  outlineOffset: -1,
                  background: slotBg,
                  boxShadow: `0 ${mix(2, 22, lift) * u}px ${mix(6, 40, lift) * u}px rgba(4,6,30,${dark ? 0.5 : 0.2})`,
                  opacity: ramp(frame, B.fly, 4),
                  filter:
                    vel > 8 ? `blur(${Math.min(5, vel * 0.05)}px)` : undefined,
                  zIndex: 10 + i,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    opacity: 1 - 0.78 * loading,
                    filter:
                      loading > 0.01
                        ? `blur(${loading * 6}px) saturate(${1 - loading * 0.6})`
                        : undefined,
                    transform: `scale(${1 + 0.08 * loading})`,
                  }}
                >
                  <FileFace file={f} w={w} h={h} idx={i} />
                </div>
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: loading,
                  }}
                >
                  <Progress
                    size={30 * u}
                    color={dark ? "#ffffff" : "#1a1f33"}
                    value={progress}
                  />
                </div>
              </div>
            );
          })}

          <div
            style={{
              position: "absolute",
              left: curX,
              top: curY,
              transform: `scale(${1 - 0.04 * curPress})`,
              transformOrigin: "4px 3px",
              opacity: ramp(frame, B.fly + 2, 6),
              zIndex: 30,
            }}
          >
            <Cursor size={30 * u} />
            <div
              style={{
                position: "absolute",
                left: 20 * u,
                top: 22 * u,
                minWidth: 26 * u,
                height: 26 * u,
                padding: `0 ${7 * u}px`,
                borderRadius: 99,
                background: accent,
                border: `${1.5 * u}px solid ${dark ? "#0d0f18" : "#ffffff"}`,
                color: "#fff",
                fontFamily: mono.fontFamily,
                fontSize: 16 * u,
                lineHeight: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 10px rgba(4,6,30,0.35)",
                transform: `scale(${badge})`,
              }}
            >
              {n}
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

export default MultiFileDrop;
