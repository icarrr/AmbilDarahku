import { put, del } from "@vercel/blob";
import { v4 as uuidv4 } from "uuid";

export async function uploadFile(
  buffer: Buffer,
  originalName: string,
  contentType: string
): Promise<string> {
  const ext = originalName.split(".").pop() || "jpg";
  const pathname = `uploads/${uuidv4()}.${ext}`;

  const blob = await put(pathname, buffer, {
    contentType,
    access: "private",
  });

  return blob.url;
}

export async function deleteFile(url: string): Promise<void> {
  await del(url);
}

export function getFileUrl(blobUrl: string | null | undefined): string | null {
  if (!blobUrl) return null;
  return `/api/v1/files?url=${encodeURIComponent(blobUrl)}`;
}
