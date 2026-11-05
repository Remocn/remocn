import type { CSSProperties } from "react";
import saved from "@/config/header-layout.json";

/**
 * Desktop (`lg`+) header sizes, in px. Tuned by eye in `/lab/header-layout`,
 * which saves them to `config/header-layout.json`; `SiteHeader` reads that file.
 */
export type HeaderLayout = {
  /** Height of both capsules. */
  height: number;
  /** Height of the items inside (nav links, GitHub, health, Get started). */
  itemHeight: number;
  /** Capsule corner radius. */
  radius: number;
  /** Item and hover-pill corner radius. */
  itemRadius: number;
  /** Space above the capsules. */
  top: number;
  /** Side padding of a nav link; the right capsule's items add 1px / 5px. */
  itemPadding: number;
  /** Item font size. */
  text: number;
  /** Wordmark font size (the mark scales with it). */
  wordmark: number;
};

export const HEADER_LAYOUT: HeaderLayout = saved;

/** The layout as the CSS variables the header reads. */
export function headerLayoutVars(layout: HeaderLayout): CSSProperties {
  const item = Math.min(layout.itemHeight, layout.height - 4);
  return {
    "--hdr-h": `${layout.height}px`,
    "--hdr-item-h": `${item}px`,
    "--hdr-inset": `${(layout.height - item) / 2}px`,
    "--hdr-r": `${layout.radius}px`,
    "--hdr-item-r": `${layout.itemRadius}px`,
    "--hdr-top": `${layout.top}px`,
    "--hdr-pad": `${layout.itemPadding}px`,
    "--hdr-text": `${layout.text}px`,
    "--hdr-wordmark": `${layout.wordmark}px`,
  } as CSSProperties;
}
