#!/usr/bin/env node
/**
 * Build the node-server bundle and zip a cPanel upload (no node_modules).
 */
import { spawn } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "artifacts");
const zipPath = join(outDir, "kalaiyaonline-cpanel.zip");

function run(cmd, args, extraEnv = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: root,
      stdio: "inherit",
      env: { ...process.env, ...extraEnv },
    });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(" ")} exited ${code}`));
    });
  });
}

mkdirSync(outDir, { recursive: true });
if (!existsSync(join(root, "tmp"))) mkdirSync(join(root, "tmp"));

await run("npm", ["run", "build:cpanel"]);

if (!existsSync(join(root, ".output/server/index.mjs"))) {
  throw new Error("cPanel build missing .output/server/index.mjs");
}

await run("python3", [
  "-c",
  `
from pathlib import Path
import zipfile
root = Path(${JSON.stringify(root)})
out = Path(${JSON.stringify(zipPath)})
include = [
    "app.js", "package.json", "package-lock.json", ".nvmrc", ".env.example",
    ".gitignore", "vite.config.ts", "tsconfig.json", "startup.sh",
    "src", "public", "migrations", "scripts", "server", ".output", "tmp",
]
skip = {"node_modules", ".git", "artifacts", "attachments", "screenshots", ".grok", ".vercel", ".tanstack"}
count = 0
with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
    for item in include:
        p = root / item
        if not p.exists():
            continue
        if p.is_file():
            z.write(p, item)
            count += 1
            continue
        for f in p.rglob("*"):
            if not f.is_file():
                continue
            if any(part in skip for part in f.relative_to(root).parts):
                continue
            z.write(f, f.relative_to(root).as_posix())
            count += 1
print("packed", count, "files", out.stat().st_size, "bytes")
`,
]);

console.log(`[cpanel] upload zip: ${zipPath}`);
