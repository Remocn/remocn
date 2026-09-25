# Agent Run

Direction: the part of an AI product video that happens after the prompt. A
brand-neutral chat panel shows the prompt someone just sent. A Thinking status
shimmers while a short plan streams. Tool calls run one after another, each
spinner closing into a check at the step's end. Then the answer streams in as
markdown, in bursts. A small timer in the header counts real elapsed seconds
through the run. It lives in the AI category (`content/docs/ai/`) next to the
branded composers (`claude-chat`, `chat-gpt`, `v0`, `claude-code`,
`opencode`). Those type the prompt. This one shows what happens after Enter,
so a demo can cut from a composer straight into it.

It is a product piece. It follows the quality bar in
`skills/remocn/references/anatomy.md` section 3: the product is large and
legible, the content is real and specific, there is one accent, and there is
no wall of text.

## Look

- A single panel, like a modern AI app: a flat surface, a 1px border, radius
  18, and one small neutral shadow (`0 1px 2px`). There is no gradient, glow,
  blur, glass or sparkle icon anywhere. The root paints nothing: the panel is
  the artwork. The docs preview puts it on a flat `#ececea` field via
  `previewBackdrop`, and the docs examples use a `<Backdrop>`.
- Header, 48px, with a 1px divider under it. The thread title sits on the
  left, and the timer on the right. While running, the timer is an accent
  spinner plus `8.4s` in tabular numerals. When the run ends, it is a muted
  check and the final time.
- Scrolling column (736px wide, 32px side padding), in order:
  - The prompt, as a right-aligned user bubble.
  - The status row: `Thinking` with a restrained shimmer, then
    `Thought for 4s`.
  - The plan, as a numbered list in muted text behind a 2px left rule.
  - The tool calls, in one bordered card split by 1px dividers.
  - The answer.
- Type: body 16/26, prompt 16/24, plan 15/24, tool rows 15px, meta 13px,
  code 14/22 mono, and headings at 20/30 (`##`) or 22/32 (`#`). The fonts are
  system stacks: `Inter, Geist, ui-sans-serif, system-ui, …` and
  `"JetBrains Mono", "Geist Mono", ui-monospace, …`. The file may import only
  from `remotion` and `react`, so it loads no font. A project that loads Inter
  or JetBrains Mono gets them automatically.
- Color: two neutral themes, `light` and `dark`, plus one `accentColor`
  (default `#2563eb`).
  - The light theme uses a `#ffffff` panel, `#1c1c1a` text, `#63635e` muted
    text and `#f3f3f1` surfaces.
  - The dark theme uses a `#161616` panel, `#ececea` text, `#a2a29d` muted
    text and `#212120` surfaces.
  - The accent marks only the active state (running spinners) and the
    citation chips. The chip tint is
    `color-mix(in srgb, accent 12%, transparent)`, or 22% on dark, so any CSS
    color works. On dark, citation text mixes the accent 62% toward white to
    stay readable.
  - Done checks, the plan and the thinking shimmer are neutral.
  - Code has two tones and no extra hues: punctuation and comments are subtle,
    strings muted, and everything else is the foreground.

## Sizing rule

Every size is a reference px at a 720px-tall frame. The 800px panel renders
at reference size and is scaled by

`unit = min(height / 720, width / 880)`

880 is the panel plus a 40px margin on each side. At 16:9 this is exactly
`height / 720`, like confetti and the motion-graphics accents, and the same
as `claude-chat`'s `min(width / 1280, height / 720)`. The width cap keeps the
panel inside square and vertical frames. The panel height adapts to the
frame: `clamp(height / unit − 80, 360, 960)`.

| Frame | unit | Panel height | Scroll viewport |
| --- | --- | --- | --- |
| 1280×720 | 1 | 640 | 590 |
| 1920×1080 | 1.5 | 640 | 590 |
| 1080×1080 | 1.227 | 800 | 750 |
| 1080×1920 | 1.227 | 960 | 910 |

At 9:16 the whole default run fits without scrolling. The panel is centered
in its parent.

## Props

| Prop | Default | Meaning |
| --- | --- | --- |
| `run` | `defaultAgentRun` | `{ title?, prompt, plan?, steps?, answer }`, the whole script |
| `theme` | `"light"` | `"light"` or `"dark"` panel |
| `accentColor` | `#2563eb` | Running spinners and citation chips |
| `compression` | 3 | Real seconds per video second, clamped to 0.25–20; tool calls last `duration / compression` on screen |
| `seed` | 1 | Seeds the chunk sizes, intervals and pauses of the plan and answer streams |
| `speed` | 1 | Shared playback multiplier (0 freezes the first frame) |
| `className` | none | Class on the full-frame root |

A step is `{ name, detail?, duration, icon?, sources? }`. `duration` is real
seconds. `icon` is one of `chart`, `database`, `search`, `book`, `globe`,
`terminal` or `file`. The geometry is copied from lucide (`chart-column`,
`database`, `search`, `book-open`, `globe`, `terminal`, `file-text`). The code
panel's `copy` and the chips' `globe` and `file-text` come from the same
source. With no icon, a step with `sources` gets `book` and any other step
gets `terminal`. `sources` is a list of source labels. The row shows as many
chips as fit on one line, at most 6, then a `+N` chip. A label that looks
like a domain gets the globe icon; any other label gets the file icon.

The answer is a small markdown subset:

- `#` and `##` headings (`###` renders as `##`)
- paragraphs, split by blank lines
- `-` or `*` bullets
- inline `` `code` `` and `**bold**`
- `[n]` citations
- fenced code blocks with an optional language (an unclosed fence runs to
  the end)

Anything else renders as plain text.

The controls are `theme` (select), `accentColor`, `compression` (1–8, step
0.5) and `seed` (1–99). Number controls carry `hiddenFromList: false`, and
`speed` comes from the shared controls. `run` is not a scalar, so the preview
uses the default script.

## Real time and video time

The run is a chain of segments. Each has a video span (30 fps frames) and a
real span (seconds):

| Segment | Video frames | Real seconds |
| --- | --- | --- |
| Think (run start → plan done + 8) | from the plan stream | `frames × compression / 30` |
| Gap before each tool | 5 | `5 × compression / 30` |
| Tool call | `clamp(round(duration × 30 / compression), 12, 120)` | `duration` |
| Gap before the answer | 8 | `8 × compression / 30` |
| Answer stream | from the chunk schedule | `frames × compression / 30` |

The header timer is the piecewise-linear real time at the current frame. It
starts at 0.0 when the run starts and freezes at the total when the last
answer chunk lands. Every tool row therefore spans exactly its `duration` on
the timer, and the row's label shows the same number. At `compression` 3 the
default steps (1.4, 2.3, 1.1 and 3.2s) play in 14, 23, 12 and 32 frames. The
1.1s step would be 11 frames, and the 12-frame floor holds it long enough to
read its spinner. The 120-frame cap keeps a very long call from stalling the
video, and inside a clamped span the timer simply runs at the rate that lands
on the real duration.

## Timeline (30 fps, speed 1, default run, seed 1)

| Frames | Beat |
| --- | --- |
| 0–14 | The panel fades up 14px on an expo ease-out; the prompt bubble fades up 8px over 4–14 |
| 16 | The run starts: the timer shows 0.0s and `Thinking` fades in over 6 frames with its shimmer |
| 30–48 | The plan streams in 8 chunks (plan lines start at 30, 39 and 44) |
| 56–64 | Think ends at 56 (4.0s on the timer); `Thinking` crossfades to `Thought for 4s` and rises 4px |
| 61–75 | Query analytics: the row opens over 61–69, the spinner turns, and at 75 it closes; the check draws 78–85, and `1.4s` fades in over 77–83 |
| 80–103 | Run SQL (2.3s) opens while the previous check is still drawing |
| 108–120 | Search logs (1.1s, held at the 12-frame floor) |
| 125–157 | Read 12 sources (3.2s); the chips pop at 129, 133, 137, 141 and 144, and `+7` pops at 148 |
| 165–170 | The heading streams in body style behind a muted `## ` |
| 170–178 | Its newline arrives, so it takes heading style and morphs to 20px semibold as the marker collapses |
| 177–213 | The paragraph streams; citation `1` pops at 201 and `2` at 213 |
| 201 | The column starts gliding up, 16 frames ahead of the first line that needs room |
| 217–257 | The three bullets pop at 217, 233 and 244 and stream |
| 262–275 | The code panel opens on its fence at 262; its four lines open at 263, 265, 268 and 272 |
| 280–294 | `**Fix:** add the attribute and ship 4.12.1 today.` lands; the column comes to rest at 279px by 288, and the run ends at 294 with the timer at 27.7s |
| 294–304 | The header spinner closes into a check |
| 310 | `agentRunLength`: the last chunk fade, pop and glide have settled |
| 310–355 | The docs preview holds the finished answer (`durationInFrames` 355) |

`getAgentRunDuration(run, { seed, compression, speed })` returns
`ceil(settled / speed) + 45`, where `settled = runEnd + 16`. So the default is
355, 200 at `speed` 2, 514 at `compression` 1 and 45 at `speed` 0.
`agentRunLength` (310) is the docs `length`.

## Signature motion: bursty streaming

The plan and the answer both stream through one chunk engine. The engine
works on the raw markdown source and is seeded with remotion `random()` using
string keys `agent-run-{seed}-{plan|answer}-{size|gap|pause|hold|block}-{n}`.

1. Tokenize: a hand-written scanner splits the source roughly the way a BPE
   tokenizer does. A token is a word with its leading spaces, a group of up
   to three digits, one punctuation mark, a run of trailing spaces, or one
   newline. The default answer has 157 tokens over 458 characters, and the
   plan has 27.
2. Chunk sizes: each chunk takes 1–6 tokens, weighted 8/16/22/22/17/15%
   (mean 3.7). A chunk that reaches a blank line stops right after it. So
   every block starts on a fresh chunk, and a chunk can be just the `\n\n`
   that completes a block.
3. Intervals: the gap before each chunk is 1–4 whole frames, weighted
   42/33/16/9%. With probability 6% a short pause of 4–7 frames is added. A
   chunk that opens a new block waits 2–4 extra frames, so the heading,
   paragraph, list, code fence and closing line arrive as separate beats. On
   seed 1 the 50 answer chunks land over 129 frames. Gaps span 1–8 frames,
   80 of the 129 frames reveal nothing, and the busiest frame reveals 29
   characters.
4. Reveal: at time `t` the stream shows the raw source up to the end of the
   last chunk that has arrived. Each chunk fades from 0 to 1 over 5 frames on
   an ease-out cubic, so it shows at 49% on its arrival frame, then 78%, 94%
   and 99%. Text therefore arrives in irregular bursts at irregular moments,
   never at a constant rate per character.

The markdown renders progressively from the same revealed offset:

- Heading: the line streams in body style, 16px regular, behind a muted
  `## ` marker. Its box is already the heading's final 30px height, so
  nothing below it will ever shift. When its newline arrives, the heading
  style applies:
  - The weight eases from 400 to 600 on the same curve. A variable font
    interpolates it; static weights step once, mid-morph, while the text
    grows.
  - The text scales from 0.8 × 20px (the same 16px on screen) to 1 × 20px,
    anchored left.
  - The marker fades and its width collapses.

  This takes 8 frames on the house expo ease-out `cubic-bezier(0.16, 1, 0.3, 1)`.
- Bullets: an item's 6px dot pops as soon as its `-` arrives, on a back-out
  curve (`s = 1.7`). Per frame it goes 0.49, 0.82, 1.01, 1.09, 1.10, 1.06,
  1.02, 1. Its text streams after it.
- Inline code and bold are styled from their first character. The markers
  never show.
- Citations: `[n]` stays hidden until its closing bracket arrives. Then an
  accent chip fades in over 4 frames and scales 0.6 → about 1.05 → 1 over 8
  frames (back-out, `s = 2`).
- Code block: the panel opens as soon as its three backticks arrive. It grows
  from 0 to its 54px header-and-padding height over 8 frames on the expo
  ease-out, and the language label streams in the header. Each code line
  opens its 22px row over 5 frames as its first token arrives, then streams
  inside. So the panel's bottom edge moves smoothly and never steps.

Wrapping is decided up front, so a word never jumps lines while it streams.
Each block wraps its final text greedily at word boundaries against an
estimated width. The estimate sums per-character em widths from a small class
table:

| Characters | em |
| --- | --- |
| narrow punctuation, `i l j I` | 0.3 |
| `f t r ( ) [ ] { } / \ -` | 0.44 |
| `< > = + ~ # $ & →` | 0.68 |
| digits | 0.66 |
| capitals | 0.74 |
| `m w …` | 0.9 |
| `M W @ % —` | 1.0 |
| everything else | 0.62 |

Inline code is 0.6em mono at 0.875 of the size plus 10px of padding, and a
citation chip counts as 20px. The table runs a few percent wider than Inter
semibold, measured from the font's advance widths. So a line in Inter, SF,
Segoe or Roboto never overflows, and the text column has 56px of slack even
for a wider fallback. Body text wraps at 680px (658px for bullets), headings
wrap at their own size, the plan at 640px and the prompt bubble at 520px.
Lines render with `white-space: pre` at those breaks. The default answer
lays out as heading 1 line, paragraph 2, bullets 1 + 1 + 1, code 4 and the
closing line 1. The content is 829px tall.

Calm column: every element has a fixed position from that static layout.
Content only ever grows at the bottom, so nothing already on screen reflows.
Each time a new line, row or panel appears at time `tᵢ`, the scroll target
steps to `max(target, bottomᵢ + 40 − viewport)`. The column offset is the sum
of those steps, each spread over a 24-frame smoothstep that starts 16 frames
before its content lands:

`scroll(t) = Σ Δᵢ × smoothstep((t − tᵢ + 16) / 24)`

Every step is known in advance, so the glide can begin before the text
arrives. It is monotonic and continuous, and it never jumps. At 16:9 the
default run scrolls 279px, all of it during the answer, peaking at 8.9px per
frame as the code block opens. A step is three quarters done when its content
lands. So even when a burst lands several lines within a few frames, the
newest line box stays at least 29px inside the viewport on seed 1 (16:9 and
1:1), and at least 23px on every seed from 1 to 99. With a 12-frame lead a
step is only half done on arrival, and on some seeds a burst leaves the newest
line up to 10px below the fold. A 16-frame glide that starts on arrival would
leave up to 65px of new text below the fold for 18 frames and peak at 11.7px
per frame.

Tool rows:

- A row's height opens from 0 to 40 (74 with a chips line, plus a 1px
  divider) over 8 frames on the expo ease-out, and its content fades in over
  6.
- The spinner is a lucide-sized circle (r 10, stroke 2) over a faint track.
  An accent arc of 28% turns at a constant 12° per frame; spinning is a
  constant drift, so linear is fine.
- At the step's compressed end, the arc sweeps to a full circle over 8 frames
  on the expo ease-out.
- Meanwhile the turn decelerates linearly to rest, 48° more, and the accent
  crossfades to the muted done color on a smoothstep.
- The check (`m9 12 2 2 4-4` from lucide `circle-check`) draws in with an
  ease-out cubic from frame 3 to frame 10 of the resolve. The duration label
  fades in over frames 2–8.
- Source chips pop into the reserved line one after another. The first
  starts 4 frames into the step, and the `+N` chip pops at 70% of it. Each
  fades in over 4 frames and scales 0.8 → about 1.02 → 1 over 8 frames.
- The next row opens 5 frames after a resolve, while its check is still
  drawing.

The header timer uses the same spinner and resolves when the run ends.

Thinking shimmer: `Thinking` is drawn per character. A soft band three
characters wide sweeps left to right once every 30 frames. It takes each
character from 45% to full opacity with a `(1 − d²)²` falloff. It is a
constant drift in the neutral foreground, with no gradient text and no
accent. When the think segment ends, the label crossfades to `Thought for 4s`
over 8 frames on the expo ease-out, rising 4px.

Nothing visible moves linearly except the spinners and the shimmer.
Overlapping action comes from:

- chunk fades that overlap
- the next tool row opening under a check that is still drawing
- chips that pop one after another
- the column that starts gliding ahead of the text

Every overshoot is small and only marks an arrival: a bullet peaks at 1.10, a
citation at 1.05 and a chip at 1.02.

## Determinism

Every value derives from `useCurrentFrame()`, `useVideoConfig()`, the props
and seeded `random()`. Time is `frame × 30 / fps × speed`. The parse, the
wrap layout, the chunk schedules, the segment table and the scroll steps are
pure functions of the run, seed, compression and frame size. The component
memoizes them on those inputs (`getAgentRunModel`). The per-frame state
(`getAgentRunState`) is a pure function of time and that model. Nothing
accumulates between frames, so any frame renders correctly when seeked
directly. Frame `2n` at 60 fps and frame `2n` at `speed` 0.5 both equal frame
`n` at 30 fps.

## Default content

- Title: `Checkout conversion drop`
- Prompt: `Why did checkout conversion drop last week?`
- Plan:
  1. `Compare the checkout funnel with the week before`
  2. `Break the drop down by browser and step`
  3. `Check what shipped and what the error logs say`
- Tools:
  1. `chart` Query analytics · `checkout funnel, last 7 days vs prior 7` ·
     1.4s
  2. `database` Run SQL · `conversion by browser and step` · 2.3s
  3. `search` Search logs · `Apple Pay errors on Safari` · 1.1s
  4. `book` Read 12 sources · 3.2s. Its sources are `Checkout funnel`,
     `Browser report`, `Release 4.12`, `PR #2186`, `webkit.org`,
     `developer.mozilla.org`, `Payments runbook`, `Error log`,
     `Incident notes`, `Apple Pay guide`, `Support tickets` and
     `Status page`. The first five show as chips, then `+7`.
- Answer:

  ```md
  ## Apple Pay broke on Safari in release 4.12

  Checkout conversion fell from 3.4% to 2.7% last week, a 21% drop [1]. All of it comes from the payment step on Safari, 41% of checkouts [2].

  - Safari conversion halved, from 3.5% to 1.8%
  - Chrome and Firefox held steady at 3.3%
  - 4.12 moved the card form into an iframe without `allow="payment"` [3]

  ~~~tsx
  <iframe
    src={cardFormUrl}
    allow="payment"
  />
  ~~~

  **Fix:** add the attribute and ship 4.12.1 today.
  ```

  (The real default uses a backtick fence.)

The numbers add up. Safari carries 41% of checkouts and falls from 3.5% to
1.8%, while the rest hold at 3.3%. That takes the blend from 3.38% to 2.69%,
which is the 3.4% → 2.7% drop, or −21%. Apple Pay inside a cross-origin
iframe needs `allow="payment"`, so the fix is specific and real.

## Exports

- Components and data: `AgentRun`, `defaultAgentRun`, `agentRunDefaults`,
  `agentRunLength` and `AGENT_RUN_THEMES`.
- Timeline: `getAgentRunDuration`, `getAgentRunTimeline`, `getAgentRunTime`
  and `getAgentRunElapsed`.
- Streaming: `tokenizeAgentRun`, `getAgentRunChunks`, `getAgentRunReveal` and
  `getAgentRunArrival`.
- Parsing and layout: `parseAgentRunMarkdown`, `wrapAgentRunInline`,
  `estimateAgentRunWidth`, `getAgentRunCodePieces`, `fitAgentRunChips` and
  `getAgentRunLayout`.
- Frame and state: `getAgentRunFrame`, `getAgentRunGrowth`,
  `getAgentRunScrollSteps`, `getAgentRunScroll`, `getAgentRunModel`,
  `getAgentRunState`, `getAgentRunSpinner` and `getAgentRunShimmer`.
- Display: `getAgentRunPalette` and `formatAgentRunSeconds`.
- Types: `AgentRunScript`, `AgentRunStep`, `AgentRunProps` and the rest.

## Handoff and usage

Cut to it right after a composer (`claude-chat`, `chat-gpt`) sends its prompt,
or use it as the product-reveal beat of a demo. Pass your own `run`: the
steps, their real durations and the answer. The timeline, timer and duration
follow from them. `getAgentRunDuration(run, { seed, compression, speed })`
sizes the `Sequence`. Raise `compression` to shorten long tool calls. Keep the
answer to a heading, a short paragraph, a few bullets and one small code
block. The panel scrolls, but a legible answer is short.

Files: `registry/remocn/agent-run/index.tsx`, `config.ts`,
`__tests__/agent-run.test.ts` and `content/docs/ai/agent-run.mdx`. The lead
integrates registry.json, the preview index, the manifest, navigation
(`content/docs/ai/meta.json`, the AI index cards) and the changelog after the
user approves the preview. The docs cite `code-morph` in `avoidWhen`, so that
sibling must be in the registry before the docs gate runs.
