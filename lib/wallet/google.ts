import "server-only";
import crypto from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { donneesCarte } from "./index";

/**
 * Google Wallet (carte de fidélité). Variables Vercel :
 *  GOOGLE_WALLET_ISSUER_ID : ID d'émetteur (Google Pay & Wallet Console)
 *  GOOGLE_WALLET_KEY       : contenu JSON de la clé du compte de service
 */
const API = "https://walletobjects.googleapis.com/walletobjects/v1";
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://lacom.club";

type Cle = { client_email: string; private_key: string };
function cle(): Cle {
  const brut = process.env.GOOGLE_WALLET_KEY;
  if (!brut) throw new Error("GOOGLE_WALLET_KEY absent sur Vercel");
  const txt = brut.trim().startsWith("{") ? brut : Buffer.from(brut, "base64").toString("utf8");
  return JSON.parse(txt) as Cle;
}
const emetteur = () => {
  const id = process.env.GOOGLE_WALLET_ISSUER_ID;
  if (!id) throw new Error("GOOGLE_WALLET_ISSUER_ID absent sur Vercel");
  return id;
};
export const googleConfigure = () => !!process.env.GOOGLE_WALLET_KEY && !!process.env.GOOGLE_WALLET_ISSUER_ID;
const idClasse = () => `${emetteur()}.xoxo_club`;
const idObjet = (serial: string) => `${emetteur()}.${serial}`;

const b64url = (b: Buffer | string) => Buffer.from(b).toString("base64url");
function signer(charge: object) {
  const k = cle();
  const entete = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const corps = b64url(JSON.stringify(charge));
  const sig = crypto.createSign("RSA-SHA256").update(`${entete}.${corps}`).sign(k.private_key);
  return `${entete}.${corps}.${b64url(sig)}`;
}

let jeton: { valeur: string; expire: number } | null = null;
async function acces() {
  if (jeton && jeton.expire > Date.now() + 60_000) return jeton.valeur;
  const k = cle();
  const t = Math.floor(Date.now() / 1000);
  const assertion = signer({ iss: k.client_email, scope: "https://www.googleapis.com/auth/wallet_object.issuer", aud: "https://oauth2.googleapis.com/token", iat: t, exp: t + 3600 });
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`OAuth Google : ${j.error_description || j.error}`);
  jeton = { valeur: j.access_token, expire: Date.now() + j.expires_in * 1000 };
  return jeton.valeur;
}
async function api(methode: string, chemin: string, corps?: object) {
  const r = await fetch(`${API}${chemin}`, {
    method: methode,
    headers: { Authorization: `Bearer ${await acces()}`, "Content-Type": "application/json" },
    body: corps ? JSON.stringify(corps) : undefined,
  });
  return { statut: r.status, json: await r.json().catch(() => ({})) };
}

function classe() {
  return {
    id: idClasse(),
    issuerName: "La Commerciale",
    programName: "XOXO Club",
    programLogo: { sourceUri: { uri: `${SITE}/wallet/google-logo.png` }, contentDescription: { defaultValue: { language: "fr-FR", value: "XOXO Club" } } },
    hexBackgroundColor: "#0c0707",
    reviewStatus: "UNDER_REVIEW",
    countryCode: "FR",
    localizedProgramName: { defaultValue: { language: "fr-FR", value: "XOXO Club" } },
  };
}

/** Crée la classe de carte si elle n'existe pas encore. */
export async function assurerClasse() {
  const r = await api("GET", `/loyaltyClass/${idClasse()}`);
  if (r.statut === 200) return;
  const c = await api("POST", "/loyaltyClass", classe());
  if (c.statut >= 300) throw new Error(`Classe Google : ${c.json?.error?.message}`);
}

async function objet(memberId: string) {
  const d = await donneesCarte(memberId);
  const textes = [
    ...(d.code ? [{ id: "code", header: "Code membre", body: d.code }] : []),
    ...(d.team ? [{ id: "team", header: "Team", body: d.team }] : []),
    { id: "prochain", header: d.prochain ? "Prochain privilège" : "Privilèges", body: d.prochain ? `${d.prochain.name} · encore ${d.prochain.reste} pts` : "Tous accessibles" },
    ...(d.soiree ? [{ id: "soiree", header: " ", body: d.soiree }] : []),
  ];
  return {
    id: idObjet(d.serial),
    classId: idClasse(),
    state: "ACTIVE",
    accountId: d.numero,
    accountName: d.nom,
    loyaltyPoints: { label: "Points", balance: { int: d.points } },
    barcode: { type: "QR_CODE", value: d.qr, alternateText: `N° ${d.numero}` },
    textModulesData: textes,
    linksModuleData: { uris: [{ uri: `${SITE}/ambassadeurs`, description: "Ouvrir mon espace", id: "espace" }] },
    hexBackgroundColor: "#0c0707",
  };
}

/** Lien « Ajouter à Google Wallet » pour le membre. */
export async function lienGoogle(memberId: string) {
  await assurerClasse();
  const o = await objet(memberId);
  // Si la carte existe déjà, on la met à jour (le lien ne fait que l'ajouter au téléphone)
  const maj = await api("PUT", `/loyaltyObject/${o.id}`, o);
  if (maj.statut === 404) await api("POST", "/loyaltyObject", o);
  await createAdminClient().from("wallet_passes").update({ google: true }).eq("member_id", memberId);
  const k = cle();
  const jwt = signer({ iss: k.client_email, aud: "google", typ: "savetowallet", origins: [SITE], payload: { loyaltyObjects: [{ id: o.id, classId: o.classId }] } });
  return `https://pay.google.com/gp/v/save/${jwt}`;
}

/** Met à jour la carte Google du membre (solde, soirée…). */
export async function majGoogle(memberId: string) {
  if (!googleConfigure()) return false;
  const o = await objet(memberId);
  const r = await api("PUT", `/loyaltyObject/${o.id}`, o);
  return r.statut < 300;
}

/** 17h le jour de la soirée : mise à jour + notification sur le téléphone. */
export async function jourJGoogle() {
  if (!googleConfigure()) return 0;
  const { data } = await createAdminClient().from("wallet_passes").select("member_id, serial").eq("google", true);
  let n = 0;
  for (const c of data ?? []) {
    if (!(await majGoogle(c.member_id))) continue;
    const r = await api("POST", `/loyaltyObject/${idObjet(c.serial)}/addMessage`, {
      message: { id: `soir-${Date.now()}`, header: "Ce soir · La Commerciale", body: "Ta carte XOXO Club est prête.", messageType: "TEXT_AND_NOTIFY" },
    });
    if (r.statut < 300) n++;
  }
  return n;
}
