import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";
import { requireAuth, isAuthContext, checkVerifiedEmail } from "@/lib/auth-middleware";

export const runtime = "nodejs";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAuth(request);
  if (!isAuthContext(auth)) return auth;

  const ve = checkVerifiedEmail(auth, request);
  if (ve) return ve;

  const { id } = await params;

  try {
    const { data: reqData } = await supabase.from("blood_requests").select("*").eq("id", id).eq("status", "open").maybeSingle();
    if (!reqData) {
      return NextResponse.json({ error: "request not found or already fulfilled" }, { status: 404 });
    }

    const body = await request.json();
    const bags = body.bags || 1;

    if (reqData.fulfilled_bags + bags > reqData.bags) {
      return NextResponse.json({ error: "not enough bags remaining" }, { status: 400 });
    }

    const { data: user } = await supabase.from("users").select("*").eq("id", auth.userId).maybeSingle();
    if (!user) return NextResponse.json({ error: "donor not found" }, { status: 404 });

    const { data: existingDonation } = await supabase
      .from("donor_histories")
      .select("id")
      .eq("user_id", auth.userId)
      .eq("donation_date", new Date().toISOString().split("T")[0])
      .maybeSingle();

    if (existingDonation) {
      return NextResponse.json({ error: "donation record already exists for today" }, { status: 409 });
    }

    const { data: history } = await supabase
      .from("donor_histories")
      .insert({
        user_id: auth.userId,
        donation_date: new Date().toISOString().split("T")[0],
        location: reqData.city,
        institution: reqData.hospital,
        bags,
        verification_status: "pending",
      })
      .select("*");

    const { error: ue1 } = await supabase
      .from("blood_requests")
      .update({ fulfilled_bags: reqData.fulfilled_bags + bags, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (ue1) throw ue1;

    if (reqData.fulfilled_bags + bags >= reqData.bags) {
      const { error: ue2 } = await supabase.from("blood_requests").update({ status: "fulfilled", updated_at: new Date().toISOString() }).eq("id", id);
      if (ue2) throw ue2;
    }

    const { error: ie } = await supabase.from("request_fulfillments").insert({ request_id: id, donor_id: auth.userId, bags });
    if (ie) throw ie;

    const { data: agg } = await supabase.from("donor_histories").select("bags").eq("user_id", auth.userId);
    const totalBags = (agg || []).reduce((s: number, r: any) => s + (r.bags || 0), 0);
    const { error: ue3 } = await supabase.from("users").update({
      total_donations: totalBags,
      total_points: totalBags * 10,
      donation_volume_total: totalBags * 0.45,
      last_donation_date: new Date().toISOString().split("T")[0],
      eligibility_status: "waiting_period",
      updated_at: new Date().toISOString(),
    }).eq("id", auth.userId);
    if (ue3) throw ue3;

    const { data: badges } = await supabase.from("badges").select("*").order("min_donations");
    const { data: donor } = await supabase.from("users").select("total_donations").eq("id", auth.userId).maybeSingle();
    if (badges && donor) {
      for (const b of badges) {
        if (donor.total_donations >= b.min_donations) {
          const { data: existing } = await supabase.from("user_badges").select("id").eq("user_id", auth.userId).eq("badge_id", b.id).maybeSingle();
          if (!existing) {
            await supabase.from("user_badges").insert({ user_id: auth.userId, badge_id: b.id });
          }
        }
      }
    }

    return NextResponse.json({ success: true, history: history![0] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "fulfill failed" }, { status: 500 });
  }
}
