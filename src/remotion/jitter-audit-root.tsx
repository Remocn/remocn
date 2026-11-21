import { type ComponentType, useEffect, useRef, useState } from "react";
import {
  AbsoluteFill,
  Composition,
  continueRender,
  delayRender,
  getInputProps,
  Internals,
  registerRoot,
  useCurrentFrame,
} from "remotion";
import { getDefaults, resolveConfig, toProps } from "@/lib/customizer-config";
import registry from "@/registry/__index__";

// One composition per component named in the `names` input prop, with the
// props the docs preview starts from (the config's defaults), rendered by
// `scripts/audit-jitter.mts` with `imageFormat: "none"`. After every frame it
// logs where each text node and painted box sits and what moved it; the
// script turns those tracks into a count of pixel clicks.
//
// Chrome rounds to whole pixels in two places, and a slow move through either
// shows as a hold followed by a one-pixel jump:
// - layout: a text baseline (vertically) and the edges of a box are rounded
//   in the element's own coordinates, so anything moved by `top`, `left`,
//   margins or reflow steps pixel by pixel whatever transform sits above it;
// - raster: a glyph run is placed on a whole device pixel vertically while
//   the matrix is axis-aligned, so text moved by a transform steps too. Boxes
//   and images moved by a transform shade their edge pixels and glide.
//
// "Axis-aligned" is decided on the whole matrix down to the device, rounded
// to 1/1024 (measured in `src/remotion/jitter-lab/angle.tsx`): text leaves the
// grid once `x` leans into `y` by 0.5/1024 in device pixels. A tilt of
// 0.05deg does that at full size and stops doing it when the picture is shown
// below 0.57 of its size, in a small player or under a scaled-down ancestor.

type Input = {
  names?: string[];
  props?: Record<string, unknown>;
  // Render only: the measuring pass rewrites transforms for a moment, which
  // a frame-by-frame comparison of two renders should not have in it.
  quiet?: boolean;
  // The share of its size the composition is shown at, as a player that
  // fits it into a smaller box does: a CSS scale around the component, and
  // `useCurrentScale()` answers with it.
  shown?: number;
};
const input = getInputProps() as Input;

async function loadDefaults(name: string) {
  const config = await registry[name].loadConfig();
  const { controls } = resolveConfig(name, config);
  const values = getDefaults(controls);
  return { config, values, props: toProps(controls, values) };
}

export const JITTER_LOG_PREFIX = "__JITTER__";

// One row per text node or painted box:
// [key, flags, opacity, x, y, w, h, layoutX, layoutY, layoutW, layoutH,
//  movers, layer, layoutMover]
// - flags: 1 off-axis or in perspective (glyphs are not snapped to the device
//   grid there), 2 inside `will-change: transform`, 4 inside an element turned
//   out of the plane without perspective, 8 SVG content (placed by
//   attributes, never by layout), 16 a box rather than text.
//
//   Measured on rendered frames (`src/remotion/jitter-lab/layers.tsx`): of everything
//   that is said to make a layer, only two things change how text is drawn.
//   `will-change: transform` keeps one texture and slides it, which glides but
//   depends on the frames the tab rendered before, so a render split over
//   several tabs jumps by up to a pixel. `rotateX`/`rotateY` without
//   perspective glides through translation and is re-rastered, snapped, when
//   the scale changes. `will-change: opacity`, `backface-visibility`,
//   `translateZ`, `filter` and `opacity` leave text snapped as before.
// - x..h: the rect on screen. layoutX..layoutH: the same rect with every
//   transform taken out, i.e. where layout alone puts it.
// - movers: [path, kind][] for ancestors whose transform changed since the
//   last frame; kind is a bitmask of 1 scale, 2 translate, 4 rotate.
// - layer: [path, top, scaleY] of the nearest compositor layer, or null.
// - layoutMover: path of the outermost ancestor that layout moved inside its
//   parent since the last frame, or "".
// - node, font: which DOM node this is and the font it is set in. A path names
//   a different node once a sibling mounts or unmounts, and a face swap moves
//   the glyph box without moving the text; neither is motion, so the script
//   compares two frames of a path only when both are the same.
type Row = [
  string,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  [string, number][],
  [string, number, number] | null,
  string,
  number,
  string,
  number,
  number,
  number,
  number,
];

const nodeIds = new WeakMap<Node, number>();
let nextNodeId = 1;
function nodeIdOf(node: Node) {
  let id = nodeIds.get(node);
  if (!id) {
    id = nextNodeId;
    nextNodeId += 1;
    nodeIds.set(node, id);
  }
  return id;
}

const previousTransform = new WeakMap<Element, number[]>();
const previousPlace = new WeakMap<Element, [number, number]>();

function transformOf(style: CSSStyleDeclaration) {
  const m = new DOMMatrixReadOnly(
    style.transform === "none" ? "" : style.transform,
  );
  const scale = style.scale === "none" ? [1, 1] : style.scale.split(" ");
  const translate =
    style.translate === "none" ? [0, 0] : style.translate.split(" ");
  const sx = Number.parseFloat(String(scale[0]));
  const sy = Number.parseFloat(String(scale[1] ?? scale[0]));
  return [
    m.a * sx,
    m.d * sy,
    m.e + Number.parseFloat(String(translate[0])),
    m.f + (Number.parseFloat(String(translate[1] ?? 0)) || 0),
    m.b * sy,
    m.c * sx,
    style.rotate === "none" ? 0 : Number.parseFloat(style.rotate),
    // Turned out of the plane, and seen in perspective.
    Math.max(
      Math.abs(m.m13),
      Math.abs(m.m31),
      Math.abs(m.m23),
      Math.abs(m.m32),
    ) > 1e-6
      ? 1
      : 0,
    Math.max(Math.abs(m.m14), Math.abs(m.m24), Math.abs(m.m34)) > 1e-9 ? 1 : 0,
  ];
}

const TRANSFORM_PROPS = ["transform", "scale", "translate", "rotate"] as const;

const paints = (style: CSSStyleDeclaration) =>
  (style.backgroundColor !== "rgba(0, 0, 0, 0)" &&
    style.backgroundColor !== "transparent") ||
  style.backgroundImage !== "none" ||
  style.boxShadow !== "none" ||
  (style.borderTopStyle !== "none" && style.borderTopWidth !== "0px") ||
  (style.borderLeftStyle !== "none" && style.borderLeftWidth !== "0px") ||
  (style.borderBottomStyle !== "none" && style.borderBottomWidth !== "0px");

function measure(root: HTMLElement, frame: number) {
  type Info = {
    path: string;
    opacity: number;
    hidden: boolean;
    flags: number;
    movers: [string, number][];
    layer: Element | null;
    box: boolean;
    perspective: boolean;
    // The linear part of every transform down to this element, as
    // [a, b, c, d] of `matrix(a, b, c, d, 0, 0)`, and whether any of them
    // is seen in perspective.
    lin: [number, number, number, number];
    deep: boolean;
    font: string;
    // How far down the transforms above and on this element carry it, and by
    // what whole factor they scale it from its corner; null once one of them
    // does anything else. The same test as `registry/remocn/glide`.
    carry: { dy: number; k: number } | null;
    // Where the element faces, to tell a card turned away from the viewer:
    // every transform since the last element that flattened its children.
    facing: DOMMatrixReadOnly;
    keeps3d: boolean;
  };
  const infos = new Map<Element, Info>();
  const transformed: HTMLElement[] = [];
  const rootInfo: Info = {
    path: "",
    opacity: 1,
    hidden: false,
    flags: 0,
    movers: [],
    layer: null,
    box: false,
    perspective: false,
    lin: [1, 0, 0, 1],
    deep: false,
    font: "",
    carry: { dy: 0, k: 1 },
    facing: new DOMMatrixReadOnly(),
    keeps3d: false,
  };
  const infoOf = (el: Element): Info => {
    if (el === root) return rootInfo;
    const cached = infos.get(el);
    if (cached) return cached;
    const parent = el.parentElement;
    const up = parent ? infoOf(parent) : rootInfo;
    const style = getComputedStyle(el);
    const index = parent
      ? Array.prototype.indexOf.call(parent.children, el)
      : 0;
    const path = up.path ? `${up.path}.${index}` : String(index);
    const t = transformOf(style);
    if (
      style.transform !== "none" ||
      style.scale !== "none" ||
      style.translate !== "none" ||
      style.rotate !== "none"
    )
      transformed.push(el as HTMLElement);
    const before = previousTransform.get(el);
    previousTransform.set(el, t);
    let kind = 0;
    if (before) {
      if (
        Math.abs(before[0] - t[0]) > 1e-7 ||
        Math.abs(before[1] - t[1]) > 1e-7
      )
        kind |= 1;
      if (
        Math.abs(before[2] - t[2]) > 1e-5 ||
        Math.abs(before[3] - t[3]) > 1e-5
      )
        kind |= 2;
      if (
        Math.abs(before[4] - t[4]) > 1e-7 ||
        Math.abs(before[5] - t[5]) > 1e-7 ||
        Math.abs(before[6] - t[6]) > 1e-7
      )
        kind |= 4;
    }
    // The `rotate` property turns what `scale` and `transform` produced.
    const [cos, sin] = [
      Math.cos((t[6] * Math.PI) / 180),
      Math.sin((t[6] * Math.PI) / 180),
    ];
    const own = [
      cos * t[0] - sin * t[4],
      sin * t[0] + cos * t[4],
      cos * t[5] - sin * t[1],
      sin * t[5] + cos * t[1],
    ];
    const lin: Info["lin"] = [
      up.lin[0] * own[0] + up.lin[2] * own[1],
      up.lin[1] * own[0] + up.lin[3] * own[1],
      up.lin[0] * own[2] + up.lin[2] * own[3],
      up.lin[1] * own[2] + up.lin[3] * own[3],
    ];
    // An SVG element is also scaled by its viewBox, which no computed
    // transform shows; where it lands on the screen does.
    const lands =
      el instanceof SVGGraphicsElement &&
      !el.closest("defs, mask, clipPath, pattern, symbol, marker")
        ? el.getScreenCTM()
        : null;
    if (lands) {
      lin[0] = lands.a;
      lin[1] = lands.b;
      lin[2] = lands.c;
      lin[3] = lands.d;
    }
    const deep = up.deep || t[8] === 1 || (t[7] === 1 && up.perspective);
    const rotated =
      deep || Math.abs(lin[1]) * window.devicePixelRatio * 1024 >= 0.5;
    const ownLayer = /\btransform\b/.test(style.willChange)
      ? 2
      : t[7] === 1 && !deep
        ? 4
        : 0;
    const svg = el instanceof SVGElement;
    const tag = el.tagName;
    const facing = (up.keeps3d ? up.facing : new DOMMatrixReadOnly()).multiply(
      new DOMMatrixReadOnly(style.transform === "none" ? "" : style.transform),
    );
    const info: Info = {
      path,
      opacity: up.opacity * Number.parseFloat(style.opacity),
      hidden:
        up.hidden ||
        style.display === "none" ||
        style.visibility === "hidden" ||
        // The back of a card: laid out and in the DOM, but not drawn.
        (style.backfaceVisibility === "hidden" && facing.m33 < 0),
      facing,
      keeps3d: style.transformStyle === "preserve-3d",
      // A layer further in hides the ones further out.
      flags: (rotated ? 1 : 0) | (ownLayer || up.flags & 6) | (svg ? 8 : 0),
      movers: kind ? [...up.movers, [path, kind]] : up.movers,
      layer: ownLayer ? el : up.layer,
      // SVG shapes are antialiased wherever they sit; only HTML boxes and the
      // replaced elements laid out among them have edges to round.
      box:
        tag === "IMG" ||
        tag === "CANVAS" ||
        tag === "VIDEO" ||
        tag === "svg" ||
        (!svg && paints(style)),
      // `preserve-3d` hands the perspective above it on to its children.
      perspective:
        style.perspective !== "none" ||
        (up.perspective && style.transformStyle === "preserve-3d"),
      lin,
      deep,
      font: style.fontFamily,
      carry: (() => {
        const k = Math.round(t[0]);
        const whole =
          up.carry !== null &&
          k >= 1 &&
          Math.abs(t[0] - k) < 1e-4 &&
          Math.abs(t[1] - k) < 1e-4 &&
          Math.abs(t[4]) < 1e-5 &&
          Math.abs(t[5]) < 1e-5 &&
          t[6] === 0 &&
          t[7] === 0 &&
          t[8] === 0 &&
          (k === 1 || /^0(px)? 0(px)?/.test(style.transformOrigin));
        return whole && up.carry
          ? { dy: up.carry.dy + up.carry.k * t[3], k: up.carry.k * k }
          : null;
      })(),
    };
    infos.set(el, info);
    return info;
  };

  type Item = { key: string; el: Element; node: Node | null; info: Info };
  const items: Item[] = [];
  const screen: DOMRect[] = [];
  const range = document.createRange();
  const rectOf = (item: Item) => {
    if (!item.node) return item.el.getBoundingClientRect();
    range.selectNodeContents(item.node);
    return range.getClientRects()[0];
  };
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
  );
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (items.length >= 800) break;
    const text = node.nodeType === Node.TEXT_NODE;
    const el = text ? node.parentElement : (node as Element);
    if (!el) continue;
    if (text) {
      const tag = el.tagName;
      if (!node.nodeValue?.trim()) continue;
      if (tag === "STYLE" || tag === "SCRIPT" || tag === "TITLE") continue;
    }
    const info = infoOf(el);
    if (info.hidden || info.opacity < 0.02 || (!text && !info.box)) continue;
    const item: Item = {
      key: text
        ? `${info.path}#${Array.prototype.indexOf.call(el.childNodes, node)}`
        : info.path,
      el,
      node: text ? node : null,
      info,
    };
    const rect = rectOf(item);
    if (!rect || rect.width === 0 || rect.height === 0) continue;
    items.push(item);
    screen.push(rect);
  }

  // The second pass reads the same rects with every transform taken out. An
  // identity translate stands in for each one, so the element stays a
  // containing block for its absolute children and layout doesn't shift.
  const saved = transformed.map((el) =>
    TRANSFORM_PROPS.map(
      (prop) =>
        [
          el.style.getPropertyValue(prop),
          el.style.getPropertyPriority(prop),
        ] as const,
    ),
  );
  for (const el of transformed) {
    el.style.setProperty("transform", "translate(0px)", "important");
    el.style.setProperty("scale", "none", "important");
    el.style.setProperty("translate", "none", "important");
    el.style.setProperty("rotate", "none", "important");
  }
  const places = new Map<Element, DOMRect>();
  const placeOf = (el: Element) => {
    let rect = places.get(el);
    if (!rect) {
      rect = el.getBoundingClientRect();
      places.set(el, rect);
    }
    return rect;
  };
  const moved = new Map<Element, boolean>();
  const movedByLayout = (el: Element): boolean => {
    const cached = moved.get(el);
    if (cached !== undefined) return cached;
    const parent = el.parentElement;
    if (!parent || el === root) return false;
    const [own, up] = [placeOf(el), placeOf(parent)];
    const place: [number, number] = [own.left - up.left, own.top - up.top];
    const before = previousPlace.get(el);
    previousPlace.set(el, place);
    const result =
      before !== undefined &&
      (Math.abs(before[0] - place[0]) > 1e-3 ||
        Math.abs(before[1] - place[1]) > 1e-3);
    moved.set(el, result);
    return result;
  };
  const round = (n: number) => Math.round(n * 1e4) / 1e4;
  const rows: Row[] = items.map((item, i) => {
    const layout = rectOf(item) ?? screen[i];
    let layoutMover = "";
    for (let el: Element | null = item.el; el && el !== root; ) {
      if (movedByLayout(el)) layoutMover = infoOf(el).path;
      el = el.parentElement;
    }
    const { info } = item;
    return [
      item.key,
      info.flags | (item.node ? 0 : 16),
      round(info.opacity),
      round(screen[i].left),
      round(screen[i].top),
      round(screen[i].width),
      round(screen[i].height),
      round(layout.left),
      round(layout.top),
      round(layout.width),
      round(layout.height),
      info.movers,
      null,
      layoutMover,
      nodeIdOf(item.node ?? item.el),
      item.node ? info.font : "",
      // How far the baseline leans on the screen: in units of what takes
      // text off the pixel grid (1 and up glides), and as an angle in degrees.
      round((Math.abs(info.lin[1]) * window.devicePixelRatio * 1024) / 0.5),
      round((Math.atan2(info.lin[1], info.lin[0]) * 180) / Math.PI),
      // Off the pixel grid when at rest: layout puts a baseline on a whole
      // pixel, so only a transform that scales, or moves by a fraction of a
      // pixel, takes it off.
      info.carry === null ||
      Math.abs(
        info.carry.k * window.devicePixelRatio -
          Math.round(info.carry.k * window.devicePixelRatio),
      ) >= 2e-3 ||
      Math.abs(
        info.carry.dy * window.devicePixelRatio -
          Math.round(info.carry.dy * window.devicePixelRatio),
      ) >= 0.05
        ? 1
        : 0,
      // Carried by a transform to a place it rests at: laid out where it
      // ends up, so here it stands where the transform puts it, which layout
      // rounding used to place up to a pixel away.
      info.carry !== null && Math.abs(info.carry.dy) > 1e-3 ? 1 : 0,
    ];
  });
  transformed.forEach((el, i) => {
    TRANSFORM_PROPS.forEach((prop, j) => {
      const [value, priority] = saved[i][j];
      if (value) el.style.setProperty(prop, value, priority);
      else el.style.removeProperty(prop);
    });
  });
  // Layer boxes are read with the transforms back in place.
  items.forEach((item, i) => {
    const layer = item.info.layer;
    if (!layer) return;
    const box = layer.getBoundingClientRect();
    const height = (layer as HTMLElement).offsetHeight;
    // The scale is left unrounded: the script divides by it, and a rounding
    // error there grows with the distance from the layer top.
    rows[i][12] = [
      infoOf(layer).path,
      round(box.top),
      height ? box.height / height : 0,
    ];
  });
  return { frame, rows };
}

// What an agent needs to find a node in the source: its tag, inline style
// keys and the text under it.
function resolve(root: HTMLElement, path: string) {
  let el: Element | undefined = root;
  for (const index of path.split("#")[0].split(".")) {
    el = el?.children[Number(index)];
  }
  return el;
}

function describe(el: Element) {
  const style = (el as HTMLElement).style;
  return {
    tag: el.tagName.toLowerCase(),
    style: style ? Array.from(style).join(",") : "",
    text: (el.textContent ?? "").replace(/\s+/g, " ").slice(0, 60),
    size: Number.parseFloat(getComputedStyle(el).fontSize),
  };
}

// A path names a different element once a sequence swaps scenes, so a node is
// described again whenever what sits at its path changes.
const seen = new Map<string, string>();

const MEASURE_LABEL = "measure ";

/** Resolves once no `delayRender` but the measuring ones is pending. */
function othersReady() {
  return new Promise<void>((done) => {
    const check = () => {
      const pending = Object.values(
        (
          window as unknown as {
            remotion_delayRenderTimeouts?: Record<
              string,
              { label: string | null }
            >;
          }
        ).remotion_delayRenderTimeouts ?? {},
      );
      if (pending.every((entry) => entry.label?.startsWith(MEASURE_LABEL)))
        done();
      else requestAnimationFrame(check);
    };
    check();
  });
}

function Cell({ name, ...props }: { name: string } & Record<string, unknown>) {
  const frame = useCurrentFrame();
  const ref = useRef<HTMLDivElement>(null);
  const [Component, setComponent] = useState<ComponentType<
    Record<string, unknown>
  > | null>(null);
  const [defaults, setDefaults] = useState<Record<string, unknown>>({});
  const [handle] = useState(() => delayRender(`load ${name}`));
  useEffect(() => {
    Promise.all([registry[name].load(), loadDefaults(name)]).then(
      ([m, loaded]) => {
        setDefaults(loaded.props);
        setComponent(() => m.default);
        continueRender(handle);
      },
    );
  }, [name, handle]);
  useEffect(() => {
    if (!Component || input.quiet) return;
    const measured = delayRender(`${MEASURE_LABEL}${name} @ ${frame}`);
    let cancelled = false;
    // Fonts decide where text sits; a frame later React has committed every
    // effect-driven re-render (components that measure their own text).
    // `document.fonts.ready` misses `@remotion/google-fonts`: it adds a face
    // only once the file is in, and holds a `delayRender` until then. Measured
    // before that, frame 0 sits in the fallback font and frame 1 reads as a
    // click on every line, so the component's own handles are waited out too.
    Promise.all([document.fonts.ready, othersReady()]).then(() =>
      requestAnimationFrame(() => {
        if (!cancelled && ref.current) {
          const root = ref.current;
          const data = measure(root, frame);
          console.log(JITTER_LOG_PREFIX + JSON.stringify(data));
          // Which nodes matter is only known once tracks exist, so each frame
          // also describes every node it names for the first time.
          const fresh: Record<string, unknown> = {};
          const paths = new Set<string>();
          for (const row of data.rows) {
            paths.add(row[0].split("#")[0]);
            for (const mover of row[11]) paths.add(mover[0]);
            if (row[12]) paths.add(row[12][0]);
            if (row[13]) paths.add(row[13]);
          }
          for (const path of paths) {
            const el = resolve(root, path);
            if (!el) continue;
            const style = (el as HTMLElement).style;
            const signature = `${el.tagName}|${style ? Array.from(style).join(",") : ""}|${(el.textContent ?? "").slice(0, 60)}`;
            if (seen.get(`${name}:${path}`) === signature) continue;
            seen.set(`${name}:${path}`, signature);
            fresh[path] = describe(el);
          }
          if (Object.keys(fresh).length > 0)
            console.log(
              `${JITTER_LOG_PREFIX}D${JSON.stringify({ frame, nodes: fresh })}`,
            );
        }
        continueRender(measured);
      }),
    );
    return () => {
      cancelled = true;
      continueRender(measured);
    };
  }, [frame, Component, name]);
  const body = Component ? <Component {...defaults} {...props} /> : null;
  const shown = input.shown ?? 1;
  return (
    <AbsoluteFill ref={ref}>
      {shown === 1 ? (
        body
      ) : (
        <Internals.CurrentScaleContext.Provider
          value={{ type: "scale", scale: shown }}
        >
          <AbsoluteFill
            style={{ transform: `scale(${shown})`, transformOrigin: "0 0" }}
          >
            {body}
          </AbsoluteFill>
        </Internals.CurrentScaleContext.Provider>
      )}
    </AbsoluteFill>
  );
}

function Root() {
  return (
    <>
      {(input.names ?? []).map((name) => (
        <Composition
          key={name}
          id={name}
          component={Cell}
          defaultProps={{ name, ...(input.props ?? {}) }}
          durationInFrames={1}
          fps={30}
          width={1280}
          height={720}
          calculateMetadata={async () => {
            const { config, values } = await loadDefaults(name);
            const K = (input as { fpsScale?: number }).fpsScale ?? 1;
            return {
              durationInFrames: Math.round(
                (config.getDurationInFrames?.(values) ??
                  config.durationInFrames) * K,
              ),
              fps: config.fps * K,
              width: config.compositionWidth,
              height: config.compositionHeight,
            };
          }}
        />
      ))}
    </>
  );
}

registerRoot(Root);
