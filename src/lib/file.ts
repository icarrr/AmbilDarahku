import { put, del } from "@vercel/blob";
import { v4 as uuidv4 } from "uuid";
import { signBlobPath } from "./file-sign";

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

/** Replace a private blob URL with a signed proxy path (server-side only). */
export function signBlobUrl(blobUrl: string | null | undefined): string | null {
  if (!blobUrl) return null;
  if (!blobUrl.includes("blob.vercel-storage.com")) return blobUrl;
  return signBlobPath(blobUrl);
}
