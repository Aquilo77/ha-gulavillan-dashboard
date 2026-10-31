import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/panel.ts"),
      formats: ["es"],
      fileName: () => "gulavillan-panel.js",
    },
    outDir: resolve(__dirname, "../custom_components/gulavillan_dashboard/frontend"),
    emptyOutDir: true,
    sourcemap: false,
    cssCodeSplit: false,
    target: "es2022",
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        banner: "/* Gulavillan dashboard panel. Built from frontend/. */",
      },
    },
  },
});
