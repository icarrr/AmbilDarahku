import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isAuthContext, checkAdmin } from "@/lib/auth-middleware";
import { isMaintenanceMode, setMaintenanceMode } from "@/lib/config";

export const runtime = "nodejs";

/**
 * GET /api/v1/admin/maintenance
 * Returns the current maintenance mode status.
 */
export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!isAuthContext(auth)) return auth;

  const admin = checkAdmin(auth);
  if (admin) return admin;

  try {
    const enabled = await isMaintenanceMode();
    return NextResponse.json({ enabled });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/v1/admin/maintenance
 * Toggle maintenance mode on/off.
 * Body: { enabled: boolean }
 */
export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (!isAuthContext(auth)) return auth;

  const admin = checkAdmin(auth);
  if (admin) return admin;

  try {
    const body = await request.json();
    const enabled = body.enabled === true;

    await setMaintenanceMode(enabled);
    return NextResponse.json({ enabled });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
