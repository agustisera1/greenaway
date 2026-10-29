// Creates the listings bucket in the S3 emulator from docker-compose, with public read. Idempotent.
import {
  CreateBucketCommand,
  PutBucketPolicyCommand,
  S3ServiceException,
} from "@aws-sdk/client-s3";
import { s3 } from "@/lib/infra/s3";

async function main() {
  const Bucket = process.env.AWS_LISTINGS_BUCKET;
  if (!process.env.AWS_S3_ENDPOINT) throw new Error("Missing AWS_S3_ENDPOINT");
  if (!Bucket) throw new Error("Missing AWS_LISTINGS_BUCKET");

  try {
    await s3.send(new CreateBucketCommand({ Bucket }));
  } catch (error) {
    if (!(error instanceof S3ServiceException && error.name === "BucketAlreadyOwnedByYou")) throw error;
  }

  // The app serves photos by their plain URL, so anyone can read an object but not list the bucket.
  const Policy = JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Principal: "*",
        Action: ["s3:GetObject"],
        Resource: [`arn:aws:s3:::${Bucket}/*`],
      },
    ],
  });
  await s3.send(new PutBucketPolicyCommand({ Bucket, Policy }));
  console.log(`  ✓ s3: ${Bucket} (public read)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
