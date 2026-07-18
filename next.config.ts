import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export for GitHub Pages. The Pages workflow (actions/configure-pages)
  // injects basePath automatically when the repo isn't <user>.github.io.
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
