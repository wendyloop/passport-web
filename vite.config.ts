import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import tsconfigPaths from "vite-tsconfig-paths";

function getBasePath() {
  const repository = process.env.GITHUB_REPOSITORY;

  if (!repository) {
    return "/";
  }

  const [owner, repo] = repository.split("/");

  if (!owner || !repo || repo === `${owner}.github.io`) {
    return "/";
  }

  return `/${repo}/`;
}

export default defineConfig({
  base: process.env.GITHUB_ACTIONS === "true" ? getBasePath() : "/",
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    tsconfigPaths(),
    react(),
    tailwindcss(),
  ],
});
