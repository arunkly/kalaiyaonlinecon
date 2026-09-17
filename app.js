/**
 * cPanel "Setup Node.js App" startup file (Passenger).
 * Application startup file: app.js
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));

function loadDotEnv() {
  const envFile = join(root, ".env");
  if (!existsSync(envFile)) return;
  for (const line of readFileSync(envFile, "utf8").split("\n")) {
    const text = line.trim();
    if (!text || text.startsWith("#")) continue;
    const cut = text.indexOf("=");
    if (cut < 1) continue;
    const key = text.slice(0, cut).trim();
    let value = text.slice(cut + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadDotEnv();

if (typeof globalThis.PhusionPassenger !== "undefined") {
  globalThis.PhusionPassenger.configure({ autoInstall: false });
}

process.env.NODE_ENV ||= "production";
process.env.NITRO_PRESET ||= "node-server";
process.env.HOST ||= "0.0.0.0";
process.env.NITRO_HOST ||= process.env.HOST;
if (!process.env.PORT && process.env.PASSENGER_APP_PORT) {
  process.env.PORT = process.env.PASSENGER_APP_PORT;
}

await import("./.output/server/index.mjs");
