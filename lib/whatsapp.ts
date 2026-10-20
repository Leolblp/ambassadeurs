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

/** Définition des modèles soumis à Meta (catégorie Utilitaire, français). */
export const MODELES_META: { name: Modele; texte: string; exemple: string[] }[] = [
  { name: "xoxo_acces_accepte", texte: "Bonjour {{1}}, ta demande d'accès au XOXO Club est acceptée. Active ton accès depuis l'email reçu de xoxo@lacom.club. Bienvenue au club.", exemple: ["Léa"] },
  { name: "xoxo_preuve_validee", texte: "Bonjour {{1}}, ta preuve pour la mission « {{2}} » est validée : {{3}} points crédités. Retrouve ton solde dans ton espace membre.", exemple: ["Léa", "Partage le lien de la soirée en story", "150"] },
  { name: "xoxo_preuve_refusee", texte: "Bonjour {{1}}, ta preuve pour la mission « {{2}} » est à refaire. Motif : {{3}}. Tu peux en renvoyer une tant que la mission est ouverte.", exemple: ["Léa", "Partage le lien de la soirée en story", "story publiée en amis proches"] },
  { name: "xoxo_nouvelle_mission", texte: "Bonjour {{1}}, une nouvelle mission est disponible : « {{2}} », {{3}} points à gagner avant le {{4}}. Retrouve-la dans ton espace membre.", exemple: ["Léa", "Crée ta story avant la soirée", "150", "samedi 25 octobre"] },
  { name: "xoxo_rappel_mission", texte: "Bonjour {{1}}, il te reste jusqu'au {{2}} pour réaliser la mission « {{3}} ». Retrouve-la dans ton espace membre.", exemple: ["Léa", "samedi 25 octobre", "Crée ta story avant la soirée"] },
  { name: "xoxo_preuves_team", texte: "Bonjour {{1}}, {{2}} preuves de ta team attendent ta validation. Retrouve-les dans l'onglet Ma team.", exemple: ["Léa", "3"] },
];

const GRAPH = "https://graph.facebook.com/v23.0";

export type StatutModele = { name: string; status: string; category: string; rejected_reason?: string };

export async function statutsModeles(): Promise<{ ok: true; liste: StatutModele[] } | { ok: false; erreur: string }> {
  const token = process.env.WHATSAPP_TOKEN, waba = process.env.WHATSAPP_WABA_ID;
  if (!token || !waba) return { ok: false, erreur: "WHATSAPP_TOKEN ou WHATSAPP_WABA_ID absent sur Vercel (pense au Redeploy)." };
  const r = await fetch(`${GRAPH}/${waba}/message_templates?fields=name,status,category,rejected_reason&limit=200`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
  const j = await r.json();
  if (!r.ok) return { ok: false, erreur: j?.error?.message ?? "Erreur Meta" };
  return { ok: true, liste: (j.data ?? []).filter((t: StatutModele) => t.name.startsWith("xoxo_")) };
}

export async function soumettreModele(m: (typeof MODELES_META)[number]) {
  const r = await fetch(`${GRAPH}/${process.env.WHATSAPP_WABA_ID}/message_templates`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      name: m.name,
      language: "fr",
      category: "UTILITY",
      components: [
        { type: "BODY", text: m.texte, example: { body_text: [m.exemple] } },
        { type: "BUTTONS", buttons: [{ type: "URL", text: "Ouvrir mon espace", url: "https://lacom.club/ambassadeurs" }] },
      ],
    }),
  });
  const j = await r.json();
  return r.ok ? null : (j?.error?.error_user_msg || j?.error?.message || "Erreur Meta");
}
