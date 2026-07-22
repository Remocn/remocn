<p align="center">
  <img src="./public/hero.png" alt="remocn — shadcn registry for Remotion" />
</p>

![GitHub Health](https://shieldcn.dev/group/github/stars/kapishdima/remocn+github/forks/kapishdima/remocn+badge/%E2%9D%A4%EF%B8%8F%20Sponsor-this%20project-FF69B4.svg?variant=secondary)

# Remocn

remocn is a copy-paste component library for building videos in Remotion. Instead of writing every fade, wipe, and kinetic title from scratch, you `npx shadcn add` a polished primitive into your project and own the code. Built for solo builders and small teams who need a product demo video shipped today, not next week.

## Why remocn

Production-ready Remotion code: every component uses useCurrentFrame(), interpolate(), and spring() correctly. No Math.random() traps that break rendering.
Own your code: components are copied into your project, not installed as a dependency. Tweak them however you like.
Live previews: each component page mounts a real @remotion/player you can scrub frame-by-frame

## Installation

Remotion is a prerequisite — set up a Remotion project first if you don't have one (`npx create-video@latest`). Then add any component from the registry:

```bash
npx shadcn@latest add @remocn/blur-reveal
```

## Setup with AI

You need two things: an AI coding agent and an empty folder.

**1. Get an agent.** We recommend Claude Code, also works with ChatGPT, Opencode and others.
**2. Open the agent in an empty folder and paste:**

```text
Set up a new Remotion video project in this folder, then install the remocn agent skill: npx skills add Remocn/remocn --yes. When you're done, start the preview studio so I can watch the video while we work
```

When a browser tab opens with an empty video player, you're ready. Pick a [guide](https://remocn.dev/docs/guides) and make it yours.
