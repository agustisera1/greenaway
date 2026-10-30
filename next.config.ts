import type { NextConfig } from "next";

const s3 = `${process.env.AWS_S3_ENDPOINT}/${process.env.AWS_LISTINGS_BUCKET}/**`;

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      new URL(s3),
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
    ],
    dangerouslyAllowLocalIP: true,
    minimumCacheTTL: 31536000,
  },
  experimental: {
    authInterrupts: true,
  },
  turbopack: {
    root: __dirname,
    rules: {
      "*.graphql": {
        as: "*.ts",
        loaders: [
          {
            loader: "graphql-tag/loader",
          },
        ],
      },
    },
  },
};

export default nextConfig;
