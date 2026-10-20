import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { bundle, heureLyon, jourLyon, pousserToutesLesCartes } from "@/lib/wallet";
import { jourJGoogle } from "@/lib/wallet/google";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Appelé par la base (pg_cron, 15h et 16h UTC) : à 17h heure de Lyon, un jour de soirée,
 * toutes les cartes passent en « Ce soir » et s'affichent sur l'iPhone (notification + écran verrouillé).
 */
export async function POST(request: NextRequest) {
  let secret: string;
  try {
    secret = bundle().push;
  } catch {
    return NextResponse.json({ ignore: "wallet non configuré" });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ erreur: "non autorisé" }, { status: 401 });

  const maintenant = new Date();
  if (heureLyon(maintenant) !== 17) return NextResponse.json({ ignore: "pas 17h à Lyon" });
  const { data: soirees } = await createAdminClient().from("events").select("name, starts_at")
    .gte("starts_at", maintenant.toISOString()).lte("starts_at", new Date(maintenant.getTime() + 18 * 3600 * 1000).toISOString());
  const soiree = (soirees ?? []).find((s) => jourLyon(new Date(s.starts_at)) === jourLyon(maintenant));
  if (!soiree) return NextResponse.json({ soiree: null });
  const [apple, google] = await Promise.all([pousserToutesLesCartes().catch(() => 0), jourJGoogle().catch(() => 0)]);
  return NextResponse.json({ soiree: soiree.name, apple, google });
}
