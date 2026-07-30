import type { NextConfig } from "next";

const API_URL = process.env.API_URL ?? "http://localhost:5000";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Avatars are served from Cloudinary (backend upload target).
      { protocol: "https", hostname: "res.cloudinary.com" },
      // Some backend seed products use picsum placeholder photos.
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "images.unsplash.com" }
    ],
  },
  async rewrites() {
    // Proxy all API traffic so it is same-origin: the backend's httpOnly
    // refresh cookie (Path=/api/v1/auth, SameSite=Lax) lands on this origin
    // and no CORS or credentials configuration is needed anywhere.
    return [
      {
        source: "/api/v1/:path*",
        destination: `${API_URL}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
