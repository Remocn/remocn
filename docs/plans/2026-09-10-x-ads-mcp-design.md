# X Ads MCP — editable reference reconstruction

## Approved brief

The user approved reconstruction of the supplied `XSHgA_pUBKpD4PXG.mp4`,
preserving X Ads MCP branding, English copy, scene order, pacing, and the original
soundtrack in the local export. The source is 480×270, 30 fps, 1405 frames
(46.833418s picture, 46.869333s audio). Output: 1920×1080, 60 fps, 2810 frames.

## Approach

Create an installable `x-ads-mcp` template. Reuse the catalog's Typed Split Wipe
and Caret primitives, with reference-specific React/SVG scenes for the terminal,
geography carousel, tool execution, and performance chart. A generic terminal
composition was considered, but custom framing gives control over the distinctive
horizontal command tracking and large type-to-panel transitions. No source-video
playback, screenshot panels, or generated photographic assets are needed.

## Scene plan (seconds)

| Range | Scene |
| --- | --- |
| 0–2.2 | Typed introduction, segmented exit |
| 2.2–6.4 | Long campaign command, horizontally tracking caret |
| 6.4–8.1 | Fetching campaign data with elapsed timer |
| 8.1–10.7 | Campaign analysis in a full terminal |
| 10.7–12.55 | Launch it command |
| 12.55–16.8 | Rounded geography aperture and rotating country outlines |
| 16.8–19.9 | Tool execution log |
| 19.9–22 | Summer Collection delivery response |
| 22–24 | Campaign creation terminal |
| 24–25.6 | Grow your performance headline |
| 25.6–27.8 | Getting campaign stats timer |
| 27.8–31.4 | Performance terminal and follow-up |
| 31.4–32.85 | So what would you change? command |
| 32.85–37.35 | Budget recommendation, horizontal/scale type travel |
| 37.35–38.8 | Double the budget command |
| 38.8–40.8 | Growing green performance bars |
| 40.8–43 | Stay in the loop |
| 43–46.8333 | Outlined X resolves to white and fades out |

These are authoring boundaries measured from half-second reference sheets;
transition overlaps are kept within the adjacent scene choreography.

## Content and customization

Keep copy, country labels/outlines, terminal rows, budget values, chart data,
colors, and optional logo/audio sources separate from animation code. Optional
props preserve defaults, empty lists get safe fallbacks, and changing a headline
must not change the composition duration. Names, budgets, results, and financial
figures reproduce demo content; they are not claims about a live ad account.

The 480×270 design surface scales uniformly. Typography is bundled through font
packages. Country outlines are vector assets; reference text too small to recover
reliably is transcribed approximately and documented as such. All motion derives
from Remotion's playhead and supports direct seeking. Named sequences and key
interactive layers appear in Studio, with a props schema for customization.

## Implementation checklist

- [x] Inspect repository, reference metadata, full contact sheet, and detailed frames.
- [x] Confirm reconstruction strategy and output spec with the user.
- [x] Build typed content, timing helpers, and independently editable scenes.
- [x] Add registry item, preview config, docs, changelog, and Studio entry point.
- [x] Add seek/timeline/prop/packaging tests and deterministic review/render scripts.
- [x] Review key stills and edited props; compare with the reference.
- [x] Run targeted tests, TypeScript, lint, site build, manifest and registry builds.
- [x] Export the full film, mux the local source audio, verify streams and cut frames.

The requested writing-plans skill is not installed; this document is the local
implementation plan. The source MP4, extracted stills, and reference soundtrack
remain local and are not included in the registry package.

## Verification

- 35 targeted tests pass (6039 assertions), including frame coverage, rate
  conversion, explicit Studio chapter instances, changed props, registry import
  closure, and Unicode-safe typing in Typed Split Wipe.
- TypeScript, lint, and the production site build pass. Existing warnings remain
  in `app/globals.css` (unused suppression) and the OG image route (dynamic
  filesystem tracing); neither belongs to this template.
- Preview manifest contains 298 entries. All 14 installable template modules and
  the updated Typed Split Wipe dependency match their generated registry payloads.
- Reviewed key frames across the full timeline and edited title, country, accent,
  and chart props. Reference comparisons prompted corrections to command timing,
  country order, terminal holds, the final chart hold, and recommendation travel.
- Remotion Studio at `http://localhost:4003/XAdsMcp` exposes all 18 chapters
  individually. Motion remains code-authored; the props schema exposes content
  and data. No source-video frames or audio are shipped as registry assets.
- Final `out/x-ads-mcp.mp4`: H.264, 1920×1080, 60 fps, 2810 frames,
  46.833333 seconds; AAC mono 48 kHz. Full decode succeeds. Reviewed the final
  contact sheet and before/after chapter-boundary frames. The first 46.8 seconds
  of decoded audio correlate with the reference at 0.99937 with zero offset.
- `out/x-ads-mcp-comparison.mp4` places the original on the left and the rebuilt
  picture on the right. Both local videos are ignored output artifacts.

Country silhouettes are derived from the public-domain Natural Earth 110m country
dataset. The compressed source does not support a claim of pixel identity: fine
terminal copy, chart labels, type metrics, and outline choreography are approximate.
