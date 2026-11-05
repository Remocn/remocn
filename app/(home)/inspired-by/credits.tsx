"use client";

import { useReducedMotion } from "motion/react";
import {
  type CSSProperties,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";
import { type CreditsConfig, orderedHandles, seeded } from "./credits-config";

/**
 * End credits for the people remocn learned from, in the site theme. The
 * constraints are the film roller's: one size, one center axis (avatar on
 * the left of it, handle on the right), hierarchy by spacing alone, a slate
 * up front and an end card at the close.
 */
export function Credits({
  config,
  handles,
}: {
  config: CreditsConfig;
  handles: readonly string[];
}) {
  const reduced = useReducedMotion();
  const mode = reduced ? "static" : config.mode;
  const gate = useRef<HTMLDivElement>(null);
  useFilmGate(gate, config, !reduced);

  const names = orderedHandles(handles, config);

  return (
    <div
      className={cn(
        "relative w-full text-foreground",
        config.font === "mono" && "font-mono",
        mode === "static" ? "py-24 md:py-32" : "h-[min(88svh,960px)]",
      )}
    >
      <div ref={gate} className="h-full w-full will-change-transform">
        {mode === "roller" && <Roller config={config} names={names} />}
        {mode === "cards" && <Cards config={config} names={names} />}
        {mode === "static" && <Reel config={config} names={names} />}
      </div>
    </div>
  );
}

/**
 * Gate weave and flicker: the whole frame jitters a fraction of a pixel and
 * breathes in brightness at 24 fps, the way a print sits in a projector gate.
 * Every frame's offsets come from the seed, so the motion replays exactly.
 */
function useFilmGate(
  ref: RefObject<HTMLDivElement | null>,
  { seed, weave, flicker }: CreditsConfig,
  enabled: boolean,
) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!enabled || (weave === 0 && flicker === 0)) {
      el.style.transform = "";
      el.style.opacity = "";
      return;
    }
    let raf = 0;
    let last = -1;
    const tick = (now: number) => {
      const frame = Math.floor(now / (1000 / 24));
      if (frame !== last) {
        last = frame;
        const random = seeded(seed * 7919 + frame);
        const x = (random() - 0.5) * 2 * weave;
        const y = (random() - 0.5) * 2 * weave;
        el.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px)`;
        el.style.opacity = (1 - random() * flicker).toFixed(3);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      el.style.transform = "";
      el.style.opacity = "";
    };
  }, [ref, seed, weave, flicker, enabled]);
}

function textStyle(config: CreditsConfig): CSSProperties {
  return {
    fontSize: config.fontSize,
    lineHeight: 1.3,
    letterSpacing: `${config.tracking}em`,
    textTransform: config.uppercase ? "uppercase" : undefined,
  };
}

function Card({ text, config }: { text: string; config: CreditsConfig }) {
  return (
    <p className="text-center" style={textStyle(config)}>
      {text}
    </p>
  );
}

function CreditRow({
  handle,
  config,
  hidden,
}: {
  handle: string;
  config: CreditsConfig;
  hidden?: boolean;
}) {
  return (
    <li>
      <a
        href={`https://x.com/${handle}`}
        target="_blank"
        rel="noreferrer"
        tabIndex={hidden ? -1 : undefined}
        className="group pointer-events-none grid grid-cols-2 items-center rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        style={
          {
            columnGap: config.gutter * 2,
            "--mute": config.mute,
            "--dim": config.dim,
          } as CSSProperties
        }
      >
        {/* biome-ignore lint/performance/noImgElement: unavatar proxies arbitrary X avatars */}
        <img
          src={`https://unavatar.io/x/${handle}`}
          alt=""
          width={config.avatar}
          height={config.avatar}
          loading="lazy"
          className="pointer-events-auto justify-self-end rounded-full bg-muted object-cover transition-[filter] duration-200 [filter:grayscale(var(--mute))] group-hover:[filter:none] group-focus-visible:[filter:none]"
          style={{ width: config.avatar, height: config.avatar }}
        />
        <span
          className="pointer-events-auto justify-self-start opacity-[var(--dim)] transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100"
          style={textStyle(config)}
        >
          @{handle}
        </span>
      </a>
    </li>
  );
}

function CreditList({
  names,
  config,
  hidden,
}: {
  names: string[];
  config: CreditsConfig;
  hidden?: boolean;
}) {
  return (
    <ul className="flex flex-col" style={{ gap: config.rowGap }}>
      {names.map((handle) => (
        <CreditRow
          key={handle}
          handle={handle}
          config={config}
          hidden={hidden}
        />
      ))}
    </ul>
  );
}

/** One full pass: slate, every name, end card. */
function Reel({
  names,
  config,
  hidden,
  style,
}: {
  names: string[];
  config: CreditsConfig;
  hidden?: boolean;
  style?: CSSProperties;
}) {
  return (
    <div
      aria-hidden={hidden || undefined}
      className="flex flex-col"
      style={{ gap: config.blockGap, ...style }}
    >
      <Card text={config.slate} config={config} />
      <CreditList names={names} config={config} hidden={hidden} />
      <Card text={config.endCard} config={config} />
    </div>
  );
}

/**
 * The crawl: two copies of the reel scroll up at a constant speed and wrap
 * seamlessly. Hovering or focusing a name holds the frame.
 */
function Roller({ names, config }: { names: string[]; config: CreditsConfig }) {
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const animation = useRef<Animation | null>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const el = viewport.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setHeight(el.clientHeight));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const pad = (config.loopGap * height) / 2;

  // biome-ignore lint/correctness/useExhaustiveDependencies: re-measure whenever the reel's layout can change
  useEffect(() => {
    const el = track.current;
    const copy = el?.firstElementChild as HTMLElement | null;
    if (!el || !copy || height === 0) return;
    const distance = copy.offsetHeight;
    const run = el.animate(
      [
        { transform: "translateY(0)" },
        { transform: `translateY(${-distance}px)` },
      ],
      {
        duration: (distance / config.speed) * 1000,
        iterations: Number.POSITIVE_INFINITY,
      },
    );
    animation.current = run;
    return () => run.cancel();
  }, [config, names, height, pad]);

  useEffect(() => {
    const el = viewport.current;
    if (!el) return;
    // Only a name holds the crawl: the row's link spans the full width to keep
    // the axis centered, so its empty sides pass the pointer through and the
    // pause keys off the avatar and handle alone.
    const sync = (event: Event) => {
      const onName = (event.target as Element | null)?.closest?.("a");
      if (onName) animation.current?.pause();
      else animation.current?.play();
    };
    const play = () => animation.current?.play();
    const events = [
      ["pointerover", sync],
      ["pointerleave", play],
      ["focusin", sync],
      ["focusout", play],
    ] as const;
    for (const [type, listener] of events) el.addEventListener(type, listener);
    return () => {
      for (const [type, listener] of events) {
        el.removeEventListener(type, listener);
      }
    };
  }, []);

  return (
    <div
      ref={viewport}
      className="relative h-full overflow-hidden mask-[linear-gradient(to_bottom,transparent,#000_14%,#000_86%,transparent)]"
    >
      <div ref={track} className="will-change-transform">
        <Reel
          names={names}
          config={config}
          style={{ paddingTop: pad, paddingBottom: pad }}
        />
        <Reel
          names={names}
          config={config}
          hidden
          style={{ paddingTop: pad, paddingBottom: pad }}
        />
      </div>
    </div>
  );
}

/** Title cards: the slate, then names a few at a time, then the end card. */
function Cards({ names, config }: { names: string[]; config: CreditsConfig }) {
  const groups: string[][] = [];
  for (let i = 0; i < names.length; i += config.perCard) {
    groups.push(names.slice(i, i + config.perCard));
  }
  const count = groups.length + 2;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setIndex((current) => (current + 1) % count),
      config.hold * 1000,
    );
    return () => clearInterval(id);
  }, [count, config.hold]);

  const shown = index % count;
  const frames = [
    <Card key="slate" text={config.slate} config={config} />,
    ...groups.map((group, i) => (
      <CreditList
        key={group.join()}
        names={group}
        config={config}
        hidden={shown !== i + 1}
      />
    )),
    <Card key="end" text={config.endCard} config={config} />,
  ];

  return (
    <div className="relative h-full">
      <p className="sr-only">
        {config.slate}: {names.map((handle) => `@${handle}`).join(", ")}
      </p>
      {frames.map((frame, i) => (
        <div
          key={frame.key}
          aria-hidden={shown !== i || undefined}
          className={cn(
            "absolute inset-0 flex items-center justify-center transition-opacity ease-in-out",
            shown === i ? "opacity-100" : "pointer-events-none opacity-0",
          )}
          style={{ transitionDuration: `${config.fade}ms` }}
        >
          <div className="w-full">{frame}</div>
        </div>
      ))}
    </div>
  );
}
