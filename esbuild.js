const esbuild = require("esbuild");
const { commonjs } = require("@hyrious/esbuild-plugin-commonjs");

esbuild
  .build({
    platform: "node",
    format: "esm",
    entryPoints: ["./src/index.ts"],
    bundle: true,
    minify: true,
    watch: process.argv.includes("--watch"),
    outdir: "./dist",
    define: {
      "process.env.NODE_ENV": `"${process.env.NODE_ENV}"`,
    },
    external: ["@slack/bolt"],
    // plugins: [commonjs()],
  })
  .catch(() => process.exit(1));
