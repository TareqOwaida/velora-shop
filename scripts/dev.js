import { spawn } from "node:child_process";
const children = [
  spawn(
    process.execPath,
    ["--env-file-if-exists=.env", "--watch", "server/index.js"],
    { stdio: "inherit" },
  ),
  spawn(process.execPath, ["node_modules/vite/bin/vite.js"], {
    stdio: "inherit",
  }),
];
let closing = false;
function stop() {
  if (closing) return;
  closing = true;
  for (const child of children) child.kill();
}
for (const child of children) {
  child.on("error", (error) => {
    console.error(error.message);
    stop();
    process.exitCode = 1;
  });
  child.on("exit", (code) => {
    if (!closing) {
      stop();
      process.exitCode = code || 0;
    }
  });
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
