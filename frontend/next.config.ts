import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Ensure Turbopack uses the current frontend folder as the workspace root
  // Use an absolute path as recommended by Next.js
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
