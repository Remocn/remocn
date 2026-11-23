import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { atPreviewRate, PREVIEW_FPS, previewScale } from "./frame-rate";

describe("previews play at the site's frame rate", () => {
  it("plays a 30 fps config at 60: the same seconds in twice the frames", () => {
    const own = { fps: 30, durationInFrames: 90, compositionWidth: 1280 };
    const played = atPreviewRate(own);
    expect(played).toEqual({
      fps: PREVIEW_FPS,
      durationInFrames: 180,
      compositionWidth: 1280,
    });
    expect(played.durationInFrames / played.fps).toBe(
      own.durationInFrames / own.fps,
    );
  });

  it("leaves a preview that already runs at the site's rate as it is", () => {
    const template = { fps: 60, durationInFrames: 1600 };
    expect(atPreviewRate(template)).toBe(template);
    const ntsc = { fps: 60000 / 1001, durationInFrames: 960 };
    expect(atPreviewRate(ntsc)).toBe(ntsc);
  });

  it("holds a preview at the rate its config names", () => {
    const heavy = { fps: 30, durationInFrames: 90, previewFps: 30 };
    expect(atPreviewRate(heavy)).toBe(heavy);
  });

  it("scales still frames the same way", () => {
    expect(previewScale(30)).toBe(2);
    expect(previewScale(60)).toBe(1);
    expect(previewScale(30, 30)).toBe(1);
  });
});

describe("the player picks a frame from the screen's refresh", () => {
  // `patches/@remotion%2Fplayer@….patch` replaces the player's clock, which
  // read `performance.now()` and repeated then skipped a frame for a whole
  // playback whenever a frame boundary landed on a refresh. Bun applies the
  // patch on install; an upgrade of the player that drops it would bring the
  // stutter back with nothing failing, so the installed files are read here.
  for (const file of [
    "node_modules/@remotion/player/dist/esm/index.mjs",
    "node_modules/@remotion/player/dist/cjs/use-playback.js",
  ]) {
    it(`${file} carries the patch`, () => {
      const source = readFileSync(file, "utf8");
      expect(source).toContain(
        "time = stamp - clock.startedTime + refresh / 2",
      );
    });
  }
});
