"use client";

import { useEffect } from "react";

const REVEAL_EDGE = 0.9;

export function RevealScope() {
  useEffect(() => {
    const root = document.documentElement;
    const fold = window.innerHeight;
    const pending = new Set<Element>();

    for (const node of document.querySelectorAll(
      "[data-reveal]:not([data-shown])",
    )) {
      if (node.getBoundingClientRect().top < fold) {
        node.setAttribute("data-shown", "static");
      } else {
        pending.add(node);
      }
    }

    root.setAttribute("data-reveal-ready", "");

    const show = (node: Element) => {
      node.setAttribute("data-shown", "in");
      reveal.unobserve(node);
      screen.unobserve(node);
      pending.delete(node);
    };

    const reveal = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) show(entry.target);
        }
      },
      { rootMargin: `0px 0px -${(1 - REVEAL_EDGE) * 100}% 0px` },
    );
    for (const node of pending) reveal.observe(node);

    // Blocks near the bottom may never cross the reveal edge, so once the page
    // end is reached every pending block on screen is shown. Tracked with
    // observers, not a scroll listener: reading scrollY/scrollHeight on scroll
    // forces a synchronous style + layout pass mid-frame.
    const onScreen = new Set<Element>();
    let atEnd = false;
    const flush = () => {
      if (!atEnd) return;
      for (const node of pending) if (onScreen.has(node)) show(node);
    };
    const screen = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) onScreen.add(entry.target);
        else onScreen.delete(entry.target);
      }
      flush();
    });
    for (const node of pending) screen.observe(node);
    const end = new IntersectionObserver(
      ([entry]) => {
        atEnd = entry.isIntersecting;
        flush();
      },
      // 4px of slack below the viewport: the footer's bottom lands on a
      // subpixel edge, so it would never count as fully visible otherwise.
      { threshold: 1, rootMargin: "0px 0px 4px 0px" },
    );
    const footer = document.querySelector("footer");
    if (footer) end.observe(footer);

    return () => {
      reveal.disconnect();
      screen.disconnect();
      end.disconnect();
      root.removeAttribute("data-reveal-ready");
    };
  }, []);

  return null;
}
