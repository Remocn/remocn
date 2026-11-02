"use client";

import { Player, type PlayerRef } from "@remotion/player";
import { useIntersectionObserver } from "@uidotdev/usehooks";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAutoplay } from "@/app/(home)/components/use-autoplay";
import { usePrefersReducedMotion } from "@/lib/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";
import registry from "@/registry/__index__";
import { previewManifest } from "@/registry/__manifest__";
import type { CardItem } from "./component-card-grid";

/** How much of the thumbnail the zoomed content may take, and the cap. */
const FIT_WIDTH = 0.8;
const FIT_HEIGHT = 0.72;
const MAX_ZOOM = 3.5;
/** Points of the animation (0..1) whose drawn content the zoom must fit. */
const SAMPLE_AT = [0.3, 0.5, 0.7, 0.9];
/** Where a card rests when the reader prefers reduced motion. */
const STILL_AT = 0.7;

/**
 * Bounds of what's actually drawn inside a player: visible text and graphics,
 * skipping anything that covers the whole frame (scene backgrounds).
 */
function contentBounds(root: HTMLElement): DOMRect | null {
  const frame = root.getBoundingClientRect();
  let left = Number.POSITIVE_INFINITY;
  let top = Number.POSITIVE_INFINITY;
  let right = Number.NEGATIVE_INFINITY;
  let bottom = Number.NEGATIVE_INFINITY;
  const add = (rect: DOMRect) => {
    if (rect.width < 1 || rect.height < 1) return;
    if (rect.width > frame.width * 0.92 && rect.height > frame.height * 0.92)
      return;
    left = Math.min(left, rect.left);
    top = Math.min(top, rect.top);
    right = Math.max(right, rect.right);
    bottom = Math.max(bottom, rect.bottom);
  };
  const visible = (el: Element) =>
    !("checkVisibility" in el) ||
    el.checkVisibility({ opacityProperty: true, visibilityProperty: true });

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (!node.textContent?.trim() || !node.parentElement) continue;
    if (!visible(node.parentElement)) continue;
    range.selectNodeContents(node);
    add(range.getBoundingClientRect());
  }
  for (const el of root.querySelectorAll("svg, img, canvas, video")) {
    if (el.closest("svg") !== el && el.tagName !== "svg" && el.closest("svg"))
      continue;
    if (visible(el)) add(el.getBoundingClientRect());
  }
  if (!Number.isFinite(left)) return null;
  return new DOMRect(left, top, right - left, bottom - top);
}

function slugFromHref(href?: string) {
  if (!href) return undefined;
  return href.split("/").filter(Boolean).pop();
}

/**
 * Live preview, cover-cropped into the card's thumbnail. The Player mounts the
 * first time the card nears the viewport (a category index has dozens of
 * them) and only plays while it stays there. With reduced motion it holds a
 * still frame instead.
 */
function CardPreview({ name }: { name?: string }) {
  const entry = name ? registry[name] : undefined;
  const preview = name ? previewManifest[name] : undefined;
  const playerRef = useRef<PlayerRef>(null);
  const reducedMotion = usePrefersReducedMotion();
  const { containerRef } = useAutoplay(playerRef, !reducedMotion);
  const [mountRef, intersection] = useIntersectionObserver({
    threshold: 0,
    root: null,
    rootMargin: "400px",
  });
  const [mounted, setMounted] = useState(false);
  const zoomRef = useRef<HTMLDivElement>(null);
  const fit = preview?.card?.fit !== false;
  // Measuring seeks through the clip at its unzoomed size; a veil in the
  // tile colour hides that and lifts once the zoom is set.
  const [fitted, setFitted] = useState(false);

  useEffect(() => {
    if (intersection?.isIntersecting) setMounted(true);
  }, [intersection]);

  useEffect(() => {
    if (!mounted || !reducedMotion || !preview) return;
    const player = playerRef.current;
    player?.pause();
    player?.seekTo(Math.round((preview.durationInFrames - 1) * STILL_AT));
  }, [mounted, reducedMotion, preview]);

  // Zoom the drawn content to fill the tile: the compositions are laid out
  // for a 1280×720 frame, so text would otherwise be a few pixels tall here.
  // Measured once, as the union over a few frames of the animation so a
  // word that grows or slides later isn't cropped.
  useEffect(() => {
    if (!mounted || !fit || !preview) return;
    const frames = SAMPLE_AT.map((at) =>
      Math.round((preview.durationInFrames - 1) * at),
    );
    let cancelled = false;
    let tries = 0;
    const nextFrame = () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
    const measure = async () => {
      const player = playerRef.current;
      const zoomBox = zoomRef.current;
      const root = player?.getContainerNode();
      const tile = zoomBox?.parentElement?.parentElement;
      if (cancelled || !player || !zoomBox || !root || !tile) return;
      let union: DOMRect | null = null;
      for (const frame of frames) {
        player.seekTo(frame);
        await nextFrame();
        if (cancelled) return;
        const rect = contentBounds(root);
        if (!rect) continue;
        union = union
          ? new DOMRect(
              Math.min(union.left, rect.left),
              Math.min(union.top, rect.top),
              Math.max(union.right, rect.right) -
                Math.min(union.left, rect.left),
              Math.max(union.bottom, rect.bottom) -
                Math.min(union.top, rect.top),
            )
          : rect;
      }
      player.seekTo(
        reducedMotion
          ? Math.round((preview.durationInFrames - 1) * STILL_AT)
          : 0,
      );
      if (!union) {
        if (++tries < 20) window.setTimeout(measure, 150);
        else setFitted(true);
        return;
      }
      const box = tile.getBoundingClientRect();
      const zoom = Math.min(
        MAX_ZOOM,
        (box.width * FIT_WIDTH) / union.width,
        (box.height * FIT_HEIGHT) / union.height,
      );
      setFitted(true);
      if (zoom < 1.1) return;
      const own = zoomBox.getBoundingClientRect();
      const cx = union.left + union.width / 2;
      const cy = union.top + union.height / 2;
      zoomBox.style.transformOrigin = `${cx - own.left}px ${cy - own.top}px`;
      zoomBox.style.transform = `translate(${box.left + box.width / 2 - cx}px, ${box.top + box.height / 2 - cy}px) scale(${zoom})`;
    };
    const start = window.setTimeout(measure, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(start);
    };
  }, [mounted, fit, preview, reducedMotion]);

  if (!entry || !preview) return null;
  const cardProps = { ...preview.defaults, ...preview.card?.props };
  const backdrop =
    preview.card?.backdrop && preview.previewBackdrop?.type === "color"
      ? preview.previewBackdrop.value
      : undefined;

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 bg-[#f4f4f5]"
      style={backdrop ? { background: backdrop } : undefined}
    >
      {mounted && (
        <div
          ref={containerRef}
          className="absolute top-0 left-1/2 h-full min-w-full -translate-x-1/2"
          style={{
            aspectRatio: `${preview.compositionWidth} / ${preview.compositionHeight}`,
          }}
        >
          <div ref={zoomRef} className="size-full">
            <Player
              ref={playerRef}
              lazyComponent={entry.load}
              inputProps={cardProps}
              durationInFrames={preview.durationInFrames}
              fps={preview.fps}
              compositionWidth={preview.compositionWidth}
              compositionHeight={preview.compositionHeight}
              style={{ width: "100%", height: "100%" }}
              controls={false}
              clickToPlay={false}
              loop
              initiallyMuted
              numberOfSharedAudioTags={0}
              acknowledgeRemotionLicense
            />
          </div>
        </div>
      )}
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 bg-inherit transition-opacity duration-200 ease-[ease]",
          (!fit || fitted) && "opacity-0",
        )}
      />
    </div>
  );
}

function CardBody({ item }: { item: CardItem }) {
  return (
    <>
      <span
        aria-hidden="true"
        className="relative block h-[104px] shrink-0 overflow-hidden rounded-[13px] bg-[#f4f4f5] sm:h-[140px] sm:rounded-control"
      >
        <CardPreview name={item.component ?? slugFromHref(item.href)} />
      </span>
      <span className="flex flex-col gap-1 px-[7px] pt-2.5 sm:gap-1.5 sm:px-2 sm:pt-3">
        <span className="flex items-center justify-between gap-2">
          <span className="text-[15px] leading-5 font-medium text-foreground">
            {item.name}
          </span>
          {item.status === "soon" ? (
            <span className="shrink-0 rounded-tag bg-surface-muted px-1.5 py-0.5 text-micro leading-[14px] font-medium text-muted-foreground">
              Soon
            </span>
          ) : (
            item.isNew && (
              <span className="shrink-0 rounded-tag bg-primary-tint px-1.5 py-0.5 text-micro leading-[14px] font-medium text-primary-strong dark:text-primary-soft">
                New
              </span>
            )
          )}
        </span>
        <span className="text-caption leading-[18px] text-muted-foreground">
          {item.description}
        </span>
      </span>
    </>
  );
}

const card =
  "group/card flex h-full flex-col rounded-capsule bg-surface px-[5px] pt-[5px] pb-3.5 shadow-[0_0_0_1px_var(--color-hairline)] sm:rounded-card sm:p-1.5 sm:pb-4";

/** Component tile of the category indexes: live preview, title, one-liner. */
export function ComponentCard({ item }: { item: CardItem }) {
  if (item.status === "stable" && item.href) {
    return (
      <Link
        href={item.href}
        className={cn(
          card,
          "outline-none transition-shadow duration-150 hover:shadow-[0_0_0_1px_var(--color-divider)] focus-visible:ring-3 focus-visible:ring-ring",
        )}
      >
        <CardBody item={item} />
      </Link>
    );
  }

  return (
    <div className={cn(card, "opacity-60")}>
      <CardBody item={item} />
    </div>
  );
}
