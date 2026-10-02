import type { NextConfig } from "next";

// GITHUB_PAGES=true builds the static demo: no API routes, served from /<repo>/ on github.io.
const githubPages = process.env.GITHUB_PAGES === "true";
const basePath = githubPages ? "/AI-Library-Assistant" : "";

const nextConfig: NextConfig = {
  typedRoutes: true,
  ...(githubPages && { output: "export", basePath, trailingSlash: true }),
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
    NEXT_PUBLIC_STATIC_DEMO: githubPages ? "1" : ""
  }
};

export default nextConfig;
