import { useEffect, useLayoutEffect } from "react";

// Chrome parks a glyph raster on a whole pixel vertically for as long as the
// matrix that carries it is axis-aligned, so text under a slow transform
// clicks along pixel by pixel. A lean too small to see takes it off that grid.
//
// A transform that carries text is marked, and told when it moves:
//
//   const glide = useGlide();
//   transform: `scale(${s})${glide(moving)}`
//
// The mark changes nothing by itself. After every frame the blocks of text
// under a marked transform get the lean: each about its own centre, and each
// by no more than its size on the screen needs. A card, a hairline or an image
// is fine under a transform as it is, so they stay level.
//
// Text leans while its transform moves, and it keeps the lean at rest when it
// rests off the pixel grid (a scene shown smaller in a player, a camera that
// holds at 1.03): dropping the lean there would snap it to the nearest pixel,
// up to half a pixel in one frame, and picking it up would snap it back. Text
// that rests on the grid loses the lean without moving, so a scene at rest at
// full size is drawn exactly as it would be without any of this.

/**
 * Returns `glide(moving)`: append it to a transform that carries text, with
 * `moving` true on the frames where that transform changes.
 *
 * Everything else lives inside this one closure: the build of Studio
 * elements pastes this file whole into the component that uses it, where a
 * second `LEAN` or `lean` at the top level would collide.
 */
export const useGlide = (() => {
  /** What `glide(false)` adds to a transform: an identity matrix, to find it by. */
  const AT_REST = " matrix(1, 0, 0, 1, 0, 0)";
  /** `glide(true)` adds it twice. */
  const MOVING = AT_REST + AT_REST;
  const MARKED = `[style*="${AT_REST.trim()}"]`;
  // Text leaves the grid once the matrix leans x into y by half of 1/1024 in
  // device pixels (Skia rounds the glyph matrix to 1/1024). A fifth over it.
  const LEAN = 0.6 / 1024;
  // Past this the text is a speck on the screen; it is left alone.
  const STEEPEST = 5;
  // How far from a whole pixel text may rest and still count as on the grid:
  // the jump it makes when the lean goes is no bigger than this.
  const ON_GRID = 0.05;

  /** The linear part of a 2D matrix: x' = a·x + c·y, y' = b·x + d·y. */
  type Lin = [a: number, b: number, c: number, d: number];
  const LEVEL: Lin = [1, 0, 0, 1];
  const times = (m: Lin, n: Lin): Lin => [
    m[0] * n[0] + m[2] * n[1],
    m[1] * n[0] + m[3] * n[1],
    m[0] * n[2] + m[2] * n[3],
    m[1] * n[2] + m[3] * n[3],
  ];
  const turned = (degrees: number): Lin => {
    const t = (degrees * Math.PI) / 180;
    return [Math.cos(t), Math.sin(t), -Math.sin(t), Math.cos(t)];
  };
  const offWhole = (n: number) => Math.abs(n - Math.round(n));

  type Block = HTMLElement | SVGTextElement | SVGSVGElement;
  let leant: Block[] = [];
  // Fonts arrive after the first pass and change what is laid out where, with
  // no render to follow: a block or a marked element that changes size is read
  // again before the frame is painted.
  let watcher: ResizeObserver | undefined;
  const watched = new WeakSet<Element>();
  const watch = (el: Element) => {
    if (watched.has(el)) return;
    watched.add(el);
    watcher ??= new ResizeObserver(() => lean());
    watcher.observe(el);
  };

  const depthOf = (el: Element) => {
    let depth = 0;
    for (let up = el.parentElement; up; up = up.parentElement) depth += 1;
    return depth;
  };

  /** The nearest box around a text node that a transform applies to. */
  const blockOf = (node: Node): Block | null => {
    for (let el = node.parentElement; el; el = el.parentElement) {
      if (el instanceof SVGElement) {
        const text = el.closest("text");
        if (!(text instanceof SVGTextElement)) return null;
        // Text that only shapes a mask or a clip is not drawn where it stands
        // and cannot turn by itself: its whole drawing leans for it.
        if (!text.closest("defs, mask, clipPath, pattern, symbol, marker"))
          return text;
        let drawing = text.ownerSVGElement;
        while (drawing?.ownerSVGElement) drawing = drawing.ownerSVGElement;
        return drawing;
      }
      if (!(el instanceof HTMLElement)) continue;
      const { display } = getComputedStyle(el);
      if (display !== "inline" && display !== "contents") return el;
    }
    return null;
  };

  /** One pass over the page: what every element's own transforms do. */
  function reader(given: Map<Element, number>) {
    type Own = {
      /** `scale` and `transform`, without the `rotate` property. */
      lin: Lin;
      /** `rotate`, in degrees: a lean given in this pass, or the scene's own. */
      turn: number;
      /** How far down it is moved, and by what whole factor it is scaled from
       * its top left corner; null when it does anything else. */
      carry: { dy: number; k: number } | null;
    };
    const lens = new Map<Element, boolean>();
    /** Whether an element shows its children in perspective. */
    const lensOn = (el: Element | null): boolean => {
      if (!el) return false;
      const seen = lens.get(el);
      if (seen !== undefined) return seen;
      const style = getComputedStyle(el);
      const result =
        style.perspective !== "none" ||
        (style.transformStyle === "preserve-3d" && lensOn(el.parentElement));
      lens.set(el, result);
      return result;
    };
    const own = new Map<Element, Own | null>();
    const ownOf = (el: Element): Own | null => {
      const seen = own.get(el);
      if (seen !== undefined) return seen;
      const style = getComputedStyle(el);
      const m = new DOMMatrixReadOnly(
        style.transform === "none" ? "" : style.transform,
      );
      const scale = style.scale === "none" ? [] : style.scale.split(" ");
      const sx = scale.length ? Number.parseFloat(scale[0]) : 1;
      const sy = scale.length > 1 ? Number.parseFloat(scale[1]) : sx;
      const rotate = style.rotate === "none" ? [] : style.rotate.split(" ");
      let result: Own | null = null;
      // Seen in perspective, text is drawn on a layer of its own: not ours. A
      // turn out of the plane without perspective lands flat on the screen,
      // and text under it snaps like any other.
      // A push along z alone, or a half turn, leaves it flat even under a lens.
      const inPerspective =
        Math.max(Math.abs(m.m14), Math.abs(m.m24), Math.abs(m.m34)) > 1e-9 ||
        (Math.max(
          Math.abs(m.m13),
          Math.abs(m.m31),
          Math.abs(m.m23),
          Math.abs(m.m32),
        ) > 1e-6 &&
          lensOn(el.parentElement));
      if (!inPerspective && rotate.length < 2) {
        // The `scale` property acts on what `transform` has produced.
        const lin: Lin = [m.a * sx, m.b * sy, m.c * sx, m.d * sy];
        const moved =
          style.translate === "none"
            ? 0
            : (style.translate.split(" ")[1] ?? "0px");
        const k = Math.round(lin[0]);
        const whole =
          m.is2D &&
          k >= 1 &&
          Math.abs(lin[0] - k) < 1e-4 &&
          Math.abs(lin[3] - k) < 1e-4 &&
          Math.abs(lin[1]) < 1e-5 &&
          Math.abs(lin[2]) < 1e-5 &&
          rotate.length === 0 &&
          (moved === 0 || moved.endsWith("px")) &&
          // Scaled about its corner, a box stays where layout put it.
          (k === 1 || /^0(px)? 0(px)?/.test(style.transformOrigin));
        result = {
          lin,
          turn: rotate.length ? Number.parseFloat(rotate[0]) : 0,
          carry: whole
            ? { dy: sy * m.f + (moved === 0 ? 0 : Number.parseFloat(moved)), k }
            : null,
        };
      }
      own.set(el, result);
      return result;
    };
    const down = new Map<Element, Lin | null>();
    /** Everything from the page down to and including this element. */
    const linDown = (el: Element | null): Lin | null => {
      if (!el) return LEVEL;
      const seen = down.get(el);
      if (seen !== undefined) return seen;
      const above = linDown(el.parentElement);
      const mine = above && ownOf(el);
      const result =
        above && mine
          ? times(times(above, turned(given.get(el) ?? mine.turn)), mine.lin)
          : null;
      down.set(el, result);
      return result;
    };
    const carried = new Map<Element, { dy: number; k: number } | null>();
    const carryDown = (
      el: Element | null,
    ): { dy: number; k: number } | null => {
      if (!el) return { dy: 0, k: 1 };
      const seen = carried.get(el);
      if (seen !== undefined) return seen;
      const above = carryDown(el.parentElement);
      const mine = above && !given.has(el) ? ownOf(el)?.carry : null;
      const result =
        above && mine
          ? { dy: above.dy + above.k * mine.dy, k: above.k * mine.k }
          : null;
      carried.set(el, result);
      return result;
    };
    return { ownOf, linDown, carryDown };
  }

  /**
   * Whether text in an SVG rests on the grid: it is placed wherever it is told
   * to, so only when it is shown one to one and its baseline happens to land on
   * a whole pixel. `lands` is where its own space lands on the screen.
   */
  function restsOnGrid(text: SVGTextElement, lands: DOMMatrix | null) {
    if (!lands) return false;
    const dpr = window.devicePixelRatio;
    const style = getComputedStyle(text);
    const k = lands.d * dpr;
    const y = text.y.baseVal.numberOfItems
      ? text.y.baseVal.getItem(0).value
      : 0;
    return (
      text.y.baseVal.numberOfItems <= 1 &&
      text.dy.baseVal.numberOfItems === 0 &&
      !text.querySelector("tspan[y], tspan[dy], textPath") &&
      /^(auto|alphabetic)$/.test(style.dominantBaseline) &&
      /^(auto|baseline)$/.test(style.alignmentBaseline) &&
      Math.abs(lands.b) < 1e-6 &&
      Math.abs(lands.c) < 1e-6 &&
      Math.round(k) >= 1 &&
      offWhole(k) < 2e-3 &&
      offWhole((lands.d * y + lands.f) * dpr) < ON_GRID
    );
  }

  /**
   * The angle that takes a block off the grid, given what is above it (`above`)
   * and what its own transform does (`own`), both in device pixels: the lean is
   * a turn between the two. 0 when the block leans enough as it is, null when
   * no sane angle would do.
   */
  function angleFor(above: Lin, own: Lin): number | null {
    // y from x of `above · turn(θ) · own` is p·sin θ + q·cos θ.
    const p = above[3] * own[0] - above[1] * own[1];
    const q = above[1] * own[0] + above[3] * own[1];
    if (Math.abs(q) >= LEAN) return 0;
    if (Math.abs(p) < 1e-9) return null;
    // Along the turn the scene already has, so the two never cancel out.
    const sine = ((q < 0 ? -LEAN : LEAN) - q) / p;
    if (Math.abs(sine) > Math.sin((STEEPEST * Math.PI) / 180)) return null;
    return (Math.asin(sine) * 180) / Math.PI;
  }

  function lean() {
    for (const el of leant) {
      el.style.removeProperty("rotate");
      if (el instanceof SVGElement) el.style.removeProperty("translate");
    }
    leant = [];
    const zones = document.querySelectorAll<HTMLElement | SVGElement>(MARKED);
    if (zones.length === 0) return;
    // Each block of text under a mark, and whether any transform above it moves.
    const blocks = new Map<Block, boolean>();
    // The texts a whole drawing leans for.
    const standsFor = new Map<SVGSVGElement, SVGTextElement[]>();
    for (const zone of zones) {
      const moving = zone.style.transform.includes(MOVING.trim());
      const walker = document.createTreeWalker(zone, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        if (!/\S/.test(node.nodeValue ?? "")) continue;
        const block = blockOf(node);
        // A block that turns by a property of its own is left to the scene.
        if (!block || block.style.rotate) continue;
        blocks.set(block, moving || (blocks.get(block) ?? false));
        const text = node.parentElement?.closest("text");
        if (block instanceof SVGSVGElement && text instanceof SVGTextElement)
          standsFor.set(block, [...(standsFor.get(block) ?? []), text]);
      }
      watch(zone);
    }
    for (const block of blocks.keys()) watch(block);
    const dpr = window.devicePixelRatio;
    const scaled = (m: Lin): Lin => [
      m[0] * dpr,
      m[1] * dpr,
      m[2] * dpr,
      m[3] * dpr,
    ];
    // Outer blocks first: a block inside a leaning one takes only what it
    // still lacks, so leans never pile up. Everything is read before anything
    // is written; `given` stands in for the leans not yet on the page.
    const given = new Map<Element, number>();
    const { ownOf, linDown, carryDown } = reader(given);
    const writes: (() => void)[] = [];
    const ordered = [...blocks.keys()].sort((a, b) => depthOf(a) - depthOf(b));
    for (const el of ordered) {
      const moving = blocks.get(el) === true;
      if (el instanceof HTMLElement) {
        const above = linDown(el.parentElement);
        const mine = ownOf(el);
        if (!above || !mine) continue;
        if (!moving) {
          // Layout puts a baseline on a whole pixel wherever the box itself
          // sits, so text is on the grid when the transforms around it only
          // move it by whole pixels and show it one to one (or two, or three).
          const carry = carryDown(el);
          if (
            carry &&
            offWhole(carry.k * dpr) < 2e-3 &&
            offWhole(carry.dy * dpr) < ON_GRID
          )
            continue;
        }
        const angle = angleFor(scaled(above), mine.lin);
        if (!angle) continue;
        given.set(el, angle);
        writes.push(() => el.style.setProperty("rotate", `${angle}deg`));
        leant.push(el);
        continue;
      }
      if (el instanceof SVGSVGElement) {
        // A whole drawing: what it does itself is its own transform and the
        // scale of its viewBox, read off where it lands on the screen.
        const above = linDown(el.parentElement);
        const lands = el.getScreenCTM();
        const det = above ? above[0] * above[3] - above[1] * above[2] : 0;
        if (!above || !lands || Math.abs(det) < 1e-12) continue;
        if (
          !moving &&
          (standsFor.get(el) ?? []).every((text) =>
            restsOnGrid(text, text.getScreenCTM()),
          )
        )
          continue;
        const mine = times(
          [above[3] / det, -above[1] / det, -above[2] / det, above[0] / det],
          [lands.a, lands.b, lands.c, lands.d],
        );
        const angle = angleFor(scaled(above), mine);
        if (!angle) continue;
        given.set(el, angle);
        writes.push(() => el.style.setProperty("rotate", `${angle}deg`));
        leant.push(el);
        continue;
      }
      // Its drawing leans as a whole already.
      let drawing = el.ownerSVGElement;
      while (drawing?.ownerSVGElement) drawing = drawing.ownerSVGElement;
      if (drawing && given.has(drawing)) continue;
      // Text in an SVG is placed wherever it is told to, so it is on the grid
      // only when its baseline happens to land on a whole pixel.
      const frame = el.parentNode;
      if (!(frame instanceof SVGGraphicsElement) || el.style.translate)
        continue;
      const outer = frame.getScreenCTM();
      const whole = el.getScreenCTM();
      if (
        !outer ||
        !whole ||
        Math.abs(outer.a * outer.d - outer.b * outer.c) < 1e-12
      )
        continue;
      // What the text element itself does, in the space it is placed in.
      const mine = outer.inverse().multiply(whole);
      if (!moving && restsOnGrid(el, whole)) continue;
      const angle = angleFor(scaled([outer.a, outer.b, outer.c, outer.d]), [
        mine.a,
        mine.b,
        mine.c,
        mine.d,
      ]);
      if (!angle) continue;
      // An SVG element turns about the corner of its drawing. A move brings
      // the turn to the middle of the text instead.
      const box = el.getBBox();
      const [cx, cy] = [box.x + box.width / 2, box.y + box.height / 2];
      const [px, py] = [
        mine.a * cx + mine.c * cy + mine.e,
        mine.b * cx + mine.d * cy + mine.f,
      ];
      const [cos, sin] = [turned(angle)[0], turned(angle)[1]];
      const [tx, ty] = [px - (px * cos - py * sin), py - (px * sin + py * cos)];
      writes.push(() => {
        el.style.setProperty("rotate", `${angle}deg`);
        el.style.setProperty("translate", `${tx}px ${ty}px`);
      });
      leant.push(el);
    }
    for (const write of writes) write();
  }

  const useFrameEffect =
    typeof window === "undefined" ? useEffect : useLayoutEffect;

  function useGlide() {
    // No dependencies: the lean follows whatever this frame laid out.
    useFrameEffect(lean);
    return glide;
  }

  const glide = (moving: boolean) => (moving ? MOVING : AT_REST);

  return useGlide;
})();
