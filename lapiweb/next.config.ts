import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "8080", pathname: "/assets/**" },
      { protocol: "http", hostname: "127.0.0.1", port: "8080", pathname: "/assets/**" },
    ],
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
