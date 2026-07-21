import { describe, expect, it } from "bun:test";

import { crumpleTossConfig } from "../config";
import {
  type CrumpleTossTiming,
  creaseShading,
  crumpleSegments,
  crumpleTossLanding,
  crumpleTossPose,
} from "../index";

const AT = 12;
const BASE = { at: AT, crumpleSteps: 4, tossSteps: 5, step: 3 };
const CARD = { width: 380, height: 220 };

const numberControl = (name: string) => {
  const control = crumpleTossConfig.controls[name];
  if (control.type !== "number") {
    throw new Error(`${name} is not a number control`);
  }
  return control;
};

const controlValues = (name: string) => {
  const { min, max, step } = numberControl(name);
  return Array.from(
    { length: Math.floor((max - min) / step + 1e-9) + 1 },
    (_, i) => min + i * step,
  );
};

const at = (frame: number, timing: CrumpleTossTiming = BASE) =>
  crumpleTossPose({ frame, ...timing });

const posesOf = (phase: string, timing: CrumpleTossTiming = BASE) => {
  const step = timing.step ?? 3;
  const total = (timing.crumpleSteps ?? 4) + (timing.tossSteps ?? 5);
  return Array.from({ length: total }, (_, p) =>
    at(timing.at + p * step, timing),
  ).filter((pose) => pose.phase === phase);
};

const areaOf = (points: [number, number][]) => {
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[(i + 1) % points.length];
    sum += x1 * y2 - x2 * y1;
  }
  return Math.abs(sum) / 2;
};

describe("phases", () => {
  it("does nothing at all before `at`", () => {
    for (const frame of [0, 5, AT - 1]) {
      const pose = at(frame);
      expect(pose.phase).toBe("idle");
      expect(pose.crush).toBe(0);
      expect(pose.scale).toBe(1);
      expect(pose.rotate).toBe(0);
      expect(pose.x).toBe(0);
      expect(pose.y).toBe(0);
      expect(pose.opacity).toBe(1);
    }
  });

  it("uses half-open bounds, so crumpleSteps 4 means exactly four crush poses", () => {
    expect(posesOf("crumple")).toHaveLength(4);
    expect(posesOf("toss")).toHaveLength(5);
  });

  it("lands the boundaries on the right frames for every step", () => {
    for (const step of controlValues("step")) {
      const timing = { ...BASE, step };
      expect(at(AT, timing).phase).toBe("crumple");
      expect(at(AT + 4 * step - 1, timing).phase).toBe("crumple");
      expect(at(AT + 4 * step, timing).phase).toBe("toss");
      expect(at(AT + 9 * step - 1, timing).phase).toBe("toss");
      expect(at(AT + 9 * step, timing).phase).toBe("gone");
      expect(at(AT + 400, timing).phase).toBe("gone");
    }
  });

  it("holds every value constant inside one pose", () => {
    for (const base of [AT, AT + 3, AT + 15]) {
      for (const offset of [0, 1, 2]) {
        expect(at(base + offset)).toEqual(at(base));
      }
    }
  });
});

describe("the crush ramp", () => {
  it("folds the paper progressively and reaches a full crush on the last pose", () => {
    expect(posesOf("crumple").map((p) => p.crush)).toEqual([
      0.25, 0.5, 0.75, 1,
    ]);
  });

  it("stays fully crushed for the whole flight", () => {
    for (const pose of posesOf("toss")) {
      expect(pose.crush).toBe(1);
    }
  });

  it("reaches a full crush whatever crumpleSteps is", () => {
    for (const crumpleSteps of controlValues("crumpleSteps")) {
      const crush = posesOf("crumple", { ...BASE, crumpleSteps }).map(
        (p) => p.crush,
      );
      expect(crush).toHaveLength(crumpleSteps);
      expect(crush.at(-1)).toBe(1);
      expect(crush[0]).toBeCloseTo(1 / crumpleSteps, 9);
    }
  });
});

describe("the card is cut into segments", () => {
  const pieces = crumpleSegments({ ...CARD, seed: "toss" });

  it("covers the card exactly at rest, so there is no seam to see", () => {
    for (const size of [
      { width: 380, height: 220 },
      { width: 300, height: 300 },
      { width: 600, height: 160 },
    ]) {
      for (const segments of controlValues("segments")) {
        for (const layers of controlValues("layers")) {
          const covered = crumpleSegments({
            ...size,
            segments,
            layers,
            seed: "toss",
          })
            .map((piece) => areaOf(piece.clip))
            .reduce((sum, part) => sum + part, 0);
          expect(covered).toBeCloseTo(100 * 100, 6);
        }
      }
    }
  });

  it("cuts each wedge into one panel per layer", () => {
    for (const segments of controlValues("segments")) {
      for (const layers of controlValues("layers")) {
        expect(crumpleSegments({ ...CARD, segments, layers })).toHaveLength(
          segments * layers,
        );
      }
    }
  });

  it("starts the innermost panel of every wedge at the centre of the card", () => {
    for (const layers of controlValues("layers")) {
      const cut = crumpleSegments({ ...CARD, layers });
      cut.forEach((piece, i) => {
        expect(piece.clip.length).toBeGreaterThanOrEqual(3);
        if (i % layers === 0) {
          expect(piece.clip[0]).toEqual([50, 50]);
        } else {
          expect(piece.clip).not.toContainEqual([50, 50]);
        }
      });
    }
  });

  it("reaches the rim with the outer layer and holds the core back", () => {
    for (const layers of controlValues("layers")) {
      const cut = crumpleSegments({ ...CARD, layers });
      const touchesRim = (piece: { clip: [number, number][] }) =>
        piece.clip.some(
          ([x, y]) => x < 0.01 || x > 99.99 || y < 0.01 || y > 99.99,
        );
      cut.forEach((piece, i) => {
        expect(touchesRim(piece)).toBe(i % layers === layers - 1);
      });
    }
  });

  it("curls each wedge one way, steepening toward the rim", () => {
    for (const seed of ["toss", "a", "b", "c"]) {
      for (const layers of [2, 3]) {
        const cut = crumpleSegments({ ...CARD, layers, seed });
        for (let i = 0; i < cut.length; i += layers) {
          const wedge = cut.slice(i, i + layers).map((p) => p.rotate);
          for (let layer = 1; layer < layers; layer++) {
            expect(Math.sign(wedge[layer])).toBe(Math.sign(wedge[0]));
            expect(Math.abs(wedge[layer])).toBeGreaterThan(
              Math.abs(wedge[layer - 1]),
            );
          }
          const outer = 0.45 + 0.55;
          const core = 0.45 + (0.55 * 1) / layers;
          expect(Math.abs(wedge.at(-1)) / Math.abs(wedge[0])).toBeCloseTo(
            outer / core,
            9,
          );
        }
      }
    }
  });

  it("pulls every wedge toward the centre rather than pushing it out", () => {
    for (const piece of pieces) {
      const from: [number, number] = [
        (piece.origin[0] / 100) * CARD.width - CARD.width / 2,
        (piece.origin[1] / 100) * CARD.height - CARD.height / 2,
      ];
      expect(settledReach(piece)).toBeLessThan(Math.hypot(from[0], from[1]));
    }
  });

  it("shrinks and tilts each panel, so the paper folds instead of sliding", () => {
    for (const piece of pieces) {
      expect(piece.scale).toBeGreaterThan(0);
      expect(piece.scale).toBeLessThanOrEqual(1);
      expect(Math.abs(piece.rotate)).toBeLessThanOrEqual(46);
    }
    expect(new Set(pieces.map((p) => p.rotate)).size).toBe(pieces.length);
  });

  it("shrinks the rim panels hard, since they have the furthest to fold", () => {
    const layers = 2;
    for (const piece of crumpleSegments({ ...CARD, layers }).filter(
      (_, i) => i % layers === layers - 1,
    )) {
      expect(piece.scale).toBeLessThan(1);
    }
  });

  it("keeps the wad mostly lit, with shadow as the accent", () => {
    for (const segments of controlValues("segments")) {
      const tones = crumpleSegments({ ...CARD, segments }).map((p) => p.tone);
      expect(tones.some((t) => t < 2)).toBe(true);
      expect(tones.some((t) => t >= 2)).toBe(true);
    }
  });

  it("is deterministic per seed and folds differently across seeds", () => {
    expect(crumpleSegments({ ...CARD, seed: "toss" })).toEqual(pieces);
    expect(crumpleSegments({ ...CARD, seed: "other" })).not.toEqual(pieces);
  });

  it("tightens the wad as crushTo drops", () => {
    const wadOf = (crushTo: number) =>
      crumpleSegments({ ...CARD, crushTo }).reduce(
        (sum, piece) => sum + settledReach(piece),
        0,
      );
    expect(wadOf(0.15)).toBeLessThan(wadOf(0.7));
  });

  it("never cuts fewer than three wedges, whatever the layer count", () => {
    for (const layers of controlValues("layers")) {
      expect(crumpleSegments({ ...CARD, segments: 1, layers })).toHaveLength(
        3 * layers,
      );
    }
    expect(crumpleSegments({ ...CARD, segments: 9, layers: 0 })).toHaveLength(
      9,
    );
  });
});

describe("crease shading", () => {
  const piece = { tone: 0, rotate: 30, crease: 0.5 };

  it("breaks each facet into a lit side and a shadowed side", () => {
    const shading = creaseShading(piece, 1);
    expect(shading.startsWith("linear-gradient(")).toBe(true);
    expect(shading).toContain("rgba(255,255,255,0.66) 41.0%");
    expect(shading).toContain("rgba(255,255,255,0.18) 59.0%");
  });

  it("counter-rotates the light so it stays fixed while the facet turns", () => {
    expect(creaseShading(piece, 0)).toContain("-55.0deg");
    expect(creaseShading(piece, 1)).toContain("-85.0deg");
    expect(creaseShading({ ...piece, rotate: -30 }, 1)).toContain("-25.0deg");
  });

  it("keeps the fold inside the facet at every crease value", () => {
    for (const crease of [0, 0.3, 0.5, 0.7, 1]) {
      const stops = [
        ...creaseShading({ ...piece, crease }, 1).matchAll(/([\d.]+)%/g),
      ].map((match) => Number(match[1]));
      expect(stops).toEqual([...stops].sort((a, b) => a - b));
      expect(stops.at(0)).toBeGreaterThanOrEqual(0);
      expect(stops.at(-1)).toBeLessThanOrEqual(100);
    }
  });

  it("gives every tone a real value break, so no facet reads as flat", () => {
    for (let tone = 0; tone < 4; tone++) {
      const shading = creaseShading({ ...piece, tone }, 1);
      const colours = new Set(
        [...shading.matchAll(/rgba\([^)]+\)/g)].map((match) => match[0]),
      );
      expect(colours.size).toBe(2);
    }
  });
});

const settledReach = (piece: {
  origin: [number, number];
  dx: number;
  dy: number;
}) =>
  Math.hypot(
    (piece.origin[0] / 100) * CARD.width - CARD.width / 2 + piece.dx,
    (piece.origin[1] / 100) * CARD.height - CARD.height / 2 + piece.dy,
  );

describe("fold randomness", () => {
  it("folds perfectly regularly at zero, with no tilt and no crease", () => {
    const layers = 2;
    const pieces = crumpleSegments({ ...CARD, layers, randomness: 0 });
    for (const piece of pieces) {
      expect(Math.abs(piece.rotate)).toBe(0);
      expect(piece.crease).toBe(0.5);
    }
    for (let layer = 0; layer < layers; layer++) {
      const reaches = pieces
        .filter((_, i) => i % layers === layer)
        .map(settledReach);
      for (const reach of reaches) {
        expect(reach).toBeCloseTo(reaches[0], 6);
      }
    }
  });

  it("settles the core nearer the middle than the rim panels", () => {
    const layers = 3;
    const pieces = crumpleSegments({ ...CARD, layers, randomness: 0 });
    const depthOf = (layer: number) =>
      settledReach(pieces.filter((_, i) => i % layers === layer)[0]);
    expect(depthOf(0)).toBeLessThan(depthOf(1));
    expect(depthOf(1)).toBeLessThan(depthOf(2));
  });

  it("ignores the seed entirely at zero, so nothing random is left", () => {
    expect(crumpleSegments({ ...CARD, randomness: 0, seed: "a" })).toEqual(
      crumpleSegments({ ...CARD, randomness: 0, seed: "b" }),
    );
    expect(crumpleSegments({ ...CARD, seed: "a" })).not.toEqual(
      crumpleSegments({ ...CARD, seed: "b" }),
    );
  });

  it("scatters tilt, reach and panel size as it rises", () => {
    const spreadOf = (randomness: number) => {
      const pieces = crumpleSegments({ ...CARD, randomness });
      const reaches = pieces.map(settledReach);
      return {
        tilt: Math.max(...pieces.map((p) => Math.abs(p.rotate))),
        reach: Math.max(...reaches) - Math.min(...reaches),
        size:
          Math.max(...pieces.map((p) => p.scale)) -
          Math.min(...pieces.map((p) => p.scale)),
      };
    };
    const calm = spreadOf(0.2);
    const wild = spreadOf(1);
    expect(wild.tilt).toBeGreaterThan(calm.tilt);
    expect(wild.reach).toBeGreaterThan(calm.reach);
    expect(wild.size).toBeGreaterThan(calm.size);
  });

  it("still covers the card exactly at every randomness", () => {
    for (const randomness of controlValues("randomness")) {
      const covered = crumpleSegments({ ...CARD, randomness })
        .map((piece) => areaOf(piece.clip))
        .reduce((sum, part) => sum + part, 0);
      expect(covered).toBeCloseTo(100 * 100, 6);
    }
  });

  it("clamps values outside the range instead of inverting the fold", () => {
    expect(crumpleSegments({ ...CARD, randomness: -3 })).toEqual(
      crumpleSegments({ ...CARD, randomness: 0 }),
    );
    expect(crumpleSegments({ ...CARD, randomness: 9 })).toEqual(
      crumpleSegments({ ...CARD, randomness: 1 }),
    );
  });
});

describe("the throw arc", () => {
  const flight = (timing: CrumpleTossTiming = BASE) => posesOf("toss", timing);

  it("throws right for a forward angle and left past ninety degrees", () => {
    expect(flight({ ...BASE, direction: -35 }).at(-1).x).toBeGreaterThan(0);
    expect(flight({ ...BASE, direction: 150 }).at(-1).x).toBeLessThan(0);
    expect(flight({ ...BASE, direction: 90 }).at(-1).x).toBeCloseTo(0, 6);
  });

  it("matches the plan's landing point at the defaults", () => {
    const landed = flight().at(-1);
    expect(landed.x).toBeCloseTo(737, 0);
    expect(landed.y).toBeCloseTo(294, 0);
  });

  it("rises before it falls at a clearly upward angle", () => {
    for (const direction of [-15, -35, -60]) {
      const ys = flight({ ...BASE, tossSteps: 5, direction }).map((p) => p.y);
      expect(ys[0]).toBeLessThan(0);
      expect(ys.at(-1)).toBeGreaterThan(0);
    }
  });

  it("peaks in the first half of the flight and rises at least 8% of distance", () => {
    const ys = flight().map((p) => p.y);
    const peak = Math.min(...ys);
    expect(ys.indexOf(peak)).toBeLessThan(ys.length / 2);
    expect(-peak / 900).toBeGreaterThanOrEqual(0.08);
    expect(-peak).toBeCloseTo(76.9, 1);
  });

  it("reports the landing point the flight actually reaches", () => {
    for (const direction of [-60, -35, 0, 150]) {
      for (const distance of [200, 440, 900, 1600]) {
        const landed = flight({ ...BASE, direction, distance }).at(-1);
        const predicted = crumpleTossLanding({ direction, distance });
        expect(predicted.x).toBeCloseTo(landed.x, 9);
        expect(predicted.y).toBeCloseTo(landed.y, 9);
      }
    }
  });

  it("predicts the landing from the same defaults the component uses", () => {
    const landed = flight().at(-1);
    expect(crumpleTossLanding().x).toBeCloseTo(landed.x, 9);
    expect(crumpleTossLanding().y).toBeCloseTo(landed.y, 9);
  });

  it("keeps the arc shape at any distance", () => {
    const shapeOf = (distance: number) =>
      flight({ ...BASE, distance }).map((p) => p.y / distance);
    expect(shapeOf(200)).toEqual(shapeOf(1600));
  });

  it("tumbles through the full spin and pulls away as it goes", () => {
    const poses = flight();
    expect(poses.at(-1).rotate).toBeCloseTo(220, 6);
    for (let i = 1; i < poses.length; i++) {
      expect(poses[i].rotate).toBeGreaterThan(poses[i - 1].rotate);
      expect(poses[i].scale).toBeLessThan(poses[i - 1].scale);
    }
  });

  it("steps the opacity once at the exit instead of fading", () => {
    const opacities = flight().map((p) => p.opacity);
    expect(opacities.slice(0, -1).every((o) => o === 1)).toBe(true);
    expect(opacities.at(-1)).toBe(0.4);
    expect(new Set(opacities).size).toBe(2);
  });
});

describe("crumpleTossConfig", () => {
  it("reaches leftward throws, which a -90..90 range could not", () => {
    const direction = numberControl("direction");
    expect(direction.min).toBe(-180);
    expect(direction.max).toBe(180);
    expect(Math.cos((direction.min * Math.PI) / 180)).toBeLessThan(0);
  });

  it("fits the default beat with room to read the empty frame", () => {
    const step = numberControl("step").default;
    const settles =
      numberControl("at").default +
      (numberControl("crumpleSteps").default +
        numberControl("tossSteps").default) *
        step;
    expect(settles).toBe(33);
    expect(crumpleTossConfig.durationInFrames - settles).toBeGreaterThanOrEqual(
      30,
    );
  });

  it("records where a maxed-out slider outruns the preview", () => {
    const fits = (
      start: number,
      crumpleSteps: number,
      tossSteps: number,
      step: number,
    ) =>
      start + (crumpleSteps + tossSteps) * step <=
      crumpleTossConfig.durationInFrames;
    const start = numberControl("at");
    expect(fits(start.default, 4, 5, 3)).toBe(true);
    expect(fits(start.max, 4, 5, 3)).toBe(true);
    expect(fits(start.default, 8, 10, 3)).toBe(true);
    expect(fits(start.max, 8, 10, 6)).toBe(false);
  });
});
