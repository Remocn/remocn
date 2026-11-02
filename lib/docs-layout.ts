import type { CSSProperties } from "react";
import saved from "@/config/docs-layout.json";

/**
 * Sizes of the docs frame, in px. Tuned by eye in `/lab/docs-layout`, which
 * saves them to `config/docs-layout.json`; the docs layout reads that file.
 */
export type DocsLayout = {
  /** Max width of the whole docs frame (header, columns, footer). */
  frame: number;
  /** Side padding of the frame from `lg` up. */
  gutter: number;
  /** Left sidebar width. */
  sidebar: number;
  /** Right rail width (TOC, Studio card, sponsors), from `xl` up. */
  rail: number;
  /** Article side padding from `xl` up. */
  articlePadding: number;
  /** Max width of the article column; 0 lets it fill the space. */
  articleMax: number;
};

export const DOCS_LAYOUT: DocsLayout = saved;

/** The layout as the CSS variables the docs frame reads. */
export function docsLayoutVars(layout: DocsLayout): CSSProperties {
  return {
    "--docs-frame": `${layout.frame}px`,
    "--docs-gutter": `${layout.gutter}px`,
    "--docs-sidebar": `${layout.sidebar}px`,
    "--docs-rail": `${layout.rail}px`,
    "--docs-article-pad": `${layout.articlePadding}px`,
    "--docs-article-max": layout.articleMax ? `${layout.articleMax}px` : "none",
  } as CSSProperties;
}
