/**
 * Build script for the "I'm an Introvert" Chrome extension.
 *
 * Chrome MV3 has different module constraints per target, so each target gets
 * its own small Vite build instead of one multi-entry build:
 *
 *   popup       -> HTML + React + Tailwind, ES modules (fine inside an
 *                  extension page)
 *   background  -> ES module service worker ("type": "module" in manifest)
 *   content/*   -> IIFE single files, because classic content scripts cannot
 *                  use import/export
 *
 * Run `node scripts/build.mjs` for a one-shot build, or add `--watch` to keep
 * every target rebuilding while you develop.
 */
import { build } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { cp, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const watch = process.argv.includes("--watch");

/** Content scripts and the service worker share these settings. */
const scriptBuild = (entry, outFile, format, globalName) => ({
  configFile: false,
  root,
  resolve: { alias: { "@": path.join(root, "src") } },
  define: { "process.env.NODE_ENV": JSON.stringify("production") },
  build: {
    outDir: dist,
    emptyOutDir: false,
    target: "chrome114",
    minify: false, // readable output keeps selector debugging sane
    sourcemap: watch ? "inline" : false,
    watch: watch ? {} : null,
    lib: {
      entry: path.join(root, entry),
      formats: [format],
      fileName: () => outFile,
      // Only meaningful for the iife content scripts; they export nothing, so
      // this just names the wrapper.
      name: globalName,
    },
  },
});

const popupBuild = () => ({
  configFile: false,
  root: path.join(root, "src/popup"),
  base: "./",
  resolve: { alias: { "@": path.join(root, "src") } },
  plugins: [react(), tailwindcss()],
  build: {
    outDir: path.join(dist, "popup"),
    emptyOutDir: false,
    target: "chrome114",
    sourcemap: watch ? "inline" : false,
    watch: watch ? {} : null,
    rollupOptions: {
      input: path.join(root, "src/popup/index.html"),
    },
  },
});

const targets = [
  popupBuild(),
  scriptBuild(
    "src/background/index.ts",
    "background.js",
    "es",
    "introvertBackground",
  ),
  scriptBuild(
    "src/content/facebook.ts",
    "content/facebook.js",
    "iife",
    "introvertFacebook",
  ),
  scriptBuild(
    "src/content/messenger.ts",
    "content/messenger.js",
    "iife",
    "introvertMessenger",
  ),
];

async function copyStatic() {
  await mkdir(path.join(dist, "content"), { recursive: true });
  await cp(
    path.join(root, "src/manifest.json"),
    path.join(dist, "manifest.json"),
  );
  await cp(
    path.join(root, "src/styles/content.css"),
    path.join(dist, "content/introvert.css"),
  );
  if (existsSync(path.join(root, "src/icons"))) {
    await cp(path.join(root, "src/icons"), path.join(dist, "icons"), {
      recursive: true,
    });
  }
}

if (!watch) await rm(dist, { recursive: true, force: true });
await copyStatic();
await Promise.all(targets.map((config) => build(config)));

if (watch) {
  console.log(
    "\n[introvert] watching. Reload the extension in chrome://extensions after changes.",
  );
} else {
  console.log(
    "\n[introvert] built dist/ — load it via chrome://extensions -> Load unpacked.",
  );
}
