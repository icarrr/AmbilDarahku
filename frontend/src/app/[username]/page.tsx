import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { notFound } from "next/navigation";

type PublicProfile = {
  full_name: string;
  blood_type: string;
  rhesus: string;
  city: string;
  total_donations: number;
  badges: { id: string; badge: { name: string; description: string } }[];
};

async function getProfile(username: string): Promise<PublicProfile | null> {
  try {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
    const res = await fetch(`${API_BASE}/u/${username}`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function PublicPortfolioPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const profile = await getProfile(username);

  if (!profile) {
    notFound();
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <Card>
        <CardContent className="py-8 text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center text-3xl font-bold text-red-700 mx-auto">
            {profile.full_name.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{profile.full_name}</h1>
            <div className="flex justify-center gap-2 mt-2">
              <Badge variant="outline">{profile.blood_type}{profile.rhesus}</Badge>
              <Badge variant="secondary">{profile.city}</Badge>
            </div>
            <p className="text-lg font-semibold mt-4">{profile.total_donations}x Donor Darah</p>
          </div>
          {profile.badges.length > 0 && (
            <div className="flex justify-center gap-2 flex-wrap">
              {profile.badges.map(b => (
                <Badge key={b.id} variant="outline">{b.badge.name}</Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
