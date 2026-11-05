"use client";

import { useEffect, useRef, useState } from "react";
import { type Rect, StretchPill } from "./stretch-pill";

const ITEM = "[data-pill]";
const HELD = `${ITEM}[data-popup-open], ${ITEM}[aria-expanded="true"]`;

function finalWidth(item: HTMLElement) {
  const declared = Number(item.dataset.pillWidth);
  return declared > 0 ? declared : item.getBoundingClientRect().width;
}

export function HeaderPill() {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const [rect, setRect] = useState<Rect | null>(null);

  useEffect(() => {
    const track = anchorRef.current?.parentElement;
    if (!track) return;
    let hovered: HTMLElement | null = null;
    let focused: HTMLElement | null = null;
    let shown = false;

    const sync = () => {
      const target =
        hovered ?? focused ?? track.querySelector<HTMLElement>(HELD);
      if (!target) {
        shown = false;
        track.removeAttribute("data-pill-zone");
        setRect(null);
        return;
      }
      const trackBox = track.getBoundingClientRect();
      const box = target.getBoundingClientRect();
      const sweeps = target.dataset.pillSweep !== undefined;
      setRect({
        left: box.left - trackBox.left,
        top: box.top - trackBox.top,
        width: finalWidth(target),
        enter: !shown && sweeps ? "from-right" : "fade",
        behind: target.dataset.pill === "behind",
        metal: target.dataset.pillMetal !== undefined,
      });
      shown = true;
      track.setAttribute("data-pill-zone", target.dataset.pill ?? "");
    };

    const itemOf = (node: EventTarget | null) =>
      node instanceof Element ? node.closest<HTMLElement>(ITEM) : null;

    const onOver = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      const item = itemOf(event.target);
      if (item && item !== hovered) {
        hovered = item;
        sync();
      }
    };
    const onLeave = () => {
      hovered = null;
      sync();
    };
    const onFocusIn = (event: FocusEvent) => {
      const item = itemOf(event.target);
      if (item?.matches(":focus-visible")) {
        focused = item;
        sync();
      }
    };
    const onFocusOut = () => {
      focused = null;
      sync();
    };
    const observer = new MutationObserver(() => {
      if (!hovered && !focused) sync();
    });
    observer.observe(track, {
      subtree: true,
      attributes: true,
      attributeFilter: ["data-popup-open", "aria-expanded"],
    });

    track.addEventListener("pointerover", onOver);
    track.addEventListener("pointerleave", onLeave);
    track.addEventListener("focusin", onFocusIn);
    track.addEventListener("focusout", onFocusOut);
    return () => {
      observer.disconnect();
      track.removeEventListener("pointerover", onOver);
      track.removeEventListener("pointerleave", onLeave);
      track.removeEventListener("focusin", onFocusIn);
      track.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  return (
    <>
      <span ref={anchorRef} hidden />
      <StretchPill rect={rect} className="z-0" />
    </>
  );
}
