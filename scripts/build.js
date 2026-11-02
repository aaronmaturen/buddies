// Builds the library from src/:
//   dist/buddies.js         ES module, what apps import
//   dist/buddies.global.js  plain script tag, exposes window.Buddies
//   dist/buddies.d.ts       types
//   public/buddies.js       the same ES module for the site
// `--dev` skips dist, rebuilds the site's copy on every change and serves public/ on port 8790.
import { copyFileSync, mkdirSync } from "node:fs";
import { build, context } from "esbuild";

const shared = { entryPoints: ["src/index.js"], bundle: true, target: "es2022", sourcemap: true, logLevel: "info" };
const site = { ...shared, format: "esm", outfile: "public/buddies.js" };

if (process.argv.includes("--dev")) {
  const ctx = await context(site);
  await ctx.watch();
  const { port } = await ctx.serve({ servedir: "public", port: 8790 });
  console.log(`http://localhost:${port}`);
} else {
  mkdirSync("dist", { recursive: true });
  await Promise.all([
    build({ ...site, minify: true }),
    build({ ...shared, format: "esm", minify: true, outfile: "dist/buddies.js" }),
    build({ ...shared, format: "iife", globalName: "Buddies", minify: true, outfile: "dist/buddies.global.js" }),
  ]);
  copyFileSync("src/index.d.ts", "dist/buddies.d.ts");
}
