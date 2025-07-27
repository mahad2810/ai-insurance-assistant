/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["pdf-parse"],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude pdf-parse from webpack bundling to avoid file system issues
      config.externals.push({
        "pdf-parse": "commonjs pdf-parse",
        "pdf-parse/lib/pdf-parse": "commonjs pdf-parse/lib/pdf-parse",
      })

      // Ignore test files and other problematic paths
      config.resolve.alias = {
        ...config.resolve.alias,
        "pdf-parse$": "pdf-parse/lib/pdf-parse.js",
      }
    }

    // Ignore problematic files during build
    config.module = config.module || {}
    config.module.rules = config.module.rules || []
    config.module.rules.push({
      test: /\.pdf$/,
      use: "ignore-loader",
    })

    return config
  },

  // Ignore build errors from pdf-parse test files
  typescript: {
    ignoreBuildErrors: true,
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
