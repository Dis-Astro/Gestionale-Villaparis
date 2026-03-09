/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // Questi pacchetti non vengono bundlati: servono nel runner del Docker standalone
  serverExternalPackages: ['exceljs', 'xlsx', '@prisma/client', 'prisma'],
}

module.exports = nextConfig
