import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

// Keep user-supplied audio outside the public registry and out of the Git tree.
const audioPath = process.argv
  .find((a) => a.startsWith("--reference-audio="))
  ?.slice("--reference-audio=".length);
const temp = mkdtempSync(path.join(tmpdir(), "remocn-fomo-"));
mkdirSync("out", { recursive: true });
try {
  const props: { audioSrc?: string } = {};
  if (audioPath) {
    const audio = path.join(temp, "soundtrack.m4a");
    const extraction = spawnSync(
      "ffmpeg",
      [
        "-v",
        "error",
        "-i",
        path.resolve(audioPath),
        "-filter_complex",
        "[0:a]atrim=0:12.6,asetpts=PTS-STARTPTS,afade=t=out:st=12.58:d=0.02[a];[0:a]atrim=14.45:20.316667,asetpts=PTS-STARTPTS,afade=t=in:d=0.02[b];[a][b]concat=n=2:v=0:a=1[out]",
        "-map",
        "[out]",
        "-vn",
        "-c:a",
        "aac",
        "-b:a",
        "192k",
        "-t",
        String(1108 / 60),
        audio,
      ],
      { stdio: "inherit" },
    );
    if (extraction.error) throw extraction.error;
    if (extraction.status !== 0)
      throw new Error("Could not extract reference audio.");
    props.audioSrc = `data:audio/mp4;base64,${readFileSync(audio).toString("base64")}`;
  }
  const propsFile = path.join(temp, "props.json");
  writeFileSync(propsFile, JSON.stringify(props));
  const rendered = spawnSync(
    "bunx",
    [
      "remotion",
      "render",
      "src/remotion/fomo-root.tsx",
      "FomoLimitOrders",
      "out/fomo-limit-orders.mp4",
      "--codec=h264",
      "--crf=16",
      "--concurrency=4",
      `--props=${propsFile}`,
    ],
    { stdio: "inherit" },
  );
  if (rendered.error) throw rendered.error;
  if (rendered.status !== 0)
    throw new Error(`Render exited with status ${rendered.status}.`);
} finally {
  rmSync(temp, { recursive: true, force: true });
}
