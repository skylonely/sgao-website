import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const argument = process.argv.find((value) => value.startsWith("--output="));
const outputDirectory = path.resolve(argument?.slice("--output=".length) ?? "dist/client");
if (![path.resolve("dist/client"), path.resolve("dist-static")].includes(outputDirectory)) {
  throw new Error("Navigation SW output must be a main-site build directory");
}

async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map((entry) => {
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory() ? filesIn(absolute) : [absolute];
  }))).flat();
}

const files = [...await filesIn(path.join(outputDirectory, "offline")),
  ...["navigation.webmanifest", "favicon.svg", "icons/navigation-192.png", "icons/navigation-512.png", "icons/navigation-maskable-512.png", "icons/navigation-apple-180.png"]
    .map((file) => path.join(outputDirectory, file))].sort();
const urls = files.map((file) => {
  const relative = path.relative(outputDirectory, file).split(path.sep).join("/");
  return relative === "offline/index.html" ? "/offline/" : `/${relative}`;
});
const template = await readFile(new URL("./navigation-sw.template.js", import.meta.url), "utf8");
const hash = createHash("sha256").update(template);
let bytes = 0;
for (const [index, file] of files.entries()) {
  const contents = await readFile(file);
  hash.update(urls[index]).update(contents);
  bytes += contents.byteLength;
}
const name = `sgao-navigation-v1-${hash.digest("hex").slice(0, 12)}`;
const source = template.replace("= __NAVIGATION_CACHE_NAME__", `= ${JSON.stringify(name)}`)
  .replace("= __NAVIGATION_PRECACHED_URLS__", `= ${JSON.stringify(urls)}`);
await writeFile(path.join(outputDirectory, "navigation-sw.js"), source);
console.log(`generated ${name}: ${urls.length} public offline resources, ${Math.ceil(bytes / 1024)} KiB`);
