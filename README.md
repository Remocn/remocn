<p align="center">
  <img src="./public/hero.png" alt="remocn — shadcn registry for Remotion" />
</p>

# remocn

> A shadcn registry of production-ready animations, transitions, backgrounds, and scenes for [Remotion](https://www.remotion.dev/).

remocn is a copy-paste component library for building videos in Remotion. Instead of writing every fade, wipe, and kinetic title from scratch, you `npx shadcn add` a polished primitive into your project and own the code. Built for solo builders and small teams who need a product demo video shipped today, not next week.

## Why remocn

- **Remotion has no batteries-included component library** You either build every animation from scratch or copy snippets from blog posts. remocn gives you a curated registry of primitives and full scenes that just work.
- **Polished motion is hard** Easing curves, spring physics, transition timing — remocn ships components that already feel right, so you can focus on storytelling instead of tuning `interpolate()` calls.
- **You own the code** Components are copied into your repo (shadcn philosophy). No runtime dependency, no version lock-in, no black box — tweak anything you want.
- **Solo builders need demo videos fast** Compose a launch trailer, changelog clip, or feature walkthrough from prebuilt blocks in an afternoon.

## What's inside

64+ components across five categories:

- **Text animations** — Blur Reveal, Typewriter, Shimmer Sweep, Tracking In, Slot Machine Roll, Matrix Decode, RGB Glitch Text, Kinetic Type Mask, Marker Highlight, Infinite Marquee, and more
- **Backgrounds & visual primitives** — Mesh Gradient Background, Dynamic Grid, Spring Pop In, Pulsing Indicator
- **Transitions & wipes** — Chromatic Aberration Wipe, Frosted Glass Wipe, Directional Wipe, Grid Pixelate, Spatial Push, Zoom Through Transition
- **UI blocks** — Glass Code Block, Terminal Simulator, Browser Flow, Toast Notification, Animated Charts, Code Diff Wipe, Device Mockup Zoom, Simulated Cursor, Morphing Modal, Progress Steps
- **Full compositions** — Product Launch Trailer, Hero Device Assemble, Changelog Bite, Pricing Tier Focus, Landing Code Showcase, Terminal to Browser Deploy, Live Code Compilation

Browse the full catalog with interactive previews at [remocn.dev](https://remocn.dev).

## Installation

Remotion is a prerequisite — set up a Remotion project first if you don't have one (`npx create-video@latest`). Then add any component from the registry:

```bash
npx shadcn@latest add @remocn/blur-reveal
```

The component lands in `components/remocn/blur-reveal.tsx` and is yours to edit.

## Local development

This repo is a single Next.js app that hosts both the landing page / docs and the registry endpoint at `/r/[name]`.

```bash
bun install              # install dependencies
bun dev                  # run the site locally
bun run registry:build   # rebuild the shadcn registry JSON
bun run lint             # biome check
```

## Self-hosting (server-side MP4 render)

The `/stars` live generator renders MP4s server-side with `@remotion/renderer`
(headless Chromium), so export works in every browser. Either way, headless
Chromium needs its system libraries, the Chrome Headless Shell baked in, and the
Remotion entry pre-bundled. Two deploy paths on Coolify:

**Nixpacks (Coolify default build pack)** — `nixpacks.toml` declares the Chromium
apt packages so Nixpacks installs them. Set the Coolify commands in the UI:

- Build: `bun install && bun run build && bunx remotion browser ensure && bun run bundle:remotion`
- Start: `bun run start`

Under Nixpacks the `Dockerfile` is **not** used.

**Dockerfile build pack** — switch the resource's build pack to Dockerfile and the
included `Dockerfile` (Debian + Chromium libs) handles everything: it bakes in the
Chrome Headless Shell and the pre-bundled Remotion entry. No separate build/start
commands needed.

Sized for a Hetzner CPX42. Configure the render via env vars — see `.env.example`
(`RENDER_WORK_DIR`, `RENDER_MAX_CONCURRENT`, `REMOTION_CONCURRENCY`,
`RENDER_TIMEOUT_MS`, and the per-IP rate-limit knobs). Run `bun install` after
pulling dependency changes so `bun.lock` matches before building.

## Tech stack

- [Remotion](https://www.remotion.dev/) 4.0 + `@remotion/player` for in-browser previews
- [Next.js](https://nextjs.org/) 16 + React 19
- [Tailwind CSS](https://tailwindcss.com/) 4
- [Fumadocs](https://fumadocs.vercel.app/) for documentation
- [shadcn](https://ui.shadcn.com/) registry format

## License

MIT. Open core — primitives and base compositions are free forever. Premium blocks and a video builder are on the roadmap.
