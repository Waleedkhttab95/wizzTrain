import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The API is a separate service (spec §11: api + web + postgres containers),
  // so the browser talks to it directly over CORS rather than through a proxy.
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1',
  },
};

export default nextConfig;
