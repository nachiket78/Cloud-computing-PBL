import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const children = ["api", "web"].map((name) =>
  spawn("npm", ["run", "dev"], {
    cwd: path.join(root, name),
    shell: true,
    stdio: "inherit",
  }),
);

function shutdown() {
  for (const child of children) child.kill();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
