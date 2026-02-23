import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { writeFileSync } from "node:fs";

const redirectsPlugin = {
  name: "render-spa-redirects",
  closeBundle() {
    writeFileSync("dist/_redirects", "/*  /index.html  200\n", "utf8");
  },
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), redirectsPlugin],
  build: {
    outDir: "dist",
  },
});
