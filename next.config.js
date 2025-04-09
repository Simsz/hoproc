/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Disable ESLint during build for production
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['lux666.com', 'example.com'],
  },
}

module.exports = nextConfig 