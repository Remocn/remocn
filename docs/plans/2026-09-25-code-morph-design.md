# Code Morph

Direction: Keynote Magic Move for code, as a product piece in UI Blocks
(`content/docs/ui-blocks/`), next to `glass-code-block` and `glass-code-walk`.
A flat editor panel shows one version of a file, then morphs into the next.
Tokens that exist in both versions keep their identity: each one is a single
element that glides from its old line and column to its new ones. Removed code
dissolves first, the survivors travel, and new code fades in last. The panel
keeps one size that fits every version, so code that did not change never
moves. After each morph, the changed lines hold a brief accent highlight. The
default content sells an API simplification: 16 lines of `useState` +
`useEffect` + `fetch` boilerplate collapse into an 8-line component built on
one data hook. The line that carries the story is `"/api/invoices"`. It lifts
out of the `fetch(...)` call on line 8 and lands inside `useSWR(...)` on line
4, and the eye can follow it the whole way.

The component is the product surface itself: large, legible, real code, one
accent. It has no typing, no cursor, no camera, and no glass.

## Look

- Panel: solid fill, 1px border, 14px radius, `overflow: hidden`. No shadow,
  glow, blur halo, gradient, or backdrop blur. The panel is artwork, so it is
  filled. The root around it is transparent.
- Header, 42px, shown when `windowDots` is on or `filename` is not empty.
  It holds three neutral window dots (11px, 7px apart; no traffic-light
  colors, so the accent stays the only hue) and a filename tab. The tab is
  filled with the panel color, has a 1px border on three sides and 8px top
  corners, and covers the header divider so it reads as the open file.
- Code: the `glass-code-block` mono stack, with a fallback inside the
  `var()`: `var(--font-geist-mono, ui-monospace), ui-monospace,
  SFMono-Regular, Menlo, Consolas, monospace`. The original
  `var(--font-geist-mono), …` invalidates the whole `font-family` declaration
  in projects that do not define the variable, and the text then falls back
  to the inherited, often proportional font. That breaks a column grid, so the
  fallback is required here. Ligatures are off.
- Syntax palette: neutral tones plus the accent.

| Role | Dark | Light |
| --- | --- | --- |
| Panel | `#111113` | `#ffffff` |
| Header | `#0c0c0e` | `#f7f7f8` |
| Border, divider | `#27272a` | `#e4e4e7` |
| Window dots | `#3f3f46` | `#d4d4d8` |
| Tab label | `#e4e4e7` | `#27272a` |
| Line numbers | `#52525b` | `#b4b4bb` |
| Function and type names | `#fafafa` | `#09090b` |
| Identifiers | `#d4d4d8` | `#3f3f46` |
| Keywords | `#a1a1aa` | `#71717a` |
| Punctuation | `#71717a` | `#909098` |
| Comments | `#5b5b63` | `#a1a1aa` |
| Strings, numbers | accent mixed 80% with white | accent mixed 70% with black |
| Changed-line band | accent at 16% | accent at 12% |

Strings use `color-mix(in oklab, accent, white or black)`, so any accent stays
legible on either panel. The band spans the full panel width, with a 2px
solid accent bar at the left edge.

## Props

| Prop | Default | Range | Meaning |
| --- | --- | --- | --- |
| `steps` | before/after below | `{ at, code }[]` | Versions in order; `at` is the 30 fps frame where the morph into that version starts |
| `morphDuration` | 36 | 12–120 | Frames from the first removed token leaving to the last new token settling |
| `highlight` | true | boolean | Accent band on changed lines after each morph |
| `fontSize` | 20 | 10–40 | Code size in reference px |
| `lineNumbers` | true | boolean | Gutter with right-aligned line numbers |
| `filename` | `"invoices.tsx"` | string | Tab label; empty hides the tab |
| `windowDots` | true | boolean | Three neutral dots in the header |
| `theme` | `"dark"` | `dark`, `light` | Panel and syntax palette |
| `accentColor` | `#0ea5e9` | color | Strings, numbers, highlight band and bar |
| `speed` | 1 | shared | Time multiplier; 0 freezes the first version |
| `className` | none | string | Class on the full-frame root |

Steps are sorted by `at`. The first version shows from frame 0 whatever its
`at`. Code is normalized: CRLF becomes LF, tabs become two spaces, trailing
spaces go, leading and trailing blank lines are dropped, and the common
indentation is removed. Template literals indented inside JSX therefore work.
If a step's `at` falls before the previous morph has finished, that morph
starts when the previous one ends, so morphs never overlap.

## Sizing rule

Every size is in reference px at a 1280×720 frame, scaled by

`unit = min(width / 1280, height / 720) × fit`

At 16:9 this is the `confetti` rule, `height / 720`. The width term keeps the
panel inside 1:1 and 9:16 frames, which the pure height rule would overflow,
because a code panel is wide. `fit = min(1, 1152 / panelWidth, 640 /
panelHeight)` shrinks the whole panel when the longest line or the tallest
version would not fit inside 64px side and 40px top/bottom margins. For
fitting only, `panelWidth` estimates the mono advance as 0.6em. `fit` depends
on the largest version, so it stays constant for the whole animation. The
default panel is about 854×580 at 720p and needs no fit.

Positions use no DOM measurement. A token at `(line, col)` sits at
`translate(col ch, line × lineHeight px)`, where `ch` is the CSS unit, the
advance of the panel's own mono font, and `lineHeight = 1.55 × fontSize`.
The panel width is `calc((gutter + maxColumns) ch + 50px)` at unit 1. It is
fixed at the longest line of any version. Its height, `42 + 20 + 22 + rows ×
lineHeight`, is fixed the same way at the tallest version. The panel is
centered in the frame and never moves or resizes. A panel that resized while
staying centered would drift every unchanged line by half the height change,
124px in the default. `"/api/invoices"` would then end at the same screen
height it started from, and its lift would read as a hop. Magic Move only reads
when motion means change, so the frame holds still. A shorter version leaves
empty editor space below it, as a real editor does.

## Default content

Before (16 lines):

```tsx
import { useEffect, useState } from "react";

export function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/invoices")
      .then((res) => res.json())
      .then(setInvoices)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  return <InvoiceTable rows={invoices} />;
}
```

After (8 lines), at frame 48:

```tsx
import useSWR from "swr";

export function Invoices() {
  const { data, isLoading } = useSWR("/api/invoices", fetcher);

  if (isLoading) return <Spinner />;
  return <InvoiceTable rows={data} />;
}
```

What the diff pairs (lines 1-based):

- Static: `import`, `export function Invoices() {`, `const`.
- Line 1: `from` and `;` slide 17 and 19 columns left as the named imports
  leave.
- Line 4: `,` and `=` slide 3 and 4 columns left. `(` and `"/api/invoices"`
  fly up 4 lines and right 27 columns out of `fetch(...)` on line 8. The
  closing `)` flies too, landing 9 columns further right after the new
  `, fetcher`.
- The `if` line and the `return` line rise 8 lines as whole blocks. The part
  after `isLoading` shifts 2 columns right, and the part after `data` shifts
  4 columns left.
- The closing `}` rises from line 16 to line 8.
- Removed (73 tokens): the React named imports and `"react"`, the rest of
  both `useState` lines, the whole effect, `loading` and `invoices`. Added (12
  tokens): `useSWR`, `"swr"`, `{ data, isLoading }`, `useSWR`, `, fetcher`,
  `;`, `isLoading`, `data`. Surviving: 33 tokens, 25 of them moving in 11
  blocks.
- Highlighted after the morph: lines 1, 4, 6 and 7. Lines 3 and 8 are exact
  copies of old lines, so they get no band.

## Timeline (30 fps, speed 1, default content)

| Frames | Beat |
| --- | --- |
| 0–48 | The 16-line version holds |
| 48–64 | Removed tokens fade, blur to 3.5px and shrink to 92%, top line first, 0.4 frames apart |
| 54–80 | Survivors glide; the five destination lines start 1 frame apart (54, 55, 56, 57, 58), each over 22 frames |
| 58–78 | Line numbers 9–16 fade, timed with the last moving line; the panel keeps its size |
| 68–84 | New tokens fade in over 12 frames, per destination line at 68, 69.3, 70.7, 72 |
| 68–76 | Changed-line bands rise |
| 76–100 | Bands hold |
| 100–114 | Bands fade (`codeMorphLength` = 114) |
| 114–138 | Hold (`getCodeMorphDuration()` = 138) |

Phase constants are defined at a 36-frame morph and scale with
`morphDuration` (value × morphDuration / 36):

| Phase | Start | Spread | Duration |
| --- | --- | --- | --- |
| Exit | 0 | 4 (per source line) | 12 |
| Move | 6 | 4 (cascade by destination line) | 22 |
| Enter | 20 | 4 (per destination line) | 12 |

The highlight does not scale. It rises over 8 frames from the enter start,
holds 24 and falls over 14. If the next morph starts first, the fall begins
at that morph's start. The timeline helper returns every morph's `start`,
`end`, `highlightStart`, `fallStart` and `highlightEnd`. `settled` is the last
highlight end, or the last morph end when `highlight` is off (84 for the
default). `duration` adds a 24-frame hold. `codeMorphLength = settled` of the
default content = 114.

## Signature motion

### Tokenizer

A hand scanner (no regex over the whole file) splits each normalized line into
tokens with `(line, col)`, where `col` counts code points. Whitespace is not a
token; the column grid carries it. Token kinds:

- `comment`: `// …` to line end, `/* … */` (may span lines).
- `string`: `"…"`, `'…'`, and template literals (may span lines). A string is
  one token.
- `number`: decimal, hex, binary, octal, exponent, bigint.
- word: `[A-Za-z_$]` plus Latin and Greek letters, then word characters. It
  is a `keyword` if it is in the TS/JS keyword set and not after `.` or `?.`.
  Otherwise it is a `function` if the next token is `(`, a `type` if
  capitalized, and `text` otherwise.
- `punct`: the longest operator from `=== !== **= ... &&= ||= ??= => == != <=
  >= && || ?? ?. ++ -- += -= *= /= %= ** </ />`, else one code point.

Comments, strings, numbers and words are word tokens; the rest is punctuation.

### Diff: five passes

Positions only break ties and veto stray punctuation. Identity comes from
identical text.

1. Anchors (patience style). Word texts that occur exactly once in both
   versions are candidate pairs. The longest increasing subsequence of their
   new indices, taken in old order, gives the anchors. Each anchor's
   displacement predicts where its neighbors go.
2. Words. A weighted LCS over the word tokens pairs identical texts. Each
   pair is worth `W − cost`, where `W = (min(n, m) + 1) × 1000` and cost ≤
   1000. So the pair count always wins, and cost only decides between equal
   counts, such as which of two `const` statements survives. `cost(i, j)` is
   the smaller of the costs against the nearest guide before and after token
   `i` in old order; a missing side is ignored, and with no guide at all the
   prediction is "no move". Against a guide `(a, b)`:
   - Expected line: `line_i + (line_b − line_a)`.
   - Column offset, when `i` shares the guide's old line: the smaller of the
     left-anchored offset (expected column `col_i + (col_b − col_a)`) and the
     right-anchored one (same distance from the line end in both versions).
     Otherwise it is `|col_j − col_i|`.
   - Cost: `10 × |line offset| + 0.5 × |column offset|`.
   The right-anchored option keeps trailing `]`, `)` and `;` attached to the
   line end when a call gains an argument.
3. Punctuation. The word pairs cut both sequences into aligned gaps. Inside
   each gap, a weighted LCS pairs identical punctuation worth `12 − cost`.
   Here the cost uses the gap's bounding word pairs as the guides. A pair is
   kept only when that value is positive. So punctuation survives only when
   it stays with its line: at most one line off, and within 24 columns of
   where its neighbors predict. Commas and parens never fly across the file on
   their own.
4. Bracket partners. `(`, `[` and `{` are matched to their closers in each
   version. When a paired opener's closer is paired elsewhere, or not at all,
   it is re-paired with the closer of the opener's partner. A closing `});`
   therefore follows its call down when a line is inserted above it, instead
   of pairing with the new line's `}`.
5. Line moves. A new line whose tokens are all unpaired takes a removed line
   with the same tokens at the same relative columns, the nearest one first,
   provided it holds at least one word. Swapped or reordered lines then
   travel past each other, which an order-preserving LCS cannot do.

Both LCS tables are filled from the end and traced forward. At equal value the
trace prefers a match, then skipping an old token. `fromTo` and `toFrom` are
exact inverses, and the result is deterministic. It preserves order except for
pass 5; the default content involves no line moves.

### Choreography of one morph (τ = frames since the morph start, D = morphDuration)

- Exit (unpaired old tokens): `delay = 4·D/36 × rank(source line)`, where
  rank runs 0–1 over the distinct lines that lose tokens.
  `q = (τ − delay) / (12·D/36)`, `e = easeOutCubic(q)`. Opacity `1 − e`, scale
  `1 − 0.08e` about the token center, blur `3.5e` reference px. A token is
  dropped once `q ≥ 1`.
- Move (paired tokens whose line or column changes):
  `delay = 4·D/36 × rank(destination line)`, and
  `p = (τ − 6·D/36 − delay) / (22·D/36)`. Vertical progress is
  `E(p / 0.92)` and horizontal progress is `E((p − 0.08) / 0.92)`, with
  `E = cubic-bezier(0.6, 0, 0.2, 1)` clamped to 0–1. So a token that changes
  both line and column rises slightly ahead of its slide and travels a gentle
  arc instead of a diagonal. `line = line₀ + Δline × vertical` and
  `col = col₀ + Δcol × horizontal`. Timing depends only on the destination
  line and the path only on the displacement. So tokens from one source line
  with the same offset move rigidly together as a block, and a destination
  line assembles at once. Nothing overshoots: code lands exactly on the grid.
  Paired tokens that do not move render in place.
- Enter (unpaired new tokens): `delay = 4·D/36 × rank(destination line)` and
  `q = (τ − 20·D/36 − delay) / (12·D/36)`. Opacity `e`, scale `0.96 + 0.04e`,
  blur `3.5(1 − e)`. Hidden until `q > 0`.
- Gutter rows: `lines = n₀ + (n₁ − n₀) × E(pp / 0.92)` is the line count the
  gutter numbers. `pp` uses the move window with the largest cascade delay
  when shrinking and no delay when growing. Line numbers beyond the smaller
  count fade with that progress, so they follow the slowest line up and lead
  the fastest line down. A number never vanishes from a row that still holds
  moving code, and it appears before code lands on its row.
- Changed lines: a new line is highlighted unless every token on it is a
  survivor from one old line whose tokens all land on it, meaning an exact
  copy, moved or re-indented. Band opacity is
  `easeOutQuad((t − highlightStart) / 8) × (1 − smoothstep((t − fallStart) / 14))`.
  The previous morph's bands keep fading at their rows during the next morph.

Every phase ends by τ = D. At τ = 0 the render equals the old version at rest,
and at τ = D it equals the new version at rest, so the hand-off at both ends
is seamless.

## Rendering

The root is `position: absolute; inset: 0`, transparent, and centers the
panel. Inside the panel, in order: header (dots, divider, tab), highlight
bands and bars, then a content origin at the top-left padding. That origin
holds the line numbers (`digits` ch wide, right-aligned, 2ch gap; digits =
max(2, digits of the tallest version)) and the code layer, offset by the
gutter in `ch`. Every token is one absolutely positioned `white-space: pre`
span with `transform: translate(col ch, y px) scale(s)`. It carries opacity,
and a `filter: blur()` only while blurring. Paint order is leaving tokens,
then survivors, then arrivals. Survivors are keyed by their
destination token, so after a morph the resting elements are the same ones
that travelled. The default morph peaks at 106 spans on its first frame: 73
leaving and 33 surviving. The rest state of the new version is 45.

## Determinism

Every value derives from `useCurrentFrame()`, `useVideoConfig()` and props.
Time is `frame × 30 / fps × speed`. There is no randomness at all: staggers
come from line ranks, so no seed is needed. The tokenizer, diff and layout are
pure and memoized on their inputs only. The per-frame state is a pure function
of time and layout. There is no React state, CSS animation or transition, and
nothing accumulates across frames, so any frame renders correctly when seeked
to directly.

## Handoff and usage

Put it full-frame over a `<Backdrop>`. The docs preview uses `#f1eee7` via
`previewBackdrop`, and the dark panel sits on warm paper. Feed your own
versions through `steps`. `getCodeMorphDuration({ steps, morphDuration,
highlight, speed })` gives the composition length, 24-frame hold included.
Three or more steps chain: each morph starts at its `at` or when the previous
one ends, whichever is later.

Files: `registry/remocn/code-morph/index.tsx`, `config.ts`,
`__tests__/code-morph.test.ts`, and `content/docs/ui-blocks/code-morph.mdx`.
The lead integrates registry.json, the preview index, the manifest,
navigation, and the changelog after the user approves the preview.
