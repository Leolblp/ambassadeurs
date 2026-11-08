import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { telInternational } from "@/lib/whatsapp";

/**
 * SMS de secours via SMSFactor (codes de connexion uniquement), utilisé quand WhatsApp ne peut pas
 * distribuer le message (numéro sans WhatsApp, application trop ancienne…). Journalisé dans whatsapp_log
 * avec le modèle « sms_code » pour apparaître dans l'admin.
 */
export async function envoyerSms(memberId: string, phone: string | null, texte: string) {
  const token = process.env.SMSFACTOR_TOKEN;
  const tel = telInternational(phone);
  if (!token || !tel) return false;
  let ok = false;
  let erreur: string | null = null;
  try {
    const r = await fetch("https://api.smsfactor.com/send", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        sms: {
          message: { text: texte, pushtype: "alert", sender: (process.env.SMSFACTOR_SENDER || "XOXO CLUB").slice(0, 11) },
          recipients: { gsm: [{ value: tel }] },
        },
      }),
    });
    const j = (await r.json().catch(() => null)) as { status?: number; message?: string; details?: string } | null;
    ok = r.ok && j?.status === 1;
    if (!ok) erreur = `${j?.status ?? r.status} · ${j?.message ?? ""} ${j?.details ?? ""}`.trim().slice(0, 300);
  } catch (e) {
    erreur = e instanceof Error ? e.message : "erreur réseau";
  }
  try {
    await createAdminClient().from("whatsapp_log").insert({ member_id: memberId, template: "sms_code", ok, error: erreur, statut: ok ? "sent" : "failed" });
  } catch {}
  return ok;
}
