import "server-only";
import crypto from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

/** Clé secrète de l'URL du webhook Yurplan (dérivée d'un secret déjà présent sur Vercel). */
export function cleWebhook() {
  const brut = process.env.WALLET_BUNDLE;
  const base = brut ? (JSON.parse(Buffer.from(brut, "base64").toString("utf8")).push as string) : process.env.SUPABASE_SECRET_KEY ?? "";
  return crypto.createHash("sha256").update(`yurplan:${base}`).digest("hex").slice(0, 32);
}

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toUpperCase();

/** Codes membres actifs : CODE -> id du membre */
export async function codesMembres() {
  const { data } = await createAdminClient().from("profiles").select("id, promo_code").not("promo_code", "is", null);
  return new Map((data ?? []).map((p) => [norm(p.promo_code as string), p.id as string]));
}

/** Cherche un code membre n'importe où dans un objet (commande, ligne d'export…). */
export function trouverCode(valeur: unknown, codes: Map<string, string>): string | null {
  if (typeof valeur === "string") {
    const v = norm(valeur);
    if (codes.has(v)) return v;
    for (const morceau of v.split(/[\s,;:/|()]+/)) if (codes.has(morceau)) return morceau;
    return null;
  }
  if (Array.isArray(valeur)) {
    for (const x of valeur) { const c = trouverCode(x, codes); if (c) return c; }
    return null;
  }
  if (valeur && typeof valeur === "object") {
    for (const x of Object.values(valeur)) { const c = trouverCode(x, codes); if (c) return c; }
  }
  return null;
}

/** Associe un nom d'événement Yurplan à une soirée (déjà associée, ou même nom). */
async function soireeDe(nomYurplan: string | null) {
  if (!nomYurplan) return null;
  const admin = createAdminClient();
  const { data: liee } = await admin.from("events").select("id").eq("yurplan_event", nomYurplan).maybeSingle();
  if (liee) return liee.id as string;
  const { data: toutes } = await admin.from("events").select("id, name, yurplan_event").is("yurplan_event", null);
  const n = norm(nomYurplan);
  const trouvee = (toutes ?? []).find((e) => { const m = norm(e.name); return m && (n.includes(m) || m.includes(n)); });
  if (trouvee) {
    await admin.from("events").update({ yurplan_event: nomYurplan }).eq("id", trouvee.id);
    return trouvee.id as string;
  }
  return null;
}

async function pointsParBillet() {
  const { data } = await createAdminClient().from("app_settings").select("points_per_ticket").eq("id", 1).single();
  return Number(data?.points_per_ticket ?? 0);
}

export type Vente = {
  source: "yurplan" | "manual";
  commande: string;
  code: string;
  membre: string;
  billets: number;
  montant?: number | null;
  date?: string | null;
  evenement?: string | null;
  items?: string[];
};

/**
 * Enregistre (ou met à jour) une commande et crédite les points.
 * Idempotent : réimporter la même commande ne crédite pas deux fois.
 */
export async function enregistrerVente(v: Vente): Promise<"nouvelle" | "maj" | "inchangee"> {
  const admin = createAdminClient();
  const [ppb, eventId, { data: existante }] = await Promise.all([
    pointsParBillet(),
    soireeDe(v.evenement ?? null),
    admin.from("sales").select("id, ticket_count, points_awarded, status, items").eq("source", v.source).eq("external_order_id", v.commande).maybeSingle(),
  ]);
  const pointsDus = v.billets * ppb;

  if (!existante) {
    const { data: vente, error } = await admin.from("sales").insert({
      source: v.source, external_order_id: v.commande, member_id: v.membre, event_id: eventId, promo_code: v.code,
      ticket_count: v.billets, amount: v.montant ?? null, ordered_at: v.date ?? new Date().toISOString(),
      yurplan_event: v.evenement ?? null, items: v.items ?? [], points_awarded: pointsDus,
    }).select("id").single();
    if (error || !vente) throw new Error(error?.message ?? "insertion impossible");
    if (pointsDus > 0) {
      await admin.from("points_ledger").insert({ member_id: v.membre, delta: pointsDus, reason: "sale", sale_id: vente.id, note: `${v.billets} billet${v.billets > 1 ? "s" : ""} vendu${v.billets > 1 ? "s" : ""}${v.evenement ? ` · ${v.evenement}` : ""}` });
      await admin.rpc("award_team_bonus", { p_member: v.membre, p_points: pointsDus, p_proof: null, p_sale: vente.id });
    }
    return "nouvelle";
  }

  if (existante.status !== "valid" || existante.ticket_count === v.billets) {
    if (!existante.status || existante.status === "valid") {
      await admin.from("sales").update({ event_id: eventId, yurplan_event: v.evenement ?? null, items: v.items?.length ? v.items : existante.items }).eq("id", existante.id);
    }
    return "inchangee";
  }
  const ecart = pointsDus - Number(existante.points_awarded ?? 0);
  await admin.from("sales").update({ ticket_count: v.billets, points_awarded: pointsDus, event_id: eventId, items: v.items?.length ? v.items : existante.items }).eq("id", existante.id);
  if (ecart !== 0) await admin.from("points_ledger").insert({ member_id: v.membre, delta: ecart, reason: ecart > 0 ? "sale" : "refund", sale_id: existante.id, note: "Mise à jour d'une commande" });
  return "maj";
}

/** Un billet annulé : on retire les points correspondants. */
export async function annulerBillet(itemId: string) {
  const admin = createAdminClient();
  const { data: vente } = await admin.from("sales").select("id, member_id, ticket_count, points_awarded, items").contains("items", [itemId]).maybeSingle();
  if (!vente) return false;
  const restants = Math.max(0, vente.ticket_count - 1);
  const parBillet = vente.ticket_count ? Math.round(Number(vente.points_awarded) / vente.ticket_count) : 0;
  await admin.from("sales").update({
    ticket_count: restants, points_awarded: Number(vente.points_awarded) - parBillet,
    items: (vente.items as string[]).filter((x) => x !== itemId), status: restants === 0 ? "refunded" : "valid",
  }).eq("id", vente.id);
  if (parBillet > 0 && vente.member_id) await admin.from("points_ledger").insert({ member_id: vente.member_id, delta: -parBillet, reason: "refund", sale_id: vente.id, note: "Billet annulé" });
  return true;
}
