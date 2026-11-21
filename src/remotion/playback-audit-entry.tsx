// The page `scripts/audit-playback.mts` opens in Chrome: one preview in the
// site's player, and `window.__measure(seconds)` that plays it and reports
// what each screen refresh showed. `?name=…&fps=60&width=960`, with
// `drive=raf` to step a frame per refresh (the cost of drawing, free of the
// player's clock) or `drive=player` to let the player keep time.
import { Player, type PlayerRef } from "@remotion/player";
import { type ComponentType, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { getDefaults, resolveConfig, toProps } from "@/lib/customizer-config";
import registry from "@/registry/__index__";

const q = new URLSearchParams(location.search);
const name = q.get("name") ?? "";
// The rate to play at; a template that already runs at it is left alone.
const TARGET = Number(q.get("fps") ?? 60);
// `props={"grain":false}`: on top of the preview's defaults, to test a cause.
const OVERRIDES = JSON.parse(q.get("props") ?? "{}") as Record<string, unknown>;
const width = Number(q.get("width") ?? 960);

type Loaded = {
  Component: ComponentType<Record<string, unknown>>;
  props: Record<string, unknown>;
  fps: number;
  frames: number;
  w: number;
  h: number;
};

const Empty = () => <div style={{ color: "white" }}>empty</div>;

async function load(): Promise<Loaded> {
  if (name === "__empty")
    return {
      Component: Empty,
      props: {},
      fps: 30,
      frames: 150,
      w: 1280,
      h: 720,
    };
  const entry = (
    registry as Record<
      string,
      {
        load: () => Promise<{
          default: ComponentType<Record<string, unknown>>;
        }>;
        loadConfig: () => Promise<never>;
      }
    >
  )[name];
  const [m, config] = await Promise.all([entry.load(), entry.loadConfig()]);
  const { controls } = resolveConfig(name, config);
  const values = getDefaults(controls);
  const c = config as {
    fps: number;
    durationInFrames: number;
    getDurationInFrames?: (v: Record<string, unknown>) => number;
    compositionWidth: number;
    compositionHeight: number;
  };
  return {
    Component: m.default,
    props: { ...toProps(controls, values), ...OVERRIDES },
    fps: c.fps,
    frames: c.getDurationInFrames?.(values) ?? c.durationInFrames,
    w: c.compositionWidth,
    h: c.compositionHeight,
  };
}

function App() {
  const [loaded, setLoaded] = useState<Loaded>();
  const K = loaded ? Math.max(1, Math.round(TARGET / loaded.fps)) : 1;
  const ref = useRef<PlayerRef>(null);
  useEffect(() => {
    load().then(setLoaded, (error) => {
      (window as { __error?: string }).__error = String(error);
    });
  }, []);
  useEffect(() => {
    if (!loaded) return;
    const w = window as unknown as {
      __ready?: boolean;
      __measure?: (seconds: number) => Promise<unknown>;
    };
    w.__measure = async (seconds: number) => {
      const player = ref.current;
      if (!player) return { error: "no player" };
      let updates = 0;
      const onFrame = () => {
        updates += 1;
      };
      player.addEventListener("frameupdate", onFrame);
      // `drive=raf`: the page steps the player itself, from the refresh
      // timestamps, in place of the player's own clock.
      const drive = q.get("drive") === "raf";
      let t0 = -1;
      if (drive) player.pause();
      const stamps: number[] = [];
      // The frame on screen at every refresh: a refresh that shows the frame
      // of the one before is a hold, a step over a frame is a skip.
      const seen: number[] = [];
      let run = true;
      const total = Math.round(loaded.frames * K);
      const tick = (t: number) => {
        stamps.push(t);
        if (drive) {
          if (t0 < 0) t0 = t;
          // Half a refresh ahead, so a frame boundary never lands on a
          // refresh: there the rounding would be decided by timer noise.
          const n = stamps.length;
          const dt = n > 3 ? (stamps[n - 1] - stamps[n - 4]) / 3 : 1000 / 60;
          const rate = (loaded.fps * K) / 1000;
          const f = Math.floor((t - t0) * rate + 0.5 * dt * rate) % total;
          player.seekTo(f);
          seen.push(f);
        } else seen.push(player.getCurrentFrame());
        if (run) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      await new Promise((r) => setTimeout(r, seconds * 1000));
      run = false;
      player.removeEventListener("frameupdate", onFrame);
      const gaps = stamps.slice(1).map((t, i) => t - stamps[i]);
      const sorted = [...gaps].sort((a, b) => a - b);
      const span = (stamps.at(-1) ?? 0) - (stamps[0] ?? 0);
      let holds = 0;
      let skips = 0;
      // How many refreshes each frame stayed up: `runs[2]` counts the frames
      // shown for exactly two. An even cadence has one length only.
      const runs: Record<number, number> = {};
      let length = 1;
      for (let i = 1; i < seen.length; i += 1) {
        const step = seen[i] - seen[i - 1];
        if (step === 0) {
          holds += 1;
          length += 1;
        } else {
          if (step > 1) skips += step - 1;
          runs[Math.min(length, 4)] = (runs[Math.min(length, 4)] ?? 0) + 1;
          length = 1;
        }
      }
      // The screen's own interval: the shortest gaps, not the median, which
      // doubles once a scene settles into every other refresh.
      const step = sorted[Math.floor(sorted.length * 0.05)] ?? 16.7;
      // A gap of two refresh intervals is one refresh that showed nothing new.
      let missed = 0;
      let stalls = 0;
      for (const g of gaps) {
        const over = Math.round(g / step) - 1;
        if (over > 0) {
          missed += over;
          stalls += 1;
        }
      }
      return {
        missed,
        stalls,
        refresh: step,
        holds,
        skips,
        runs1: runs[1] ?? 0,
        runs2: runs[2] ?? 0,
        runs3: runs[3] ?? 0,
        runs4: runs[4] ?? 0,
        fps: loaded.fps * K,
        seconds: span / 1000,
        updates,
        raf: gaps.length,
        median: sorted[Math.floor(sorted.length / 2)] ?? 0,
        p95: sorted[Math.floor(sorted.length * 0.95)] ?? 0,
        max: sorted.at(-1) ?? 0,
        over20: gaps.filter((g) => g > 20).length,
        over34: gaps.filter((g) => g > 34).length,
      };
    };
    (window as unknown as { __length?: number }).__length =
      loaded.frames / loaded.fps;
    w.__ready = true;
  }, [loaded, K]);
  if (!loaded) return null;
  return (
    <Player
      ref={ref}
      component={loaded.Component}
      inputProps={loaded.props}
      durationInFrames={Math.round(loaded.frames * K)}
      fps={loaded.fps * K}
      compositionWidth={loaded.w}
      compositionHeight={loaded.h}
      style={{ width, height: (width * loaded.h) / loaded.w }}
      autoPlay
      loop
      acknowledgeRemotionLicense
    />
  );
}

const el = document.getElementById("root");
if (el) createRoot(el).render(<App />);
