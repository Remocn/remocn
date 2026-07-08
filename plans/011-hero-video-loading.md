# Plan 011: Stop the 18 MB hero video from dominating landing-page load

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 361f442..HEAD -- "app/(home)/components/sections/hero.tsx" public/introducing-remocn.mp4`
> On drift, compare the excerpt below against live code; mismatch = STOP.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: perf
- **Planned at**: commit `361f442`, 2026-07-07

## Why this matters

`public/introducing-remocn.mp4` is 18 MB (17,471 KB — 16× larger than the next-largest asset) and the hero renders it with `autoPlay` + `preload="auto"`, so every landing visit starts an immediate full-size video fetch that competes with the JS bundle for bandwidth. On slow links this dominates time-to-interactive. Two independent fixes: re-encode the file (the big win — this content should be ~3-5 MB at visually identical quality for a muted UI demo loop), and stop over-fetching before playback starts.

## Current state

`app/(home)/components/sections/hero.tsx:129-139`:

```tsx
              {/* biome-ignore lint/a11y/useMediaCaption: decorative hero loop, muted with no dialogue */}
              <video
                ref={videoRef}
                src="/introducing-remocn.mp4"
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                className="block h-full w-full object-cover"
              />
```

There is already a `videoRef` and a `togglePlay` button below the element (line ~141). The video sits above the fold — it IS the hero visual, so lazy-mounting it makes no sense; shrinking the payload does.

Available in-repo pattern for in-view logic (not needed here, referenced by Plan 012): `hooks/use-in-view.ts`.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| ffmpeg present | `ffmpeg -version` | version output (else see STOP) |
| Re-encode | see Step 1 | output file < 6 MB |
| Size check | `ls -la public/introducing-remocn.mp4` | < 6 MB |
| Build | `bun run build` | exit 0 |

## Scope

**In scope**:
- `public/introducing-remocn.mp4` (replace with re-encoded version)
- `public/introducing-remocn-poster.jpg` (create, from frame 0)
- `app/(home)/components/sections/hero.tsx` (only the `<video>` attributes)

**Out of scope**:
- Any other `<video>`/Player on the site.
- Layout/styling changes around the hero.
- Self-hosted → CDN moves.

## Git workflow

Do NOT run any git write commands. The repo owner handles all git operations.

## Steps

### Step 1: Re-encode the video

Keep the ORIGINAL safe first: copy `public/introducing-remocn.mp4` to the scratch/tmp dir (NOT into the repo). Probe it: `ffprobe -v error -show_entries stream=width,height,r_frame_rate,codec_name -of default=noprint_wrappers=1 public/introducing-remocn.mp4`. Then re-encode targeting the delivered size (the hero renders at most ~1280px wide):

```
ffmpeg -i <original> -vf "scale='min(1600,iw)':-2" -c:v libx264 -crf 26 -preset slow -movflags +faststart -an <tmp-out>.mp4
```

`-an` drops the audio track (the element is permanently muted). `+faststart` moves the moov atom so playback starts before full download. If the result is > 6 MB, raise CRF to 28 and retry once. Visually compare a few frames (`ffmpeg -ss 2 -i <file> -frames:v 1 out.png` for both) — no visible blocking on UI text.

Replace `public/introducing-remocn.mp4` with the re-encoded file.

**Verify**: `ls -la public/introducing-remocn.mp4` → < 6 MB; the frame-extract comparison shows no legibility loss.

### Step 2: Generate a poster

`ffmpeg -i public/introducing-remocn.mp4 -frames:v 1 -q:v 3 public/introducing-remocn-poster.jpg`

**Verify**: poster exists, < 150 KB (if larger, add `-vf "scale=1280:-2"`).

### Step 3: Adjust the video element

In `hero.tsx`, change the `<video>`: `preload="auto"` → `preload="metadata"`, add `poster="/introducing-remocn-poster.jpg"`. Keep `autoPlay muted loop playsInline` exactly as they are (autoplay will still fetch, but `faststart` + smaller file makes the first frames near-instant, and the poster covers the gap).

**Verify**: `bun run build` → exit 0. `grep -n 'preload="metadata"' app/\(home\)/components/sections/hero.tsx` → 1 match.

## Test plan

No unit tests (asset + attribute change). Manual gate for the owner: load the landing page with DevTools network throttled to "Fast 4G" — video area shows the poster immediately and playback starts within ~2s; total video transfer < 6 MB.

## Done criteria

- [ ] `public/introducing-remocn.mp4` < 6 MB with `faststart`
- [ ] Poster exists and is wired via the `poster` attribute
- [ ] `preload="metadata"`; no other attribute changed
- [ ] `bun run build` exits 0
- [ ] `plans/README.md` status row updated (note where the original video backup was placed)

## STOP conditions

- `ffmpeg` is not installed and cannot be installed in your environment — report; the re-encode is then an owner action (still apply Step 3 minus poster).
- CRF 28 still yields > 8 MB — the source may be extremely long/high-motion; report duration/resolution instead of degrading quality further.
- `hero.tsx` no longer matches the excerpt.

## Maintenance notes

- Whenever the hero video is re-recorded, repeat Step 1's encode settings — raw screen recordings are routinely 10-20× oversized.
- The biome-ignore comment above the element is a functional directive — keep it.
- Reviewer: play the deployed video to the end once; CRF artifacts show up in high-motion sections last.
