import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

let s3Client: S3Client | null = null;

function getS3Client(): S3Client | null {
  const endpoint = process.env.S3_ENDPOINT;
  if (!endpoint) return null;

  if (!s3Client) {
    s3Client = new S3Client({
      endpoint,
      region: process.env.S3_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY || "minioadmin",
        secretAccessKey: process.env.S3_SECRET_KEY || "minioadmin",
      },
      forcePathStyle: true,
    });
  }
  return s3Client;
}

export async function uploadFile(
  buffer: Buffer,
  originalName: string,
  contentType: string
): Promise<string> {
  const client = getS3Client();
  if (!client) {
    const ext = originalName.split(".").pop() || "jpg";
    return `https://storage.ambildarahku.id/uploads/${uuidv4()}.${ext}`;
  }

  const bucket = process.env.S3_BUCKET || "ambildarahku";
  const key = `uploads/${uuidv4()}-${originalName}`;

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  return `https://${bucket}.s3.amazonaws.com/${key}`;
}

export function getPublicURL(objectName: string): string {
  const bucket = process.env.S3_BUCKET || "ambildarahku";
  return `https://${bucket}.s3.amazonaws.com/${objectName}`;
}
