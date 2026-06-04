/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.REPORTING_API_URL || 'http://reporting-service:8082'}/api/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
