import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { generateAccessToken, generateRefreshToken } from "@/lib/jwt";
import { sendVerificationEmail } from "@/lib/email";
import crypto from "crypto";
import { lookupName } from "@/lib/data/wilayah";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { full_name, phone, email, password, date_of_birth, gender, blood_type, weight_kg, height_cm, province, city, district, username } = body;

    if (!full_name || !phone || !email || !password) {
      return NextResponse.json({ error: "full_name, phone, email, and password are required" }, { status: 400 });
    }

    const { data: existingEmail } = await supabase.from("users").select("id").eq("email", email).maybeSingle();
    const { data: existingPhone } = existingEmail
      ? { data: null }
      : await supabase.from("users").select("id, email").eq("phone", phone).maybeSingle();

    if (existingEmail) {
      return NextResponse.json({
        error: "already_registered",
        message: "Kami mendeteksi Anda sudah terdaftar berdasarkan data PMI. Jika Anda ingin atur kata sandi, kami akan mengirimkan tautan reset password.",
        can_reset: true,
      }, { status: 409 });
    }

    // Phone conflict — if the existing account is a seeded donor (placeholder email), bind the real email
    if (existingPhone) {
      if (existingPhone.email && existingPhone.email.endsWith("@donor.ambildarahku.id")) {
        const passwordHash = await hashPassword(password);
        const { data: updated } = await supabase
          .from("users")
          .update({ email, password_hash: passwordHash, email_verified: false, updated_at: new Date().toISOString() })
          .eq("id", existingPhone.id)
          .select("id, created_at, updated_at")
          .maybeSingle();

        if (updated) {
          const accessToken = generateAccessToken(updated.id, email, "donor", false);
          const refreshToken = generateRefreshToken();
          const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000);
          await supabase.from("refresh_tokens").insert({
            user_id: updated.id,
            token_hash: crypto.createHash("sha256").update(refreshToken).digest("hex"),
            expires_at: expiresAt.toISOString(),
          });

          return NextResponse.json({
            donor_bound: true,
            user: {
              id: updated.id,
              full_name,
              email,
              phone,
              role: "donor",
              blood_type: blood_type || "O",
              city: city || "",
              city_name: lookupName(city || ""),
              province: province || "",
              province_name: lookupName(province || ""),
              district: district || "",
              district_name: lookupName(district || ""),
              username: username || null,
              total_donations: 0,
              total_points: 0,
              email_verified: false,
              created_at: updated.created_at,
            },
            access_token: accessToken,
            refresh_token: refreshToken,
          }, { status: 200 });
        }
      }

      return NextResponse.json({
        error: "already_registered",
        message: "Kami mendeteksi Anda sudah terdaftar berdasarkan data PMI. Jika Anda ingin atur kata sandi, kami akan mengirimkan tautan reset password.",
        can_reset: true,
      }, { status: 409 });
    }

    let dob: string;
    if (!isNaN(Date.parse(date_of_birth))) {
      dob = new Date(date_of_birth).toISOString().split("T")[0];
    } else {
      return NextResponse.json({ error: "invalid date_of_birth format, expected YYYY-MM-DD or RFC3339" }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);

    const { data: result, error: insertError } = await supabase.from("users").insert({
      full_name,
      phone,
      email,
      password_hash: passwordHash,
      role: "donor",
      date_of_birth: dob,
      gender: gender || "male",
      blood_type: blood_type || "O",
      rhesus: "+",
      weight_kg: weight_kg || 0,
      height_cm: height_cm || 0,
      province: province || "",
      city: city || "",
      district: district || "",
      username: username || null,
    }).select("id, created_at, updated_at");

    if (insertError || !result || result.length === 0) {
      return NextResponse.json({ error: insertError?.message || "failed to create user" }, { status: 500 });
    }

    const user = result[0];

    const accessToken = generateAccessToken(user.id, email, "donor", false);
    const refreshToken = generateRefreshToken();

    const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000);
    const { error: rtError } = await supabase.from("refresh_tokens").insert({
      user_id: user.id,
      token_hash: crypto.createHash("sha256").update(refreshToken).digest("hex"),
      expires_at: expiresAt.toISOString(),
    });
    if (rtError) throw rtError;

    const verifToken = crypto.randomBytes(32).toString("hex");
    const { error: vtError } = await supabase.from("verification_tokens").insert({
      user_id: user.id,
      token: verifToken,
      type: "email_verification",
      expires_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    });
    if (vtError) throw vtError;

    sendVerificationEmail(email, verifToken).catch(() => {});

    return NextResponse.json({
      user: {
        id: user.id,
        full_name,
        email,
        phone,
        role: "donor",
        blood_type,
        city,
        city_name: lookupName(city || ""),
        province,
        province_name: lookupName(province || ""),
        district,
        district_name: lookupName(district || ""),
        username,
        total_donations: 0,
        total_points: 0,
        email_verified: false,
        created_at: user.created_at,
      },
      access_token: accessToken,
      refresh_token: refreshToken,
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "failed to create user" }, { status: 500 });
  }
}
