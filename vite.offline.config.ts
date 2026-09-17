import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

export default defineConfig(({ mode }) => ({
  root: "static",
  base: "/offline/",
  publicDir: false,
  plugins: [react()],
  build: {
    outDir: mode === "static-preview" ? "../dist-static/offline" : "../dist/client/offline",
    emptyOutDir: true,
    rollupOptions: { input: fileURLToPath(new URL("./static/index.html", import.meta.url)) },
  },
}));
