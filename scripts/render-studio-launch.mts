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
const temp = mkdtempSync(path.join(tmpdir(), "remocn-studio-launch-"));
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
        "-vn",
        "-c:a",
        "aac",
        "-b:a",
        "192k",
        "-t",
        String(1065 / 30),
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
      "src/remotion/studio-launch-root.tsx",
      "StudioLaunch",
      "out/studio-launch-remocn.mp4",
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
