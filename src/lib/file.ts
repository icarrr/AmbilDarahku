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
    access: "public",
  });

  return blob.url;
}

export async function deleteFile(url: string): Promise<void> {
  await del(url);
}

export function getPublicURL(objectName: string): string {
  return `https://ambildarahku.vercel.blob.core.windows.net/${objectName}`;
}
