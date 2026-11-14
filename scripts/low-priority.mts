// Runs a command below normal CPU priority (`nice -n 10`), so the editor and
// browser win any contention while Turbopack compiles, and an idle machine
// still gives it full speed. Not macOS QoS classes: `taskpolicy -c utility`
// throttles the process even on an idle machine and doubled the cold compile
// of the docs route (~16 s -> ~33 s on an M3), with no measurable gain for a
// foreground process; `-b` confines it to efficiency cores and is ~6x slower.
//
// It also caps Turbopack's parallelism at half the cores. Turbopack sizes its
// Node.js loader pool (MDX, PostCSS) from the core count: on an 8-core M3 that
// is ~12 processes of 120-200 MB each at the peak. Half the cores compiles the
// docs route just as fast with ~0.6 GB less peak memory. The variable is read
// by turbo-tasks inside Next's native binding and isn't documented; set it
// yourself to override.
//
//   bun scripts/low-priority.mts next dev
import { spawn } from "node:child_process";
import { availableParallelism } from "node:os";

const command = process.argv.slice(2);
if (command.length === 0) {
  console.error("usage: bun scripts/low-priority.mts <command> [...args]");
  process.exit(1);
}

const [bin, ...args] =
  process.platform === "win32" ? command : ["nice", "-n", "10", ...command];

const env = { ...process.env };
env.TURBO_TASKS_AVAILABLE_PARALLELISM ??= String(
  Math.max(2, Math.floor(availableParallelism() / 2)),
);

const child = spawn(bin, args, { stdio: "inherit", env });

// Ctrl+C already reaches the child through the terminal's process group;
// forward the rest so `kill` on this wrapper stops the server too.
for (const signal of ["SIGTERM", "SIGHUP"] as const) {
  process.on(signal, () => child.kill(signal));
}
process.on("SIGINT", () => {});

child.on("exit", (code, signal) => {
  process.exit(code ?? (signal ? 1 : 0));
});
