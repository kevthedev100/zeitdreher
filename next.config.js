/** @type {import('next').NextConfig} */

const nextConfig = {
  serverExternalPackages: ["@clerk/nextjs"],
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "*.tempo-dev.app"],
    },
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,OPTIONS,PATCH,DELETE,POST,PUT",
          },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization",
          },
        ],
      },
    ];
  },
  env: {
    // Explicitly expose environment variables to ensure they're available
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    CLERK_WEBHOOK_SECRET:
      process.env.CLERK_WEBHOOK_SECRET ||
      "whsec_hEQgdFkwZth3d8sHgFnFsmdrizSATDzH",
    // Clerk authentication is now properly configured
  },
};

if (process.env.NEXT_PUBLIC_TEMPO) {
  // Keep experimental config for Tempo
  nextConfig.experimental = {
    ...nextConfig.experimental,
  };
}

// Log configuration for debugging
console.log("Next.js config environment variables:", {
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env
    .NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    ? "Set"
    : "Not set",
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY ? "Set" : "Not set",
  CLERK_WEBHOOK_SECRET: process.env.CLERK_WEBHOOK_SECRET ? "Set" : "Not set",
});

module.exports = nextConfig;
