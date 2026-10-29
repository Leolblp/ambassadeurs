import { NextResponse, type NextRequest } from "next/server";

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
  const u = new URL(cible);
  req.nextUrl.searchParams.forEach((v, k) => u.searchParams.set(k, v));
  return NextResponse.redirect(u, 307);
}
