import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { envoyerCodeSms } from "@/lib/otp";

export const runtime = "nodejs";

/**
 * Webhook WhatsApp (Meta) : statut de livraison de chaque message envoyé (sent, delivered, read, failed),
 * avec la raison en cas d'échec. Met à jour la ligne correspondante de whatsapp_log via l'identifiant du message.
 */
const ORDRE: Record<string, number> = { sent: 1, delivered: 2, read: 3, failed: 4 };

/** Vérification de l'abonnement, faite une fois par Meta à l'enregistrement de l'URL. */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams;
  const attendu = process.env.WHATSAPP_VERIFY_TOKEN;
  if (attendu && q.get("hub.mode") === "subscribe" && q.get("hub.verify_token") === attendu) {
    return new NextResponse(q.get("hub.challenge") ?? "", { status: 200 });
  }
  return NextResponse.json({ erreur: "non autorisé" }, { status: 403 });
}

type Statut = { id?: string; status?: string; timestamp?: string; errors?: { code?: number; title?: string; message?: string; error_data?: { details?: string } }[] };

export async function POST(request: NextRequest) {
  const brut = await request.text();
  // Signature Meta (clé secrète de l'app) : obligatoire dès que WHATSAPP_APP_SECRET est configurée
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (secret) {
    const recu = request.headers.get("x-hub-signature-256") ?? "";
    const calcule = "sha256=" + createHmac("sha256", secret).update(brut).digest("hex");
    if (recu.length !== calcule.length || !timingSafeEqual(Buffer.from(recu), Buffer.from(calcule))) {
      console.warn("[webhook-wa] signature refusée (vérifier WHATSAPP_APP_SECRET : clé de la même app que le webhook)", recu ? "signature présente" : "sans signature");
      return NextResponse.json({ erreur: "signature invalide" }, { status: 401 });
    }
  }
  let corps: { entry?: { changes?: { value?: { statuses?: Statut[] } }[] }[] };
  try { corps = JSON.parse(brut); } catch { return NextResponse.json({ ok: true }); }

  const admin = createAdminClient();
  for (const e of corps.entry ?? []) for (const c of e.changes ?? []) for (const s of c.value?.statuses ?? []) {
    if (!s.id || !s.status || !(s.status in ORDRE)) continue;
    console.log("[webhook-wa] statut", s.status, s.errors?.[0] ? JSON.stringify(s.errors[0]).slice(0, 300) : "");
    const { data: ligne } = await admin.from("whatsapp_log").select("id, statut, template, member_id, created_at").eq("wamid", s.id).maybeSingle();
    // Messages qu'on n'a pas envoyés : ignorés. Un statut ne recule jamais (read puis delivered arrivé en retard).
    if (!ligne || (ORDRE[ligne.statut ?? ""] ?? 0) >= ORDRE[s.status] && s.status !== "failed") continue;
    const err = s.errors?.[0];
    const raison = err ? [err.code, err.title, err.error_data?.details ?? err.message].filter(Boolean).join(" · ").slice(0, 400) : null;
    await admin.from("whatsapp_log").update({
      statut: s.status,
      statut_at: s.timestamp ? new Date(Number(s.timestamp) * 1000).toISOString() : new Date().toISOString(),
      ...(raison ? { statut_erreur: raison } : {}),
    }).eq("id", ligne.id);
    // Code de connexion non distribuable sur WhatsApp (numéro sans WhatsApp, app trop ancienne…) : secours par SMS,
    // seulement si l'envoi date de moins de 10 min (la personne attend encore son code)
    if (s.status === "failed" && ligne.template === "xoxo_code" && ligne.member_id && Date.now() - new Date(ligne.created_at).getTime() < 10 * 60 * 1000) {
      await envoyerCodeSms(ligne.member_id).catch(() => false);
    }
  }
  return NextResponse.json({ ok: true });
}
