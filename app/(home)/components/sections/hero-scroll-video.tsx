"use client";

import { Pause, Play } from "lucide-react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import {
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

const REST_MAX_WIDTH = 1120;
const REST_WIDTH_RATIO = 0.92;
const CARD_ASPECT = 9 / 16;
const REST_RADIUS = 24;
const GROW_END = 0.28;
const HOLD_END = 0.72;

type Viewport = { w: number; h: number };

export function HeroScrollVideo() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);
  const [viewport, setViewport] = useState<Viewport | null>(null);
  const reduceMotion = useReducedMotion();

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      void v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  }, []);

  useEffect(() => {
    const update = () =>
      setViewport({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  if (reduceMotion || !viewport) {
    return (
      <div className="section">
        <div className="relative mt-10 flex w-full justify-center sm:mt-12">
          <div className="w-full max-w-[1120px]">
            <VideoCard
              videoRef={videoRef}
              playing={playing}
              onToggle={togglePlay}
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
      playing={playing}
      onToggle={togglePlay}
    />
  );
}

function ScrollStage({
  sectionRef,
  videoRef,
  viewport,
  playing,
  onToggle,
}: {
  sectionRef: RefObject<HTMLDivElement | null>;
  videoRef: RefObject<HTMLVideoElement | null>;
  viewport: Viewport;
  playing: boolean;
  onToggle: () => void;
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
          <VideoCard
            videoRef={videoRef}
            playing={playing}
            onToggle={onToggle}
            className="h-full w-full"
          />
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
  playing,
  onToggle,
  className,
}: {
  videoRef: RefObject<HTMLVideoElement | null>;
  playing: boolean;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <div className={`group relative overflow-hidden ${className ?? ""}`}>
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
      <button
        type="button"
        onClick={onToggle}
        aria-label={playing ? "Pause preview" : "Play preview"}
        className="absolute inset-0 flex items-center justify-center bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        <span
          aria-hidden
          data-show={!playing}
          className="pointer-events-none flex size-14 items-center justify-center rounded-full bg-background/70 text-foreground opacity-0 backdrop-blur-md transition-opacity duration-200 group-hover:opacity-100 motion-reduce:transition-none data-[show=true]:opacity-100"
        >
          {playing ? (
            <Pause className="size-5" />
          ) : (
            <Play className="size-5 translate-x-0.5" />
          )}
        </span>
      </button>
    </div>
  );
}
