import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [reactRouter(), tsconfigPaths()],
  server: {
    proxy: {
      "/backend": {
        target: process.env.VITE_API_BASE_URL || "http://localhost:3000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/backend/, ""),
      },
    },
    allowedHosts: ["local-app.homwe.app", "homwe.test"],
  },
  resolve: {
    alias: process.env.DOCKER_BUILD
      ? { "react-dom/server": "react-dom/server.node" }
      : {},
  },
});
