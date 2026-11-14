// Runs a command below normal CPU priority, so the editor and browser stay
// responsive while Turbopack compiles. On macOS the utility QoS class keeps
// performance cores free for foreground apps at nearly the same compile
// speed (`-b`, background, confines it to efficiency cores and is ~6x slower).
//
//   bun scripts/low-priority.mts next dev
import { spawn } from "node:child_process";

const command = process.argv.slice(2);
if (command.length === 0) {
  console.error("usage: bun scripts/low-priority.mts <command> [...args]");
  process.exit(1);
}

const [bin, ...args] =
  process.platform === "darwin"
    ? ["taskpolicy", "-c", "utility", ...command]
    : process.platform === "linux"
      ? ["nice", "-n", "10", ...command]
      : command;

const child = spawn(bin, args, { stdio: "inherit" });

// Ctrl+C already reaches the child through the terminal's process group;
// forward the rest so `kill` on this wrapper stops the server too.
for (const signal of ["SIGTERM", "SIGHUP"] as const) {
  process.on(signal, () => child.kill(signal));
}
process.on("SIGINT", () => {});

child.on("exit", (code, signal) => {
  process.exit(code ?? (signal ? 1 : 0));
});
