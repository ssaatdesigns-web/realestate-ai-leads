/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  experimental: {
    serverActions: true
  },

  typescript: {
    ignoreBuildErrors: false
  },

  eslint: {
    ignoreDuringBuilds: false
  }
};

module.exports = nextConfig;
