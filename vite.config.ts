import { defineConfig } from "vite";
export default defineConfig({
  base: "/pc-cafe-simulator/",
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("@dimforge")) return "physics";
          if (id.includes("/three/")) return "three";
          if (id.includes("/react") || id.includes("/scheduler/"))
            return "react";
        },
      },
    },
  },
});
