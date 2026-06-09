import { supabase } from "@/lib/db";

export async function archiveExpiredEvents(): Promise<number> {
  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("events")
    .update({
      status: "completed",
      is_archived: true,
      archived_at: new Date().toISOString(),
    })
    .lt("event_date", today)
    .eq("is_archived", false)
    .select("id");

  if (error) {
    console.error("archive failed:", error);
    return 0;
  }

  return data?.length || 0;
}
