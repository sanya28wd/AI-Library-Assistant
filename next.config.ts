import type { NextConfig } from "next";

// GITHUB_PAGES=true builds the static demo: no API routes, served from /<repo>/ on github.io.
const githubPages = process.env.GITHUB_PAGES === "true";
const basePath = githubPages ? "/AI-Library-Assistant" : "";

const nextConfig: NextConfig = {
  typedRoutes: true,
  ...(githubPages && { output: "export", basePath, trailingSlash: true }),
  // The API is the Python backend (backend/app.py): `npm run api` on port 8000 locally, the api/index.py function on Vercel.
  ...(!githubPages && {
    rewrites: async () => [{ source: "/api/:path*", destination: process.env.NODE_ENV === "development" ? "http://127.0.0.1:8000/api/:path*" : "/api/" }]
  }),
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
    NEXT_PUBLIC_STATIC_DEMO: githubPages ? "1" : ""
  }
};

export default nextConfig;
