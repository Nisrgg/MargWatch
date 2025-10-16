/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['res.cloudinary.com'],
  },
  env: {
    API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:5000/api',
  },
  // Disable experimental features that might cause issues
  experimental: {
    // Remove deprecated instrumentationHook
  },
}

module.exports = nextConfig
