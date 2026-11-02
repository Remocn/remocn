import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

type SceneKind =
  | "shader-title"
  | "halftone"
  | "terminal"
  | "number"
  | "karaoke"
  | "vertical";

export type Scene = {
  index: number;
  block: string;
  kind: SceneKind;
  /**
   * Desktop placement inside the 1440px prompt stage, rotated around the
   * top-left corner. Right-side cards are anchored with `right` so they hug
   * the edge between 1280 and 1440 instead of overflowing.
   */
  float: {
    top: number;
    left?: number;
    right?: number;
    width: number;
    height: number;
    rotate: number;
  };
  /** Width in the mobile scroll row; scenes without it are desktop-only. */
  rowWidth?: number;
};

/** Ordered as the desktop paint order (later cards sit on top). */
export const SCENES: Scene[] = [
  {
    index: 1,
    block: "shader-liquid-metal",
    kind: "shader-title",
    float: { top: 50, left: 24, width: 290, height: 180, rotate: -7 },
    rowWidth: 180,
  },
  {
    index: 5,
    block: "caption-karaoke",
    kind: "karaoke",
    float: { top: 272, right: 22, width: 250, height: 170, rotate: -5 },
    rowWidth: 200,
  },
  {
    index: 2,
    block: "halftone-print",
    kind: "halftone",
    float: { top: 300, left: 190, width: 200, height: 200, rotate: 6 },
    rowWidth: 130,
  },
  {
    index: 3,
    block: "terminal-simulator",
    kind: "terminal",
    float: { top: 560, left: 30, width: 240, height: 150, rotate: -4 },
  },
  {
    index: 4,
    block: "rolling-number",
    kind: "number",
    float: { top: 0, right: 50, width: 220, height: 150, rotate: 7 },
  },
  {
    index: 6,
    block: "logo-enter",
    kind: "vertical",
    float: { top: 440, right: 312, width: 150, height: 250, rotate: 8 },
  },
];

/** Mobile row order: scene 1, 2, 5. */
export const ROW_SCENES = [1, 2, 5]
  .map((index) => SCENES.find((scene) => scene.index === index))
  .filter((scene): scene is Scene => Boolean(scene?.rowWidth));

const VIOLET = "url(/landing/shader-violet.png)";
const MAGENTA = "url(/landing/shader-magenta.png)";

const KIND_STYLE: Record<
  SceneKind,
  {
    float: string;
    row?: string;
    floatBg?: CSSProperties;
    rowBg?: CSSProperties;
  }
> = {
  "shader-title": {
    float:
      "justify-end gap-1 rounded-card px-[22px] py-5 shadow-[0_30px_60px_-20px_#3B076466]",
    row: "justify-between rounded-[18px] px-4 pt-3.5 pb-4 shadow-[0_20px_40px_-20px_#3B076466]",
    floatBg: {
      backgroundImage: `linear-gradient(180deg, #0A040E99 0%, #0A040E00 60%), ${VIOLET}`,
      backgroundPosition: "50%",
      backgroundSize: "cover",
    },
  },
  halftone: {
    float:
      "justify-end rounded-card px-[18px] py-4 shadow-[0_30px_60px_-20px_#83184366]",
    row: "justify-end rounded-[18px] p-3.5 shadow-[0_20px_40px_-20px_#83184366]",
    floatBg: {
      backgroundImage: MAGENTA,
      backgroundPosition: "40%",
      backgroundSize: "cover",
    },
    rowBg: {
      backgroundImage: `linear-gradient(0deg, #2A061899 0%, #2A061800 55%), ${MAGENTA}`,
      backgroundPosition: "50%, 40%",
      backgroundSize: "cover",
    },
  },
  terminal: {
    float:
      "justify-between rounded-[18px] bg-[#17191B] px-[18px] py-4 shadow-[0_30px_60px_-24px_#0E101266]",
  },
  number: {
    float:
      "justify-between rounded-[18px] bg-[#A800B7] px-[18px] py-4 shadow-[0_30px_60px_-20px_#A800B766]",
  },
  karaoke: {
    float:
      "justify-between rounded-card bg-[#0E1012] px-[22px] pt-[18px] pb-[22px] shadow-[0_30px_60px_-20px_#0E101266]",
    row: "justify-between rounded-[18px] bg-[#0E1012] px-4 pt-3.5 pb-4 shadow-[0_20px_40px_-20px_#0E101266]",
  },
  vertical: {
    float:
      "items-center justify-between rounded-[18px] bg-white px-3 py-4 shadow-[0_0_0_1px_#0E10120F,0_30px_60px_-20px_#0E101240]",
  },
};

type Variant = "float" | "row";

/**
 * A rendered "scene" the agent has composed. `float` is the rotated desktop
 * card scattered around the composer; `row` is the flat card in the mobile
 * horizontal row. Purely decorative.
 */
export function FloatingScene({
  scene,
  variant,
}: {
  scene: Scene;
  variant: Variant;
}) {
  const style = KIND_STYLE[scene.kind];

  if (variant === "row") {
    return (
      <div
        aria-hidden="true"
        className={cn(
          "flex h-[150px] shrink-0 flex-col overflow-clip",
          style.row,
        )}
        style={{
          width: scene.rowWidth,
          ...(style.rowBg ?? style.floatBg),
        }}
      >
        <SceneBody scene={scene} variant={variant} />
      </div>
    );
  }

  const { top, left, right, width, height, rotate } = scene.float;
  return (
    <div
      aria-hidden="true"
      className={cn(
        "absolute hidden origin-top-left flex-col overflow-clip xl:flex",
        style.float,
      )}
      style={{
        top,
        left,
        right,
        width,
        height,
        rotate: `${rotate}deg`,
        ...style.floatBg,
      }}
    >
      <SceneBody scene={scene} variant={variant} />
    </div>
  );
}

/** "scene 1 · block" on desktop, "Scene 1" over a mono block name on mobile. */
function SceneTag({
  scene,
  variant,
  className,
}: {
  scene: Scene;
  variant: Variant;
  className: string;
}) {
  if (variant === "row") {
    return (
      <div className={`flex flex-col gap-0.5 ${className}`}>
        <span className="text-caption">Scene {scene.index}</span>
        <span className="w-max font-mono text-mono">{scene.block}</span>
      </div>
    );
  }
  return (
    <div className={`text-micro ${className}`}>
      scene {scene.index} · <span className="font-mono">{scene.block}</span>
    </div>
  );
}

function SceneBody({ scene, variant }: { scene: Scene; variant: Variant }) {
  const row = variant === "row";

  switch (scene.kind) {
    case "shader-title":
      return (
        <>
          <SceneTag
            scene={scene}
            variant={variant}
            className="text-[#F5D0FE]"
          />
          <div
            className={cn(
              "font-medium tracking-[-0.05em] text-white",
              row ? "text-[24px] leading-[26px]" : "text-[30px] leading-8",
            )}
          >
            Ship it on Tuesday.
          </div>
        </>
      );
    case "halftone":
      return (
        <SceneTag scene={scene} variant={variant} className="text-white" />
      );
    case "terminal":
      return (
        <>
          <div className="flex flex-col gap-[5px] font-mono text-micro">
            <span className="text-[#9AA3A7]">$ acme deploy --prod</span>
            <span className="text-success-soft">✓ live at acme.dev</span>
          </div>
          <SceneTag
            scene={scene}
            variant={variant}
            className="text-dark-muted"
          />
        </>
      );
    case "number":
      return (
        <>
          <SceneTag
            scene={scene}
            variant={variant}
            className="text-[#F5D0FE]"
          />
          <div className="text-[52px] leading-[52px] font-medium tracking-[-0.06em] text-white">
            2,418
          </div>
        </>
      );
    case "karaoke":
      return (
        <>
          <SceneTag
            scene={scene}
            variant={variant}
            className="text-[#9AA3A7]"
          />
          <KaraokeLine compact={row} />
        </>
      );
    case "vertical":
      return (
        <>
          <div className="text-[10px] leading-[13px] text-[#6B7A80]">
            scene {scene.index} · 9:16
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-[22px] shrink-0 rounded-[7px] bg-[url(/landing/shader-magenta.png)] bg-cover bg-[position:30%]" />
            <span className="text-[22px] leading-6 font-semibold tracking-[-0.05em] text-[#0E1012]">
              acme
            </span>
          </div>
          <div className="font-mono text-[10px] leading-[13px] text-[#6B7A80]">
            {scene.block}
          </div>
        </>
      );
  }
}

function KaraokeLine({ compact }: { compact: boolean }) {
  const word = cn(
    "font-semibold tracking-[-0.03em]",
    compact ? "text-[20px] leading-[26px]" : "text-[24px] leading-[30px]",
  );
  const dim = cn(word, "text-white/35");
  return (
    <div
      className={cn(
        "flex flex-wrap items-center",
        compact ? "gap-1" : "gap-1.5",
      )}
    >
      <span className={dim}>one prompt,</span>
      <span
        className={cn(
          word,
          "bg-[#F0ABFC] text-[#0E1012]",
          compact ? "rounded-[7px] px-1.5" : "rounded-tile px-2",
        )}
      >
        one
      </span>
      <span className={dim}>afternoon</span>
    </div>
  );
}
