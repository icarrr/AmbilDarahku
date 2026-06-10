import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isAuthContext } from "@/lib/auth-middleware";
import { uploadFile } from "@/lib/file";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (!isAuthContext(auth)) return auth;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await uploadFile(buffer, file.name, file.type);

    return NextResponse.json({ url });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "upload failed" }, { status: 500 });
  }
}
