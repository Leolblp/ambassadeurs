import { after, NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ROBOT = /bot|crawl|spider|preview|facebookexternalhit|whatsapp|slack|discord|telegram|curl|wget/i;

/**
 * Lien fixe pour les pubs et la bio : lacom.club/billet
 * Redirige vers la billetterie Shotgun de la prochaine soirée La Commerciale, en gardant les paramètres (utm_source, utm_campaign…)
 * pour que l'attribution des billets reste juste dans le dashboard.
 */
export async function GET(req: NextRequest) {
  let cible = "https://lacom.club/";
  try {
    const r = await fetch("https://staff.lacom.club/api/prochaine", { next: { revalidate: 300 }, signal: AbortSignal.timeout(5000) });
    const j = (await r.json()) as { url?: string | null };
    if (j.url) cible = j.url;
  } catch { /* repli sur l'accueil */ }
  // Comptage du clic (sans cookie ni donnée personnelle) pour l'onglet Site du dashboard staff
  const q = req.nextUrl.searchParams;
  if (!ROBOT.test(req.headers.get("user-agent") ?? "") && req.method === "GET") {
    after(async () => {
      try {
        await createAdminClient().from("dash_clics").insert({
          source: (q.get("utm_source") ?? "direct").slice(0, 40), medium: q.get("utm_medium")?.slice(0, 40) ?? null, campagne: q.get("utm_campaign")?.slice(0, 60) ?? null,
        });
      } catch { /* le comptage ne bloque jamais la redirection */ }
    });
  }
  const u = new URL(cible);
  req.nextUrl.searchParams.forEach((v, k) => u.searchParams.set(k, v));
  return NextResponse.redirect(u, 307);
}
