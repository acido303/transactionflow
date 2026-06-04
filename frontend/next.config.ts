import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.REPORTING_API_URL || 'http://reporting-service:8082'}/api/:path*`,
      },
    ]
  },
}

export default nextConfig
