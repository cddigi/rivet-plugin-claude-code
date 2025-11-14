import * as esbuild from "esbuild";
import { match } from "ts-pattern";
import { join, dirname } from "node:path";
import copy from "recursive-copy";
import { platform, homedir } from "node:os";
import { readFile, rm, mkdir, copyFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { builtinModules } from "node:module";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Plugin to mark Node.js built-in modules as external
const nodeBuiltinsPlugin: esbuild.Plugin = {
  name: "node-builtins",
  setup(build) {
    const filter = new RegExp(`^(${builtinModules.join("|")})$`);
    build.onResolve({ filter }, (args) => ({
      path: args.path,
      external: true,
    }));
  },
};

// Roughly https://github.com/demurgos/appdata-path/blob/master/lib/index.js but appdata local and .local/share, try to match `dirs` from rust
function getAppDataLocalPath() {
  const identifier = "com.ironcladapp.rivet";
  return match(platform())
    .with("win32", () => join(homedir(), "AppData", "Local", identifier))
    .with("darwin", () =>
      join(homedir(), "Library", "Application Support", identifier)
    )
    .with("linux", () => join(homedir(), ".local", "share", identifier))
    .otherwise(() => {
      if (platform().startsWith("win")) {
        return join(homedir(), "AppData", "Local", identifier);
      } else {
        return join(homedir(), ".local", "share", identifier);
      }
    });
}

const syncPlugin: esbuild.Plugin = {
  name: "onBuild",
  setup(build) {
    build.onEnd(async () => {
      const packageJson = JSON.parse(
        await readFile(join(__dirname, "package.json"), "utf-8")
      );
      const pluginName = packageJson.name;

      const rivetPluginsDirectory = join(getAppDataLocalPath(), "plugins");
      const thisPluginDirectory = join(
        rivetPluginsDirectory,
        `${pluginName}-latest`
      );

      await rm(join(thisPluginDirectory, "package"), {
        recursive: true,
        force: true,
      });
      await mkdir(join(thisPluginDirectory, "package"), { recursive: true });

      await copy(
        join(__dirname, "dist"),
        join(thisPluginDirectory, "package", "dist")
      );
      await copyFile(
        join(__dirname, "package.json"),
        join(thisPluginDirectory, "package", "package.json")
      );

      // Copy .git to mark as locally installed plugin
      await copy(
        join(__dirname, ".git"),
        join(thisPluginDirectory, "package", ".git")
      );

      console.log(
        `Synced ${pluginName} to Rivet at ${thisPluginDirectory}. Refresh or restart Rivet to see changes.`
      );
    });
  },
};

// Isomorphic bundle - works in browser and Node.js
const isomorphicOptions = {
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "neutral",
  target: "es2020",
  outfile: "dist/bundle.js",
  format: "esm",
  logLevel: "info",
  plugins: [] as esbuild.Plugin[],
  external: ["@ironclad/rivet-core", "./ClaudeCodeHeadlessNode.node.js"],
  loader: {
    ".png": "dataurl",
  },
} satisfies esbuild.BuildOptions;

// Node.js-only bundle - contains Node.js-specific implementations
const nodeOptions = {
  entryPoints: ["src/nodes/ClaudeCodeHeadlessNode.node.ts"],
  bundle: true,
  platform: "node",
  target: "es2020",
  outfile: "dist/ClaudeCodeHeadlessNode.node.js",
  format: "esm",
  logLevel: "info",
  plugins: [nodeBuiltinsPlugin],
} satisfies esbuild.BuildOptions;

if (process.argv.includes("--sync")) {
  isomorphicOptions.plugins.push(syncPlugin);
}

if (process.argv.includes("--watch")) {
  const isomorphicContext = await esbuild.context(isomorphicOptions);
  const nodeContext = await esbuild.context(nodeOptions);

  await isomorphicContext.watch();
  await nodeContext.watch();

  console.log("Watching for changes...");
} else {
  await esbuild.build(isomorphicOptions);
  await esbuild.build(nodeOptions);

  // Copy README.md and image.png to dist for package distribution
  await copyFile(
    join(__dirname, "README.md"),
    join(__dirname, "dist", "README.md")
  );

  await copyFile(
    join(__dirname, "image.png"),
    join(__dirname, "dist", "image.png")
  );

  console.log("Built isomorphic bundle: dist/bundle.js");
  console.log("Built Node.js bundle: dist/ClaudeCodeHeadlessNode.node.js");
  console.log("Copied README.md to dist/");
  console.log("Copied image.png to dist/");
}
