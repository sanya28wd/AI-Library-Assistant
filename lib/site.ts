// Set by next.config.ts for the GitHub Pages build.
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
/** True on the static GitHub Pages demo, where there are no API routes. */
export const staticDemo = process.env.NEXT_PUBLIC_STATIC_DEMO === "1";
