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
  const sectionRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [viewport, setViewport] = useState<Viewport | null>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const update = () =>
      setViewport({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const scrubEnabled = viewport !== null && viewport.w >= SCRUB_MIN_WIDTH;

  if (reduceMotion || !viewport || !scrubEnabled) {
    return (
      <div className="section">
        <div className="relative mt-8 flex w-full justify-center sm:mt-12">
          <div className="w-full max-w-[1120px]">
            <VideoCard
              videoRef={videoRef}
              className="aspect-video rounded-2xl sm:rounded-3xl"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <ScrollStage
      sectionRef={sectionRef}
      videoRef={videoRef}
      viewport={viewport}
    />
  );
}

function ScrollStage({
  sectionRef,
  videoRef,
  viewport,
}: {
  sectionRef: RefObject<HTMLDivElement | null>;
  videoRef: RefObject<HTMLVideoElement | null>;
  viewport: Viewport;
}) {
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  const restWidth = Math.min(viewport.w * REST_WIDTH_RATIO, REST_MAX_WIDTH);
  const restHeight = restWidth * CARD_ASPECT;
  const restScaleX = restWidth / viewport.w;
  const restScaleY = restHeight / viewport.h;
  const keyframes = [0, GROW_END, HOLD_END, 1];

  const scaleX = useTransform(scrollYProgress, keyframes, [
    restScaleX,
    1,
    1,
    restScaleX,
  ]);
  const scaleY = useTransform(scrollYProgress, keyframes, [
    restScaleY,
    1,
    1,
    restScaleY,
  ]);
  const borderRadius = useTransform(scrollYProgress, keyframes, [
    REST_RADIUS,
    0,
    0,
    REST_RADIUS,
  ]);
  const frameOpacity = useTransform(scrollYProgress, keyframes, [1, 0, 0, 1]);

  return (
    <section ref={sectionRef} data-hero-zoom className="relative h-[380vh]">
      <div className="sticky top-0 flex h-screen w-full items-center justify-center overflow-hidden">
        <motion.div
          style={{
            width: viewport.w,
            height: viewport.h,
            scaleX,
            scaleY,
            borderRadius,
          }}
          className="group relative overflow-hidden will-change-transform"
        >
          <VideoCard videoRef={videoRef} className="h-full w-full" />
          <motion.div
            aria-hidden
            style={{ borderRadius, opacity: frameOpacity }}
            className="pointer-events-none absolute inset-0 border border-border"
          />
        </motion.div>
      </div>
    </section>
  );
}

function VideoCard({
  videoRef,
  className,
}: {
  videoRef: RefObject<HTMLVideoElement | null>;
  className?: string;
}) {
  return (
    <div className={`relative overflow-hidden ${className ?? ""}`}>
      <video
        ref={videoRef}
        src="/introducing-remocn.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster="/introducing-remocn-poster.jpg"
        className="block h-full w-full object-cover"
      />
    </div>
  );
}
