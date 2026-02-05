/** @type {import('next').NextConfig} */
const nextConfig = {
  // Strict mode helps catch common React issues
  reactStrictMode: true,
  
  // Improve production source maps for debugging
  productionBrowserSourceMaps: false,
  
  // Configure image optimization
  images: {
    domains: [],
  },
  
  // Experimental features
  experimental: {
    // Enable server actions
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  
  // Handle canvas module for react-konva SSR compatibility
  webpack: (config, { isServer }) => {
    // Only on server-side, tell webpack to ignore canvas
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        canvas: 'commonjs canvas',
      });
    }
    
    // Fix for Supabase ESM import issues
    config.resolve.alias = {
      ...config.resolve.alias,
    };
    
    return config;
  },
};

module.exports = nextConfig;
