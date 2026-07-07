"use client";

import { Player, type PlayerRef } from "@remotion/player";
import { motion } from "motion/react";
import {
  type KeyboardEvent,
  type PointerEvent,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { SPRING_SOFT } from "@/config/site";
import { useTrackEvent } from "@/lib/analytics";
import { TYPEWRITER_DEFAULTS } from "@/lib/config/snippets";
import registry from "@/registry/__index__";
import { FadeUp } from "../fade-up";
import { SectionHeading } from "../section-heading";
import { SYNTAX_DARK, TypewriterCodeBlock } from "../typewriter-code-block";
import { useAutoplay } from "../use-autoplay";

const COMPONENT = "typewriter";

const CHIP =
  "rounded-[5px] bg-white/[0.07] px-1 align-baseline outline-none ring-1 ring-transparent transition-colors hover:bg-white/[0.12] focus-visible:bg-white/[0.12] focus-visible:ring-white/30";

const EDIT_INPUT =
  "rounded-[5px] bg-white/[0.12] px-1 align-baseline outline-none ring-1 ring-white/30";

/** Horizontal-drag number, with click-to-type and keyboard nudge. */
function DraggableNumber({
  value,
  onChange,
  min,
  max,
  step = 1,
  pxPerStep = 6,
  label,
}: {
  value: number;
  onChange: (next: number) => void;
  min: number;
  max: number;
  step?: number;
  pxPerStep?: number;
  label: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const drag = useRef<{
    startX: number;
    startVal: number;
    moved: boolean;
  } | null>(null);

  const clamp = useCallback(
    (n: number) => Math.min(max, Math.max(min, n)),
    [min, max],
  );

  const onPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    if (editing) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { startX: e.clientX, startVal: value, moved: false };
  };

  const onPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    if (Math.abs(dx) > 3) d.moved = true;
    const next = clamp(d.startVal + Math.round(dx / pxPerStep) * step);
    if (next !== value) onChange(next);
  };

  const onPointerUp = (e: PointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    drag.current = null;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    if (d && !d.moved) {
      setDraft(String(value));
      setEditing(true);
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowUp" || e.key === "ArrowRight") {
      e.preventDefault();
      onChange(clamp(value + step));
    } else if (e.key === "ArrowDown" || e.key === "ArrowLeft") {
      e.preventDefault();
      onChange(clamp(value - step));
    } else if (e.key === "Enter") {
      e.preventDefault();
      setDraft(String(value));
      setEditing(true);
    }
  };

  const commit = () => {
    const parsed = Number(draft);
    if (Number.isFinite(parsed)) onChange(clamp(parsed));
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        // biome-ignore lint/a11y/noAutofocus: focus follows an explicit click-to-edit
        autoFocus
        type="text"
        inputMode="numeric"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") setEditing(false);
        }}
        style={{
          color: SYNTAX_DARK.number,
          width: `${Math.max(draft.length, 1)}ch`,
        }}
        className={EDIT_INPUT}
      />
    );
  }

  return (
    <button
      type="button"
      aria-label={`${label}: ${value}. Drag or use arrow keys to change.`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onKeyDown={onKeyDown}
      style={{ color: SYNTAX_DARK.number, touchAction: "none" }}
      className={`${CHIP} cursor-ew-resize select-none`}
    >
      {value}
    </button>
  );
}

/** Quoted string value that becomes an inline input on click. */
function EditableString({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const commit = () => {
    onChange(draft);
    setEditing(false);
  };

  if (editing) {
    return (
      <span style={{ color: SYNTAX_DARK.string }}>
        "
        <input
          // biome-ignore lint/a11y/noAutofocus: focus follows an explicit click-to-edit
          autoFocus
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") setEditing(false);
          }}
          style={{
            color: SYNTAX_DARK.string,
            width: `${Math.max(draft.length, 1)}ch`,
          }}
          className={EDIT_INPUT}
        />
        "
      </span>
    );
  }

  return (
    <button
      type="button"
      aria-label="Edit text"
      onClick={() => {
        setDraft(value);
        setEditing(true);
      }}
      style={{ color: SYNTAX_DARK.string }}
      className={`${CHIP} cursor-text`}
    >
      "{value}"
    </button>
  );
}

/** Color swatch + hex that opens the native color picker on click. */
function ColorValue({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <span
      style={{ color: SYNTAX_DARK.string }}
      className={`${CHIP} relative inline-flex cursor-pointer items-center gap-1.5`}
    >
      <span
        aria-hidden
        className="size-2.5 rounded-full ring-1 ring-white/20"
        style={{ backgroundColor: value }}
      />
      "{value.toUpperCase()}"
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Text color"
        className="absolute inset-0 cursor-pointer opacity-0"
      />
    </span>
  );
}

/** Boolean literal that toggles on click / Enter / Space. */
function ToggleBool({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      aria-label="Toggle cursor"
      aria-pressed={value}
      onClick={() => onChange(!value)}
      style={{ color: SYNTAX_DARK.boolean }}
      className={`${CHIP} cursor-pointer select-none`}
    >
      {String(value)}
    </button>
  );
}

export function InteractiveCode() {
  const entry = registry[COMPONENT];
  const playerRef = useRef<PlayerRef>(null);

  const { containerRef } = useAutoplay(playerRef, Boolean(entry));

  const [text, setText] = useState(TYPEWRITER_DEFAULTS.text);
  const [fontSize, setFontSize] = useState(TYPEWRITER_DEFAULTS.fontSize);
  const [color, setColor] = useState(TYPEWRITER_DEFAULTS.color);
  const [fontWeight, setFontWeight] = useState(TYPEWRITER_DEFAULTS.fontWeight);
  const [cursor, setCursor] = useState(TYPEWRITER_DEFAULTS.cursor);

  const trackEvent = useTrackEvent();
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const track = useCallback(
    (prop: string) => {
      const existing = timers.current.get(prop);
      if (existing) clearTimeout(existing);
      timers.current.set(
        prop,
        setTimeout(() => {
          trackEvent("component_customized", { component: COMPONENT, prop });
          timers.current.delete(prop);
        }, 500),
      );
    },
    [trackEvent],
  );

  const set =
    <T,>(setter: (v: T) => void, prop: string) =>
    (v: T) => {
      setter(v);
      track(prop);
    };

  const inputProps = useMemo(
    () => ({ text, fontSize, color, cursorColor: color, fontWeight, cursor }),
    [text, fontSize, color, fontWeight, cursor],
  );

  const aspectRatio = entry
    ? `${entry.config.compositionWidth} / ${entry.config.compositionHeight}`
    : "16 / 9";

  return (
    <section id="showcase" className="relative py-20 sm:py-20">
      <div className="section">
        <SectionHeading
          eyebrow="It's just props"
          title="Tweak it live"
          lead="Every component is plain React driven by the Remotion API. Drag a number, click a color — the props are the controls, and the frame re-renders instantly."
        />

        <FadeUp delay={0.1}>
          <div className="mt-12 grid items-stretch gap-6 sm:mt-16 lg:grid-cols-2">
            {/* Interactive code editor — the JSX values are the controls. */}
            <TypewriterCodeBlock
              theme="dark"
              text={
                <EditableString value={text} onChange={set(setText, "text")} />
              }
              fontSize={
                <DraggableNumber
                  value={fontSize}
                  onChange={set(setFontSize, "fontSize")}
                  min={48}
                  max={160}
                  step={1}
                  pxPerStep={4}
                  label="Font size"
                />
              }
              color={
                <ColorValue value={color} onChange={set(setColor, "color")} />
              }
              fontWeight={
                <DraggableNumber
                  value={fontWeight}
                  onChange={set(setFontWeight, "fontWeight")}
                  min={100}
                  max={900}
                  step={100}
                  pxPerStep={10}
                  label="Font weight"
                />
              }
              cursor={
                <ToggleBool
                  value={cursor}
                  onChange={set(setCursor, "cursor")}
                />
              }
              footer={
                <span className="font-mono text-xs text-white/30">
                  Drag or click values to edit
                </span>
              }
            />

            {/* Live preview — the real registry Typewriter. */}
            <motion.div
              whileHover={{ y: -4 }}
              transition={SPRING_SOFT}
              className="relative flex items-center justify-center overflow-hidden rounded-2xl bg-white shadow-2xl shadow-black/5 ring-1 ring-black/5 sm:rounded-3xl"
            >
              <div
                ref={containerRef}
                className="w-full"
                style={{ aspectRatio }}
              >
                {entry ? (
                  <Player
                    ref={playerRef}
                    lazyComponent={entry.load}
                    inputProps={inputProps}
                    durationInFrames={entry.config.durationInFrames}
                    fps={entry.config.fps}
                    compositionWidth={entry.config.compositionWidth}
                    compositionHeight={entry.config.compositionHeight}
                    style={{ width: "100%", height: "100%", display: "block" }}
                    loop
                    initiallyMuted
                    acknowledgeRemotionLicense
                  />
                ) : null}
              </div>
            </motion.div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
