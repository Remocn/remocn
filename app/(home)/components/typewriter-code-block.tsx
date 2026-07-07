"use client";

import { ChevronDown } from "lucide-react";
import { useTheme } from "next-themes";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { cn } from "@/lib/utils";

export type CodeTheme = "light" | "dark";

export type SyntaxPalette = {
  keyword: string;
  type: string;
  fn: string;
  prop: string;
  string: string;
  number: string;
  boolean: string;
  punctuation: string;
  plain: string;
};

// Fixed dark editor palette (mirrors the reference mock).
export const SYNTAX_DARK: SyntaxPalette = {
  keyword: "#c792ea",
  type: "#c9b3ff",
  fn: "#82aaff",
  prop: "#a6accd",
  string: "#c3e88d",
  number: "#89ddff",
  boolean: "#f78c6c",
  punctuation: "#676e95",
  plain: "#bcc2e0",
};

// Light editor palette (GitHub-light flavoured) for the same token kinds.
export const SYNTAX_LIGHT: SyntaxPalette = {
  keyword: "#cf222e",
  type: "#116329",
  fn: "#8250df",
  prop: "#953800",
  string: "#0a3069",
  number: "#0550ae",
  boolean: "#0550ae",
  punctuation: "#6e7781",
  plain: "#1f2328",
};

export const SYNTAX: Record<CodeTheme, SyntaxPalette> = {
  dark: SYNTAX_DARK,
  light: SYNTAX_LIGHT,
};

// Chrome (surface, title bar, traffic lights, chip) per theme.
const CHROME: Record<
  CodeTheme,
  { container: string; titleBar: string; dot: string; chip: string }
> = {
  dark: {
    container: "bg-[#0f0e17] ring-white/10",
    titleBar: "border-white/[0.06]",
    dot: "bg-white/15",
    chip: "bg-white/5 text-white/55 ring-white/10",
  },
  light: {
    container: "bg-[#f6f8fa] ring-black/[0.08]",
    titleBar: "border-black/[0.06]",
    dot: "bg-black/15",
    chip: "bg-black/[0.04] text-black/55 ring-black/[0.08]",
  },
};

const PaletteContext = createContext<SyntaxPalette>(SYNTAX_DARK);

export function Token({
  color,
  children,
}: {
  color: string;
  children: ReactNode;
}) {
  return <span style={{ color }}>{children}</span>;
}

/**
 * Token coloured by the active {@link TypewriterCodeBlock} theme. Use this for
 * slot values when the block follows the site theme (no explicit `theme` prop),
 * so the colours track light/dark automatically.
 */
export function Tok({
  kind,
  children,
}: {
  kind: keyof SyntaxPalette;
  children: ReactNode;
}) {
  const palette = useContext(PaletteContext);
  return <span style={{ color: palette[kind] }}>{children}</span>;
}

/**
 * The `Typewriter` editor card: title bar + syntax-highlighted source.
 *
 * Theme resolution: an explicit `theme` prop always wins; otherwise the block
 * follows the site's next-theme (`resolvedTheme`), falling back to dark before
 * mount to avoid hydration mismatch. The active palette is exposed to slots via
 * context — colour them with {@link Tok} to track the theme, or {@link Token}
 * for a fixed colour. The five JSX prop values are slots, so callers decide
 * whether each is static or an interactive control.
 */
export function TypewriterCodeBlock({
  text,
  fontSize,
  color,
  fontWeight,
  cursor,
  footer,
  label = "Typewriter",
  theme,
  header = true,
  className,
}: {
  text: ReactNode;
  fontSize: ReactNode;
  color: ReactNode;
  fontWeight: ReactNode;
  cursor: ReactNode;
  footer?: ReactNode;
  label?: string;
  theme?: CodeTheme;
  header?: boolean;
  className?: string;
}) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Theme is only known on the client; before mount fall back to dark so SSR
  // and the first client render agree.
  useEffect(() => setMounted(true), []);

  const active: CodeTheme =
    theme ?? (mounted && resolvedTheme === "light" ? "light" : "dark");
  const chrome = CHROME[active];
  const palette = SYNTAX[active];

  return (
    <PaletteContext.Provider value={palette}>
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl ring-1 sm:rounded-3xl",
          chrome.container,
          className,
        )}
      >
        {/* Title bar */}
        {header && (
          <div
            className={cn(
              "relative flex items-center justify-between border-b px-5 py-4",
              chrome.titleBar,
            )}
          >
            <div className="flex items-center gap-2">
              <span className={cn("size-3 rounded-full", chrome.dot)} />
              <span className={cn("size-3 rounded-full", chrome.dot)} />
              <span className={cn("size-3 rounded-full", chrome.dot)} />
            </div>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium ring-1",
                chrome.chip,
              )}
            >
              {label}
              <ChevronDown className="size-3.5" />
            </span>
          </div>
        )}

        {/* Code */}
        <pre className="relative overflow-x-auto px-6 py-6 font-mono text-[13px] leading-[1.95] whitespace-pre [scrollbar-width:none] sm:text-sm [&::-webkit-scrollbar]:hidden">
          <code>
            <Token color={palette.keyword}>import</Token>
            <Token color={palette.plain}>{" { "}</Token>
            <Token color={palette.type}>Typewriter</Token>
            <Token color={palette.plain}>{" } "}</Token>
            <Token color={palette.keyword}>from</Token>{" "}
            <Token color={palette.string}>
              "@/components/remocn/typewriter"
            </Token>
            <Token color={palette.punctuation}>;</Token>
            {"\n\n"}
            <Token color={palette.keyword}>export function</Token>{" "}
            <Token color={palette.fn}>Hero</Token>
            <Token color={palette.punctuation}>{"() {"}</Token>
            {"\n  "}
            <Token color={palette.keyword}>return</Token>{" "}
            <Token color={palette.punctuation}>(</Token>
            {"\n    "}
            <Token color={palette.punctuation}>{"<"}</Token>
            <Token color={palette.type}>Typewriter</Token>
            {"\n      "}
            <Token color={palette.prop}>text</Token>
            <Token color={palette.punctuation}>=</Token>
            {text}
            {"\n      "}
            <Token color={palette.prop}>fontSize</Token>
            <Token color={palette.punctuation}>={"{"}</Token>
            {fontSize}
            <Token color={palette.punctuation}>{"}"}</Token>
            {"\n      "}
            <Token color={palette.prop}>color</Token>
            <Token color={palette.punctuation}>=</Token>
            {color}
            {"\n      "}
            <Token color={palette.prop}>fontWeight</Token>
            <Token color={palette.punctuation}>={"{"}</Token>
            {fontWeight}
            <Token color={palette.punctuation}>{"}"}</Token>
            {"\n      "}
            <Token color={palette.prop}>cursor</Token>
            <Token color={palette.punctuation}>={"{"}</Token>
            {cursor}
            <Token color={palette.punctuation}>{"}"}</Token>
            {"\n    "}
            <Token color={palette.punctuation}>{"/>"}</Token>
            {"\n  "}
            <Token color={palette.punctuation}>)</Token>
            {"\n"}
            <Token color={palette.punctuation}>{"}"}</Token>
          </code>
        </pre>

        {footer ? (
          <div className="relative flex justify-end px-6 pb-5">{footer}</div>
        ) : null}
      </div>
    </PaletteContext.Provider>
  );
}
