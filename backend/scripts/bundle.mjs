import * as esbuild from "esbuild";
import { mkdirSync } from "node:fs";

const handlers = ["createSession", "putPlacements", "getPlacements"];

mkdirSync("dist", { recursive: true });

await Promise.all(
  handlers.map((name) =>
    esbuild.build({
      entryPoints: [`src/handlers/${name}.ts`],
      bundle: true,
      platform: "node",
      target: "node20",
      outfile: `dist/${name}.js`,
      format: "cjs",
      minify: true,
      sourcemap: true
    })
  )
);

console.log("Bundled Lambda handlers to dist/");
