import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/** Modèles validés dans WhatsApp Manager (langue : fr). */
export type Modele =
  | "xoxo_acces_accepte"
  | "xoxo_preuve_validee"
  | "xoxo_preuve_refusee"
  | "xoxo_nouvelle_mission"
  | "xoxo_rappel_mission"
  | "xoxo_preuves_team";

/** 06 12 34 56 78 / +33 6… / 0033 6… -> 33612345678 (format attendu par l'API). */
export function telInternational(tel: string | null | undefined): string | null {
  if (!tel) return null;
  let t = tel.replace(/[^\d+]/g, "");
  if (t.startsWith("00")) t = "+" + t.slice(2);
  if (/^0[1-9]\d{8}$/.test(t)) t = "+33" + t.slice(1);
  if (!t.startsWith("+")) return null;
  const chiffres = t.slice(1);
  return chiffres.length >= 8 && chiffres.length <= 15 ? chiffres : null;
}

/** Date courte pour les messages : « samedi 25 octobre ». */
export function jourMois(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Paris" });
}

type Destinataire = { id: string; phone: string | null; whatsapp_optin: boolean };

/** Envoie un modèle WhatsApp. Ne lève jamais d'erreur : tout est journalisé dans whatsapp_log. */
export async function envoyerWhatsApp(dest: Destinataire, modele: Modele, variables: (string | number)[]) {
  const token = process.env.WHATSAPP_TOKEN;
  const idNumero = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const tel = telInternational(dest.phone);
  if (!token || !idNumero || !dest.whatsapp_optin || !tel) return false;

  let ok = false;
  let erreur: string | null = null;
  try {
    const r = await fetch(`https://graph.facebook.com/v23.0/${idNumero}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: tel,
        type: "template",
        template: {
          name: modele,
          language: { code: "fr" },
          components: [{ type: "body", parameters: variables.map((v) => ({ type: "text", text: String(v).slice(0, 500) || "-" })) }],
        },
      }),
    });
    ok = r.ok;
    if (!r.ok) erreur = (await r.text()).slice(0, 500);
  } catch (e) {
    erreur = e instanceof Error ? e.message : "erreur réseau";
  }
  try {
    await createAdminClient().from("whatsapp_log").insert({ member_id: dest.id, template: modele, ok, error: erreur });
  } catch {}
  return ok;
}
