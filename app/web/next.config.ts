import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // Local convenience only. Nginx owns API routing outside development.
    if (process.env.NODE_ENV !== "development") return [];

    const apiOrigin = new URL(process.env.API_BASE_URL ?? "http://localhost:5000");
    if (!["http:", "https:"].includes(apiOrigin.protocol) ||
        apiOrigin.pathname !== "/" || apiOrigin.search || apiOrigin.hash ||
        apiOrigin.username || apiOrigin.password) {
      throw new Error("API_BASE_URL must be an HTTP(S) origin without a path or credentials");
    }

    return [{
      source: "/api/v1/:path*",
      destination: `${apiOrigin.origin}/api/v1/:path*`,
    }];
  },
};

export default nextConfig;
