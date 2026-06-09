import jwt from "jsonwebtoken";
import crypto from "crypto";

const getSecret = () => process.env.JWT_SECRET || "dev-secret";
const getAccessExpiry = () => {
  const v = process.env.JWT_ACCESS_EXPIRY;
  if (v) {
    const match = v.match(/^(\d+)([smhd])$/);
    if (match) {
      const n = parseInt(match[1]);
      switch (match[2]) {
        case "s": return n * 1000;
        case "m": return n * 60 * 1000;
        case "h": return n * 3600 * 1000;
        case "d": return n * 86400 * 1000;
      }
    }
  }
  return 15 * 60 * 1000;
};
const getRefreshExpiry = () => {
  const v = process.env.JWT_REFRESH_EXPIRY;
  if (v) {
    const match = v.match(/^(\d+)([smhd])$/);
    if (match) {
      const n = parseInt(match[1]);
      switch (match[2]) {
        case "s": return n * 1000;
        case "m": return n * 60 * 1000;
        case "h": return n * 3600 * 1000;
        case "d": return n * 86400 * 1000;
      }
    }
  }
  return 7 * 24 * 3600 * 1000;
};

export interface JWTClaims {
  user_id: string;
  email: string;
  role: string;
  email_verified: boolean;
  iat?: number;
  exp?: number;
}

export function generateAccessToken(
  userId: string,
  email: string,
  role: string,
  emailVerified: boolean
): string {
  return jwt.sign(
    { user_id: userId, email, role, email_verified: emailVerified },
    getSecret(),
    { expiresIn: getAccessExpiry() }
  );
}

export function verifyToken(token: string): JWTClaims | null {
  try {
    const decoded = jwt.verify(token, getSecret()) as JWTClaims;
    return decoded;
  } catch {
    return null;
  }
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(32).toString("hex");
}
