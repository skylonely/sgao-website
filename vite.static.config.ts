import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

export default defineConfig({
  root: "static",
  base: "./",
  publicDir: "../public",
  plugins: [react()],
  build: {
    outDir: "../dist-static",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        home: fileURLToPath(new URL("./static/index.html", import.meta.url)),
        spaceship: fileURLToPath(
          new URL("./static/docs/spaceship/index.html", import.meta.url),
        ),
      },
    },
  },
});
