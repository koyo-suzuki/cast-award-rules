import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  optimizeDeps: {
    entries: ["index.html"],
  },
  plugins: [react()],
});
