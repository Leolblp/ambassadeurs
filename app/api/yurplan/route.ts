import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { annulerBillet, cleWebhook, codesMembres, enregistrerVente, trouverCode } from "@/lib/ventes";

export const runtime = "nodejs";

type Commande = {
  identifier?: string | number;
  event?: { name?: string; identifier?: string | number };
  total?: { amount?: number };
  payment_date?: string | null;
  tickets?: { identifier?: string | number; token?: string }[];
};

/** Webhook Yurplan : chaque commande avec un code membre crédite les points en direct. */
export async function POST(request: NextRequest) {
  if (request.nextUrl.searchParams.get("k") !== cleWebhook()) return NextResponse.json({ erreur: "non autorisé" }, { status: 401 });
  const corps = (await request.json().catch(() => null)) as { trigger?: string; data?: unknown } | null;
  if (!corps) return NextResponse.json({ erreur: "JSON invalide" }, { status: 400 });
  const admin = createAdminClient();
  const { data: journal } = await admin.from("yurplan_webhooks").insert({ trigger: corps.trigger ?? null, payload: corps }).select("id").single();
  const noter = (r: string) => journal && admin.from("yurplan_webhooks").update({ resultat: r }).eq("id", journal.id);

  try {
    if (corps.trigger === "ORDER_VALIDATED" || corps.trigger === "ORDER_CREATED") {
      const c = (corps.data ?? {}) as Commande;
      if (corps.trigger === "ORDER_CREATED" && !c.payment_date) { await noter("commande non payée, ignorée"); return NextResponse.json({ ok: true }); }
      const codes = await codesMembres();
      const code = trouverCode(c, codes);
      if (!code) { await noter("aucun code membre"); return NextResponse.json({ ok: true }); }
      const billets = c.tickets?.length ?? 1;
      const r = await enregistrerVente({
        source: "yurplan", commande: String(c.identifier), code, membre: codes.get(code)!, billets,
        montant: c.total?.amount ?? null, date: c.payment_date ?? null, evenement: c.event?.name ?? null,
        items: (c.tickets ?? []).map((t) => String(t.identifier ?? t.token)).filter(Boolean),
      });
      await noter(`${code} · ${billets} billet(s) · ${r}`);
    } else if (corps.trigger === "ORDER_ITEM_CANCELED") {
      const d = (corps.data ?? {}) as { identifier?: string | number };
      const ok = await annulerBillet(String(d.identifier));
      await noter(ok ? "billet annulé, points retirés" : "billet inconnu (pas de code membre)");
    } else {
      await noter("ignoré");
    }
  } catch (e) {
    await noter(`erreur : ${e instanceof Error ? e.message : "inconnue"}`);
  }
  return NextResponse.json({ ok: true });
}
