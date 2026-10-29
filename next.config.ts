import type { NextConfig } from "next";

// Same base URL that lib/infra/s3.ts builds for each photo.
const s3 = `${process.env.AWS_S3_ENDPOINT}/${process.env.AWS_LISTINGS_BUCKET}/**`;
const mocks = "https://dummyimage.com/**"; // Reset DB and clearup mock images

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [new URL(s3), new URL(mocks)],
    // The optimizer refuses private IPs by default; the S3 emulator is on localhost (db/README.md).
    dangerouslyAllowLocalIP: true,
    // Floor for entries whose origin sends no Cache-Control (objects uploaded
    // before we started setting it, and the mocks). Next takes whichever is
    // larger, so new uploads are already governed by their own 1-year header.
    // Safe only because every URL above is immutable — an S3 key carries a
    // UUID and a dummyimage URL fully describes its image. There is no cache
    // invalidation API: to purge, delete `.next/cache/images`.
    minimumCacheTTL: 31536000,
  },
  experimental: {
    authInterrupts: true,
  },
  turbopack: {
    // Pinned: a stray lockfile in the home folder made Turbopack watch all of it.
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
