import { NextRequest, NextResponse } from "next/server";
import { verifyToken, JWTClaims } from "./jwt";

export interface AuthContext {
  claims: JWTClaims;
  userId: string;
  email: string;
  role: string;
  emailVerified: boolean;
}

export type AuthResult = AuthContext | NextResponse;

const unverifiedAllowedPaths = new Set([
  "/api/v1/auth/me",
  "/api/v1/auth/resend-verification",
  "/api/v1/auth/logout",
  "/api/v1/auth/change-password",
]);

function getPathKey(request: NextRequest): string {
  const url = new URL(request.url);
  return url.pathname;
}

export function requireAuth(request: NextRequest): AuthResult {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "authorization header required" }, { status: 401 });
  }

  const token = authHeader.slice(7);
  const claims = verifyToken(token);
  if (!claims) {
    return NextResponse.json({ error: "invalid or expired token" }, { status: 401 });
  }

  return {
    claims,
    userId: claims.user_id,
    email: claims.email,
    role: claims.role,
    emailVerified: claims.email_verified,
  };
}

export function isAuthContext(result: AuthResult): result is AuthContext {
  return "userId" in result;
}

export function checkVerifiedEmail(
  auth: AuthContext,
  request: NextRequest
): NextResponse | null {
  if (auth.emailVerified) return null;
  const path = getPathKey(request);
  if (unverifiedAllowedPaths.has(path)) return null;
  return NextResponse.json(
    { error: "email not verified", verification_link: "/verify-email" },
    { status: 403 }
  );
}

export function checkAdmin(auth: AuthContext): NextResponse | null {
  if (auth.role === "super_admin") return null;
  return NextResponse.json({ error: "admin access required" }, { status: 403 });
}

export function checkPMIOrAdmin(auth: AuthContext): NextResponse | null {
  if (auth.role === "super_admin" || auth.role === "pmi_admin") return null;
  return NextResponse.json({ error: "PMI or admin access required" }, { status: 403 });
}

export function getAuthOrError(request: NextRequest): AuthContext | NextResponse {
  const auth = requireAuth(request);
  if (!isAuthContext(auth)) return auth;
  return auth;
}
