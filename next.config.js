/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: {
      enabled: false,
    },
    workerThreads: false,
    cpus: 1,
  },
}

module.exports = nextConfig