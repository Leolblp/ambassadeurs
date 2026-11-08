import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/** Modèles validés dans WhatsApp Manager (langue : fr). */
export type Modele =
  | "xoxo_acces_accepte"
  | "xoxo_preuve_validee"
  | "xoxo_preuve_refusee"
  | "xoxo_mission_ajoutee"
  | "xoxo_rappel_mission"
  | "xoxo_preuves_team"
  | "xoxo_code";

/** 06 12 34 56 78 / +33 6… / 0033 6… -> 33612345678 (format attendu par l'API). */
export function telInternational(tel: string | null | undefined): string | null {
  if (!tel) return null;
  let t = tel.replace(/[^\d+]/g, "");
  if (t.startsWith("00")) t = "+" + t.slice(2);
  // Mobile français saisi sans le 0 (« 6 78 05 36 65 » ou « +6 78… ») : on ajoute l'indicatif
  if (/^\+?[67]\d{8}$/.test(t)) t = "+33" + t.replace("+", "");
  // « +33 06… » : le 0 national saisi après l'indicatif est retiré
  if (/^\+330[1-9]\d{8}$/.test(t)) t = "+33" + t.slice(4);
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
export async function envoyerWhatsApp(dest: Destinataire, modele: Modele, variables: (string | number)[], options: { bouton?: string } = {}) {
  const token = process.env.WHATSAPP_TOKEN;
  const idNumero = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const tel = telInternational(dest.phone);
  if (!token || !idNumero || !dest.whatsapp_optin || !tel) return false;

  let ok = false;
  let erreur: string | null = null;
  let wamid: string | null = null;
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
          components: [
            { type: "body", parameters: variables.map((v) => ({ type: "text", text: String(v).slice(0, 500) || "-" })) },
            ...(options.bouton ? [{ type: "button", sub_type: "url", index: "0", parameters: [{ type: "text", text: options.bouton }] }] : []),
          ],
        },
      }),
    });
    ok = r.ok;
    if (!r.ok) erreur = (await r.text()).slice(0, 500);
    else wamid = ((await r.json().catch(() => null)) as { messages?: { id?: string }[] } | null)?.messages?.[0]?.id ?? null;
  } catch (e) {
    erreur = e instanceof Error ? e.message : "erreur réseau";
  }
  try {
    await createAdminClient().from("whatsapp_log").insert({ member_id: dest.id, template: modele, ok, error: erreur, wamid, statut: ok ? "sent" : "failed" });
  } catch {}
  return ok;
}

/** Définition des modèles soumis à Meta (catégorie Utilitaire, français). */
export const MODELES_META: { name: Modele; texte: string; exemple: string[] }[] = [
  { name: "xoxo_acces_accepte", texte: "Bonjour {{1}}, ta demande d'accès au XOXO Club est acceptée. Touche le bouton ci-dessous pour activer ton accès. Bienvenue au club.", exemple: ["Léa"] },
  { name: "xoxo_preuve_validee", texte: "Bonjour {{1}}, ta preuve pour la mission « {{2}} » est validée : {{3}} points crédités. Retrouve ton solde dans ton espace membre.", exemple: ["Léa", "Partage le lien de la soirée en story", "150"] },
  { name: "xoxo_preuve_refusee", texte: "Bonjour {{1}}, ta preuve pour la mission « {{2}} » est à refaire. Motif : {{3}}. Tu peux en renvoyer une tant que la mission est ouverte.", exemple: ["Léa", "Partage le lien de la soirée en story", "story publiée en amis proches"] },
  { name: "xoxo_mission_ajoutee", texte: "Bonjour {{1}}, une mission a été ajoutée à ton espace membre XOXO Club : « {{2}} », à réaliser avant le {{3}}. Retrouve-la dans ton espace membre.", exemple: ["Léa", "Crée ta story avant la soirée", "samedi 25 octobre"] },
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

/** Ce que Meta voit réellement avec ce token (pour le diagnostic du back-office). */
export async function diagnostic() {
  const token = process.env.WHATSAPP_TOKEN;
  if (!token) return { erreur: "WHATSAPP_TOKEN absent" };
  const lire = async (url: string) => {
    try {
      const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
      return await r.json();
    } catch (e) {
      return { error: { message: e instanceof Error ? e.message : "réseau" } };
    }
  };
  const debug = await lire(`${GRAPH}/debug_token?input_token=${encodeURIComponent(token)}`);
  const portees = (debug?.data?.granular_scopes ?? []) as { scope: string; target_ids?: string[] }[];
  const numero = await lire(`${GRAPH}/${process.env.WHATSAPP_PHONE_NUMBER_ID}?fields=id,display_phone_number,verified_name`);
  const comptes: { id: string; nom?: string; numeros?: string }[] = [];
  for (const id of new Set(portees.flatMap((p) => p.target_ids ?? []))) {
    const w = await lire(`${GRAPH}/${id}?fields=id,name,phone_numbers{id,display_phone_number}`);
    if (w?.id) comptes.push({ id: w.id, nom: w.name, numeros: (w.phone_numbers?.data ?? []).map((n: { id: string; display_phone_number: string }) => `${n.display_phone_number} (${n.id})`).join(", ") });
  }
  const waba = await lire(`${GRAPH}/${process.env.WHATSAPP_WABA_ID}?fields=id,name`);
  const wabaNumeros = await lire(`${GRAPH}/${process.env.WHATSAPP_WABA_ID}/phone_numbers?fields=id,display_phone_number`);
  const moi = await lire(`${GRAPH}/me?fields=id,name`);
  const proprio = await lire(`${GRAPH}/557650655108251/owned_whatsapp_business_accounts?fields=id,name`);
  const clients = await lire(`${GRAPH}/557650655108251/client_whatsapp_business_accounts?fields=id,name`);
  const entreprises = await lire(`${GRAPH}/me/businesses?fields=id,name,owned_whatsapp_business_accounts{id,name},client_whatsapp_business_accounts{id,name}`);
  const court = (j: { error?: { message?: string; code?: number }; data?: unknown }) => (j?.error ? `Erreur ${j.error.code} : ${j.error.message}` : j?.data ?? j);
  return {
    waba: court(waba),
    wabaNumeros: court(wabaNumeros),
    moi: court(moi),
    wabaPossedes: court(proprio),
    wabaClients: court(clients),
    entreprises: court(entreprises),
    tokenFinPar: token.slice(-6),
    wabaConfigure: process.env.WHATSAPP_WABA_ID,
    portees: portees.map((p) => `${p.scope} : ${(p.target_ids ?? ["tous"]).join(", ")}`),
    numero: numero?.error ? `Erreur : ${numero.error.message}` : `${numero.display_phone_number} · ${numero.verified_name}`,
    comptes,
    erreurDebug: debug?.error?.message,
  };
}

/**
 * Abonne l'app au compte WhatsApp Business (nécessaire pour que Meta envoie les statuts de livraison au webhook),
 * puis renvoie la liste des apps abonnées et l'état du numéro (qualité, statut, limite d'envoi).
 */
export async function brancherStatuts() {
  const token = process.env.WHATSAPP_TOKEN, waba = process.env.WHATSAPP_WABA_ID, num = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !waba) return { ok: false, texte: "WHATSAPP_TOKEN ou WHATSAPP_WABA_ID absent sur Vercel." };
  const h = { Authorization: `Bearer ${token}` };
  const abo = await fetch(`${GRAPH}/${waba}/subscribed_apps`, { method: "POST", headers: h }).then((r) => r.json()).catch((e) => ({ error: String(e) }));
  const liste = await fetch(`${GRAPH}/${waba}/subscribed_apps`, { headers: h }).then((r) => r.json()).catch(() => null);
  const numero = num ? await fetch(`${GRAPH}/${num}?fields=display_phone_number,verified_name,status,quality_rating,messaging_limit_tier,code_verification_status,name_status`, { headers: h }).then((r) => r.json()).catch(() => null) : null;
  const apps = ((liste?.data ?? []) as { whatsapp_business_api_data?: { name?: string; id?: string } }[]).map((a) => `${a.whatsapp_business_api_data?.name ?? "?"} (${a.whatsapp_business_api_data?.id ?? "?"})`);
  const n = numero && !numero.error ? `Numéro ${numero.display_phone_number} · ${numero.verified_name} · statut ${numero.status} · qualité ${numero.quality_rating} · limite ${numero.messaging_limit_tier ?? "?"} · nom ${numero.name_status ?? "?"}` : `Numéro : ${JSON.stringify(numero?.error ?? numero).slice(0, 200)}`;
  const a = abo?.success ? "Abonnement OK" : `Abonnement : ${JSON.stringify(abo?.error ?? abo).slice(0, 250)}`;
  return { ok: !!abo?.success, texte: `${a}. Apps abonnées : ${apps.join(", ") || "aucune"}. ${n}` };
}
