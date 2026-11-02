const HEAD_BYTES = 64 * 1024;
const REVALIDATE_SECONDS = 60 * 60 * 24;

/**
 * Duration in seconds of a remote MP4, read from its `mvhd` box with Range
 * requests (cached): the head of the file, then, when `moov` sits after the
 * media data, the byte range where the next top-level box starts. `null` when
 * a request fails or the box can't be found.
 */
export function getVideoDuration(url: string): Promise<number | null> {
  const hit = memo.get(url);
  if (hit && Date.now() - hit.at < REVALIDATE_SECONDS * 1000) return hit.value;
  const value = readDuration(url);
  memo.set(url, { value, at: Date.now() });
  // A failed read is retried on the next render rather than kept.
  void value.then((seconds) => {
    if (seconds === null) memo.delete(url);
  });
  return value;
}

/**
 * Durations per URL for the life of the server process (Range responses
 * aren't reliably kept by the fetch cache), refreshed daily.
 */
const memo = new Map<string, { value: Promise<number | null>; at: number }>();

async function readDuration(url: string): Promise<number | null> {
  try {
    let start = 0;
    for (let hop = 0; hop < MAX_HOPS; hop++) {
      const view = await fetchRange(url, start);
      if (!view) return null;
      const result = scanBoxes(view);
      if (typeof result === "number") return result;
      if (result === null) return null;
      start += result.next;
    }
  } catch {
    return null;
  }
  return null;
}

const MAX_HOPS = 4;

async function fetchRange(url: string, start: number) {
  const res = await fetch(url, {
    headers: { Range: `bytes=${start}-${start + HEAD_BYTES - 1}` },
    next: { revalidate: REVALIDATE_SECONDS },
  });
  if (!res.ok) return null;
  return new DataView(await res.arrayBuffer());
}

function boxType(view: DataView, offset: number) {
  return String.fromCharCode(
    view.getUint8(offset),
    view.getUint8(offset + 1),
    view.getUint8(offset + 2),
    view.getUint8(offset + 3),
  );
}

/**
 * Walks top-level boxes from the start of `view`: the duration when `moov` is
 * inside, `{ next }` (offset of the first box past the buffer) to fetch more,
 * or `null` when the data isn't a box stream.
 */
function scanBoxes(view: DataView): number | { next: number } | null {
  let offset = 0;
  while (offset + 8 <= view.byteLength) {
    const size = view.getUint32(offset);
    const type = boxType(view, offset + 4);
    if (type === "moov") return readMvhd(view, offset + 8);
    if (size < 8) return null;
    offset += size;
  }
  return offset > 0 ? { next: offset } : null;
}

function readMvhd(view: DataView, mvhd: number): number | null {
  if (mvhd + 40 > view.byteLength || boxType(view, mvhd + 4) !== "mvhd") {
    return null;
  }
  const version = view.getUint8(mvhd + 8);
  const timescale =
    version === 1 ? view.getUint32(mvhd + 28) : view.getUint32(mvhd + 20);
  const duration =
    version === 1
      ? Number(view.getBigUint64(mvhd + 32))
      : view.getUint32(mvhd + 24);
  return timescale > 0 ? duration / timescale : null;
}

/** 34.2 → "0:34", 458 → "7:38". */
export function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(total / 60);
  return `${minutes}:${String(total % 60).padStart(2, "0")}`;
}
