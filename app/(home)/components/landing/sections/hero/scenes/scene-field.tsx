"use client";

import {
  AnimatePresence,
  type MotionValue,
  motion,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import { type Ref, useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { SCENES, type Scene } from "../floating-scene";
import { publishComposed, useComposerSignal } from "./composer-signal";
import {
  type ScenesConfig,
  SLOT_DEPTH,
  SLOT_ORDER,
  type SwapTransition,
  VIDEO_FRAME,
} from "./config";
import { runDitherSweep } from "./dither-sweep";
import type { SceneSet } from "./sets/types";

const SWAP_EASE = [0.7, 0, 0.2, 1] as const;

function swapVariants(transition: Exclude<SwapTransition, "dither">) {
  switch (transition) {
    case "whip":
      return {
        initial: { x: "105%", filter: "blur(8px)" },
        animate: { x: "0%", filter: "blur(0px)" },
        exit: { x: "-105%", filter: "blur(8px)" },
      };
    case "zoom":
      return {
        initial: { scale: 0.86, opacity: 0, filter: "blur(10px)" },
        animate: { scale: 1, opacity: 1, filter: "blur(0px)" },
        exit: { scale: 1.14, opacity: 0, filter: "blur(10px)" },
      };
    case "flip":
      return {
        initial: { rotateY: -90 },
        animate: { rotateY: 0 },
        exit: { rotateY: 90 },
      };
    case "cut":
      return { initial: {}, animate: {}, exit: {} };
  }
}

const HIDDEN_MASK = {
  maskImage: "linear-gradient(#0000, #0000)",
  WebkitMaskImage: "linear-gradient(#0000, #0000)",
};

/**
 * `shown` is on top (masked while the dither sweep hasn't revealed it yet),
 * `previous` stays under it until the sweep ends, `standby` is mounted ahead of
 * its turn but hidden and paused.
 */
type LayerRole = "shown" | "previous" | "standby";

const LAYER_Z: Record<LayerRole, number> = {
  shown: 2,
  previous: 1,
  standby: 0,
};

function SceneLayer({
  set,
  scenario,
  slot,
  cycle,
  speed,
  layerRef,
  role = "shown",
  hidden,
}: {
  set: SceneSet;
  scenario: number;
  slot: number;
  cycle: number;
  speed: number;
  layerRef?: Ref<HTMLDivElement>;
  role?: LayerRole;
  hidden?: boolean;
}) {
  const scene = set[scenario][slot];
  return (
    <div
      ref={layerRef}
      className={cn("absolute inset-0", scene.surface)}
      style={{
        zIndex: LAYER_Z[role],
        visibility: role === "standby" ? "hidden" : undefined,
        ...(hidden ? HIDDEN_MASK : undefined),
      }}
    >
      {scene.render({ cycle, speed }, role !== "standby")}
    </div>
  );
}

const whenIdle = (run: () => void) => {
  if ("requestIdleCallback" in window) {
    const id = window.requestIdleCallback(run, { timeout: 3000 });
    return () => window.cancelIdleCallback(id);
  }
  const id = setTimeout(run, 500);
  return () => clearTimeout(id);
};

function SceneCard({
  slot,
  order,
  scenario,
  config,
  set,
  active,
  pointerX,
  pointerY,
  onComposed,
}: {
  slot: Scene;
  order: number;
  scenario: number;
  config: ScenesConfig;
  set: SceneSet;
  active: boolean;
  pointerX: MotionValue<number>;
  pointerY: MotionValue<number>;
  onComposed: (order: number) => void;
}) {
  const reduced = useReducedMotion() ?? false;
  const depth = 1 - (1 - SLOT_DEPTH[slot.index]) * config.frame.depthSpread;
  const parallaxX = useTransform(
    pointerX,
    (v) => v * config.frame.parallax * depth,
  );
  const parallaxY = useTransform(
    pointerY,
    (v) => v * config.frame.parallax * depth * 0.6,
  );
  const target = config.swap.mode === "sync" ? scenario : 0;
  const [shown, setShown] = useState(target);
  const [previous, setPrevious] = useState<number | null>(null);
  // Scenarios whose layer is mounted. Each one stays mounted once it's in:
  // remounting a live scene on every swap meant rebuilding its players and
  // recompiling shader programs, a multi-frame freeze each time.
  const [warm, setWarm] = useState<number[]>(() => [target]);
  const [cycle, setCycle] = useState(0);
  const [previousCycle, setPreviousCycle] = useState(0);
  const cycleRef = useRef(0);
  cycleRef.current = cycle;
  const cardRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const incomingRef = useRef<HTMLDivElement>(null);
  const { top, left, right, rotate } = slot.float;
  const { width, height } = VIDEO_FRAME[slot.index] ?? slot.float;
  const { duration, stagger, transition, cell, band, passes } = config.swap;
  const { speed, loopGap } = config.play;
  const dither = transition === "dither" && !reduced;
  const scene = set[shown][slot.index];
  const dotTone = scene.dark ? "#F0ABFC" : "#A800B7";

  useEffect(() => {
    if (target === shown) return;
    const swap = setTimeout(() => {
      setWarm((list) => (list.includes(target) ? list : [...list, target]));
      setPrevious(shown);
      setPreviousCycle(cycleRef.current);
      setShown(target);
      setCycle(0);
    }, order * stagger);
    return () => clearTimeout(swap);
  }, [target, shown, order, stagger]);

  useEffect(() => {
    if (previous === null) return;
    const finish = () => {
      setPrevious(null);
      onComposed(order);
    };
    if (!dither) {
      const done = setTimeout(finish, 500);
      return () => clearTimeout(done);
    }
    const canvas = canvasRef.current;
    const layer = incomingRef.current;
    if (!canvas || !layer) {
      finish();
      return;
    }
    return runDitherSweep({
      canvas,
      layer,
      width,
      height,
      cell,
      band,
      passes,
      duration,
      color: dotTone,
      onDone: finish,
    });
  }, [
    previous,
    dither,
    width,
    height,
    cell,
    band,
    passes,
    duration,
    dotTone,
    order,
    onComposed,
  ]);

  // Mount the next scenario's layer while idle, ahead of its swap.
  const upcoming = (shown + 1) % set.length;
  const needsWarm = dither && previous === null && !warm.includes(upcoming);
  useEffect(() => {
    if (!needsWarm) return;
    return whenIdle(() =>
      setWarm((list) => (list.includes(upcoming) ? list : [...list, upcoming])),
    );
  }, [needsWarm, upcoming]);

  useEffect(() => {
    const node = cardRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([e]) =>
      setVisible(e.isIntersecting),
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (reduced || !visible) return;
    const period = (scene.duration / speed + loopGap) * 1000;
    const id = setInterval(() => setCycle((c) => c + 1), period);
    return () => clearInterval(id);
  }, [reduced, visible, scene, speed, loopGap]);

  const swapping = previous !== null;
  return (
    <div
      ref={cardRef}
      aria-hidden="true"
      className="absolute hidden origin-top-left xl:block"
      style={{ top, left, right, width, height, rotate: `${rotate}deg` }}
    >
      <motion.div
        className="size-full"
        style={reduced ? undefined : { x: parallaxX, y: parallaxY }}
      >
        <div
          data-loop
          className="size-full"
          style={
            reduced || config.frame.float === 0
              ? undefined
              : {
                  ["--float-amp" as string]: `${config.frame.float * depth}px`,
                  ["--float-tilt" as string]: `${config.frame.floatTilt}deg`,
                  // Periods differ per card so the field never moves in step.
                  animation: `scene-float ${config.frame.floatPeriod * (1 + (order % 3) * 0.13)}s ease-in-out infinite`,
                  animationDelay: `-${(order / SLOT_ORDER.length) * config.frame.floatPeriod}s`,
                }
          }
        >
          <motion.div
            animate={{ opacity: active ? 1 : 1 - config.swap.dim }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="relative size-full overflow-hidden rounded-[10px] shadow-[0_0_0_1px_#0E10120A,0_14px_28px_-8px_#0E10121F,0_32px_64px_-24px_#0E101229] [perspective:800px]"
          >
            {dither || reduced ? (
              <>
                {(dither ? warm : [shown]).map((layerScenario) => {
                  const role: LayerRole =
                    layerScenario === shown
                      ? "shown"
                      : layerScenario === previous
                        ? "previous"
                        : "standby";
                  return (
                    <SceneLayer
                      key={`${config.swap.set}-${layerScenario}`}
                      set={set}
                      scenario={layerScenario}
                      slot={slot.index}
                      cycle={role === "previous" ? previousCycle : cycle}
                      speed={speed}
                      role={role}
                      layerRef={role === "shown" ? incomingRef : undefined}
                      hidden={swapping && role === "shown" && dither}
                    />
                  );
                })}
                <canvas
                  ref={canvasRef}
                  className="pointer-events-none absolute inset-0 z-[3] size-full"
                />
              </>
            ) : (
              <AnimatePresence
                initial={false}
                mode={transition === "flip" ? "wait" : "sync"}
              >
                <motion.div
                  key={shown}
                  {...swapVariants(
                    transition === "dither" ? "cut" : transition,
                  )}
                  transition={{
                    duration: transition === "flip" ? 0.28 : 0.5,
                    ease: SWAP_EASE,
                  }}
                  className="absolute inset-0"
                >
                  <SceneLayer
                    set={set}
                    scenario={shown}
                    slot={slot.index}
                    cycle={cycle}
                    speed={speed}
                  />
                </motion.div>
              </AnimatePresence>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

export function SceneField({
  config,
  set,
  pinned,
}: {
  config: ScenesConfig;
  set: SceneSet;
  pinned?: number;
}) {
  const signal = useComposerSignal();
  const scenario = pinned ?? signal.scenario;
  const [activeOrder, setActiveOrder] = useState(SLOT_ORDER.length - 1);
  const rawX = useSpringPointer();

  const firstScenario = useRef(scenario);
  useEffect(() => {
    if (config.swap.mode !== "sync") return;
    if (scenario === firstScenario.current) return;
    firstScenario.current = -1;
    publishComposed(0);
  }, [scenario, config.swap.mode]);

  const onComposed = useCallback((order: number) => {
    setActiveOrder(order);
    publishComposed(order + 1);
  }, []);

  return (
    <>
      {SCENES.map((slot) => {
        const order = SLOT_ORDER.indexOf(slot.index);
        return (
          <SceneCard
            key={slot.index}
            slot={slot}
            order={order}
            scenario={scenario}
            config={config}
            set={set}
            active={config.swap.mode !== "sync" || order === activeOrder}
            pointerX={rawX.x}
            pointerY={rawX.y}
            onComposed={onComposed}
          />
        );
      })}
    </>
  );
}

function useSpringPointer() {
  const x = useSpring(0, { stiffness: 60, damping: 18, mass: 0.8 });
  const y = useSpring(0, { stiffness: 60, damping: 18, mass: 0.8 });
  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      x.set((event.clientX / window.innerWidth) * 2 - 1);
      y.set((event.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [x, y]);
  return { x, y };
}
