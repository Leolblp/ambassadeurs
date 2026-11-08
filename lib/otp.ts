import "server-only";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { envoyerWhatsApp, telInternational } from "@/lib/whatsapp";

export type Compte = { id: string; email: string | null; phone: string | null; status: string; kind: string };

/** Compte lié à un numéro (colonne normalisée et unique phone_e164). Les comptes suspendus sont exclus. */
export async function compteParTel(tel: string): Promise<Compte | null> {
  const cible = telInternational(tel);
  if (!cible) return null;
  const { data } = await createAdminClient().from("profiles").select("id, email, phone, status, kind").eq("phone_e164", cible).neq("status", "suspended").maybeSingle();
  return (data as Compte | null) ?? null;
}

async function ipClient() {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "inconnue").trim().slice(0, 64);
}

/**
 * Limite les envois de codes (messages WhatsApp facturés) : 6 par heure par IP, 3 par heure par numéro,
 * 400 par jour au total. Renvoie false si la limite est atteinte (et n'enregistre rien).
 */
export async function envoiAutorise(tel: string) {
  const admin = createAdminClient();
  const ip = await ipClient();
  const phone = telInternational(tel) ?? tel.slice(0, 20);
  const h1 = new Date(Date.now() - 3600 * 1000).toISOString();
  const j1 = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const [{ count: parIp }, { count: parTel }, { count: total }] = await Promise.all([
    admin.from("otp_requests").select("id", { count: "exact", head: true }).eq("ip", ip).gte("created_at", h1),
    admin.from("otp_requests").select("id", { count: "exact", head: true }).eq("phone", phone).gte("created_at", h1),
    admin.from("otp_requests").select("id", { count: "exact", head: true }).gte("created_at", j1),
  ]);
  if ((parIp ?? 0) >= 6 || (parTel ?? 0) >= 3 || (total ?? 0) >= 400) return false;
  await admin.from("otp_requests").insert({ ip, phone });
  return true;
}

/** Envoie le code de connexion sur WhatsApp (au plus un toutes les 45 s par compte). */
export async function envoyerCode(c: Compte) {
  if (!c.email) return false;
  const admin = createAdminClient();
  const { data: recent } = await admin.from("whatsapp_log").select("id").eq("member_id", c.id).eq("template", "xoxo_code")
    .gte("created_at", new Date(Date.now() - 45 * 1000).toISOString()).limit(1);
  if (recent?.length) return true;
  const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email: c.email });
  const code = data?.properties?.email_otp;
  if (error || !code) return false;
  return envoyerWhatsApp({ id: c.id, phone: c.phone, whatsapp_optin: true }, "xoxo_code", [code], { bouton: code });
}

/**
 * Enregistre l'essai AVANT de vérifier (aucun contournement par requêtes simultanées).
 * Au-delà de 5 essais en 15 min, le code est remplacé et la vérification refusée.
 */
export async function essaiAutorise(memberId: string, email: string) {
  const admin = createAdminClient();
  await admin.from("login_attempts").insert({ member_id: memberId });
  const depuis = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const { count } = await admin.from("login_attempts").select("id", { count: "exact", head: true }).eq("member_id", memberId).gte("created_at", depuis);
  if ((count ?? 0) > 5) {
    await admin.auth.admin.generateLink({ type: "magiclink", email });
    return false;
  }
  return true;
}

export async function essaisEffaces(memberId: string) {
  await createAdminClient().from("login_attempts").delete().eq("member_id", memberId);
}
