import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { normalizeListingPhoto } from "@/lib/infra/images";

// The S3 emulator from docker-compose only resolves path-style URLs (`<endpoint>/<bucket>/<key>`).
const endpoint = process.env.AWS_S3_ENDPOINT!;

export const s3 = new S3Client({
  region: process.env.AWS_S3_REGION,
  endpoint,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

function publicBaseUrl(Bucket: string) {
  return `${endpoint}/${Bucket}/`;
}

// The object key is the URL after the bucket's public base (`listings/<id>/<uuid>.jpeg`).
// URLs outside the bucket (seed mocks) have no object to delete.
export async function deleteListingObject(url: string) {
  const Bucket = process.env.AWS_LISTINGS_BUCKET!;
  const base = publicBaseUrl(Bucket);
  if (!url.startsWith(base)) return;
  const Key = decodeURIComponent(url.slice(base.length));

  await s3.send(new DeleteObjectCommand({ Bucket, Key }));
}

export async function addListingObject(
  file: File,
  listingId: string,
): Promise<string | null> {
  try {
    const Bucket = process.env.AWS_LISTINGS_BUCKET!;
    const randId = crypto.randomUUID();
    const { body, contentType, extension } = await normalizeListingPhoto(file);
    const Key = `listings/${listingId}/${randId}.${extension}`;

    const insertCmd = new PutObjectCommand({
      Bucket,
      Key,
      Body: body,
      ContentType: contentType,
      // The key carries a UUID, so an object is never rewritten under the same
      // URL: it can be cached permanently by the optimizer and the browser.
      CacheControl: "public, max-age=31536000, immutable",
    });

    await s3.send(insertCmd);
    return `${publicBaseUrl(Bucket)}${Key}`;
  } catch (error) {
    console.error("[addListingObject]", error);
    return null;
  }
}
