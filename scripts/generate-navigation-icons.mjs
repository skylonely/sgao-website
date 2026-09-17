import sharp from "sharp";
import { fileURLToPath } from "node:url";

const directory = new URL("../public/icons/", import.meta.url);
for (const [file, size] of [["navigation-192.png", 192], ["navigation-512.png", 512], ["navigation-maskable-512.png", 512], ["navigation-apple-180.png", 180]]) {
  await sharp(fileURLToPath(new URL("navigation.svg", directory)))
    .resize(size, size).png().toFile(fileURLToPath(new URL(file, directory)));
}
console.log("generated navigation icons from the existing paper-plane design");
