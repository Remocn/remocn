"use client";

import {
  type KeyboardEvent,
  type PointerEvent,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";
import { CONTROL, CONTROL_LABEL, formatStep } from "./control-styles";

const TICKS = [10, 20, 30, 40, 50, 60, 70, 80, 90];

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(Math.max(v, lo), hi);

/**
 * A bounded number as a fill slider: the whole tile is the track, the fill
 * ends in a thin handle line, and ticks appear while it is hovered or dragged.
 * Arrows step, Shift + arrow or Page Up / Down step ten times, Home / End
 * jump to the limits.
 */
export function SliderControl({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const valueRef = useRef<HTMLSpanElement>(null);
  const [dragging, setDragging] = useState(false);
  const percent = ((clamp(value, min, max) - min) / (max - min || 1)) * 100;

  // Where the label ends and the value starts, in % of the track, so the
  // handle line can step aside instead of striking through the text.
  const [clear, setClear] = useState({ from: 0, to: 100 });
  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const measure = () => {
      const width = track.offsetWidth;
      const label = labelRef.current;
      const val = valueRef.current;
      if (!width || !label || !val) return;
      const from = ((label.offsetLeft + label.offsetWidth + 8) / width) * 100;
      const to = ((val.offsetLeft - 8) / width) * 100;
      setClear((prev) =>
        prev.from === from && prev.to === to ? prev : { from, to },
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    if (valueRef.current) observer.observe(valueRef.current);
    return () => observer.disconnect();
  }, []);
  const overText = percent < clear.from || percent > clear.to;

  const commit = (raw: number) => {
    const snapped = Math.round((raw - min) / step) * step + min;
    const next = Number(clamp(snapped, min, max).toFixed(10));
    if (next !== value) onChange(next);
  };

  const fromPointer = (clientX: number) => {
    const box = trackRef.current?.getBoundingClientRect();
    if (!box || box.width === 0) return;
    commit(min + ((clientX - box.left) / box.width) * (max - min));
  };

  const grab = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.focus({ preventScroll: true });
    setDragging(true);
    fromPointer(event.clientX);
  };

  // A finger on a full-width tile is usually scrolling the page, so touch
  // only takes over once it moves sideways (or lifts as a tap).
  const touchStart = useRef<number | null>(null);
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch") {
      touchStart.current = event.clientX;
      return;
    }
    event.preventDefault();
    grab(event);
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (dragging) {
      fromPointer(event.clientX);
    } else if (
      touchStart.current !== null &&
      Math.abs(event.clientX - touchStart.current) > 6
    ) {
      touchStart.current = null;
      grab(event);
    }
  };
  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (touchStart.current !== null) fromPointer(event.clientX);
    touchStart.current = null;
    setDragging(false);
  };
  const onPointerCancel = () => {
    touchStart.current = null;
    setDragging(false);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const by = event.shiftKey ? step * 10 : step;
    const next: Record<string, number> = {
      ArrowRight: value + by,
      ArrowUp: value + by,
      ArrowLeft: value - by,
      ArrowDown: value - by,
      PageUp: value + step * 10,
      PageDown: value - step * 10,
      Home: min,
      End: max,
    };
    if (!(event.key in next)) return;
    event.preventDefault();
    commit(next[event.key]);
  };

  const display = formatStep(value, step);

  return (
    <div
      ref={trackRef}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={display}
      data-dragging={dragging || undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onKeyDown={onKeyDown}
      className={cn(
        CONTROL,
        "group/slider cursor-ew-resize touch-pan-y outline-none select-none focus-visible:ring-[1.5px] focus-visible:ring-primary-bright focus-visible:ring-inset",
      )}
    >
      <span aria-hidden="true" className="pointer-events-none absolute inset-0">
        {TICKS.filter((tick) => tick > clear.from && tick < clear.to).map(
          (tick) => (
            <span
              key={tick}
              className="absolute top-1/2 h-2 w-px -translate-y-1/2 rounded-full bg-white/15 opacity-0 transition-opacity duration-150 group-hover/slider:opacity-100 group-data-dragging/slider:opacity-100"
              style={{ left: `${tick}%` }}
            />
          ),
        )}
        <span
          className="absolute inset-y-0 left-0 bg-white/11 transition-colors duration-150 group-hover/slider:bg-white/13 group-data-dragging/slider:bg-white/18"
          style={{ width: `${percent}%` }}
        />
        <span
          className={cn(
            "absolute top-2 h-5 w-[3px] -translate-x-1/2 rounded-full bg-white/50 transition-[background-color,opacity] duration-150 group-data-dragging/slider:bg-[#fafafa] max-md:top-3",
            overText && "opacity-0",
          )}
          style={{ left: `max(1.5px, ${percent}%)` }}
        />
      </span>
      <span
        ref={labelRef}
        className={cn(CONTROL_LABEL, "pointer-events-none relative")}
      >
        {label}
      </span>
      <span
        ref={valueRef}
        className="pointer-events-none relative text-[#fafafa] tabular-nums"
      >
        {display}
      </span>
    </div>
  );
}
