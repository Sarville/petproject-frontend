import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: '/project_next',
  env: {
    NEXT_PUBLIC_BASE_PATH: '/project_next',
  },
};

export default nextConfig;
