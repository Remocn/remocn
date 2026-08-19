"use client";

import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import { type RefObject, useEffect, useRef, useState } from "react";

const REST_MAX_WIDTH = 1120;
const REST_WIDTH_RATIO = 0.92;
const CARD_ASPECT = 9 / 16;
const REST_RADIUS = 24;
const GROW_END = 0.28;
const HOLD_END = 0.72;
const SCRUB_MIN_WIDTH = 1024;

type Viewport = { w: number; h: number };

export function HeroScrollVideo() {
  const sectionRef = useRef<HTMLElement>(null);
  const [viewport, setViewport] = useState<Viewport | null>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const update = () =>
      setViewport({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  if (reduceMotion) {
    return <StaticCard />;
  }

  const isNarrow = viewport !== null && viewport.w < SCRUB_MIN_WIDTH;
  const isWide = viewport !== null && !isNarrow;

  return (
    <>
      <div className="lg:hidden">
        {(viewport === null || isNarrow) && <StaticCard />}
      </div>
      <section
        ref={sectionRef}
        data-hero-zoom
        className="relative hidden h-[380vh] lg:block"
      >
        <div className="sticky top-0 flex h-screen w-full items-center justify-center overflow-hidden">
          {isWide ? (
            <ScrollStage sectionRef={sectionRef} viewport={viewport} />
          ) : (
            <div className="w-[min(92vw,1120px)]">
              <VideoCard className="aspect-video rounded-3xl border border-border" />
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function StaticCard() {
  return (
    <div className="section">
      <div className="relative mt-8 flex w-full justify-center sm:mt-12">
        <div className="w-full max-w-[1120px]">
          <VideoCard className="aspect-video rounded-2xl sm:rounded-3xl" />
        </div>
      </div>
    </div>
  );
}

function ScrollStage({
  sectionRef,
  viewport,
}: {
  sectionRef: RefObject<HTMLElement | null>;
  viewport: Viewport;
}) {
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  const restWidth = Math.min(viewport.w * REST_WIDTH_RATIO, REST_MAX_WIDTH);
  const restHeight = restWidth * CARD_ASPECT;
  const cover = Math.max(viewport.w / restWidth, viewport.h / restHeight);
  const keyframes = [0, GROW_END, HOLD_END, 1];

  const scale = useTransform(scrollYProgress, keyframes, [1, cover, cover, 1]);
  const borderRadius = useTransform(scrollYProgress, keyframes, [
    REST_RADIUS,
    0,
    0,
    REST_RADIUS,
  ]);
  const frameOpacity = useTransform(scrollYProgress, keyframes, [1, 0, 0, 1]);

  return (
    <motion.div
      style={{ width: restWidth, height: restHeight, scale, borderRadius }}
      className="relative overflow-hidden will-change-transform"
    >
      <VideoCard className="h-full w-full" />
      <motion.div
        aria-hidden
        style={{ borderRadius, opacity: frameOpacity }}
        className="pointer-events-none absolute inset-0 border border-border"
      />
    </motion.div>
  );
}

function VideoCard({ className }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden ${className ?? ""}`}>
      <video
        src="https://cdn.remocn.dev/videos/hero-crt.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster="/hero-crt-poster.jpg"
        className="block h-full w-full object-cover"
      />
    </div>
  );
}
