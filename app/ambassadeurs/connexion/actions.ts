"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { envoyerWhatsApp, telInternational } from "@/lib/whatsapp";

export type EtatCode = { etape: "tel" | "code"; tel?: string; erreur?: string } | null;

/** Retrouve le membre actif à partir de son numéro, quel que soit le format saisi. */
async function membreParTel(tel: string) {
  const cible = telInternational(tel);
  if (!cible) return null;
  const { data } = await createAdminClient().from("profiles").select("id, email, first_name, phone").eq("status", "active").not("phone", "is", null);
  return (data ?? []).find((p) => telInternational(p.phone) === cible) ?? null;
}

export async function demanderCode(_: EtatCode, f: FormData): Promise<EtatCode> {
  const tel = String(f.get("tel") ?? "").trim();
  if (!telInternational(tel)) return { etape: "tel", erreur: "Numéro invalide. Exemple : 06 12 34 56 78." };
  const m = await membreParTel(tel);
  // Réponse identique que le numéro soit membre ou non (on ne révèle rien)
  if (!m?.email) return { etape: "code", tel };

  const admin = createAdminClient();
  const { data: recent } = await admin.from("whatsapp_log").select("id").eq("member_id", m.id).eq("template", "xoxo_code")
    .gte("created_at", new Date(Date.now() - 45 * 1000).toISOString()).limit(1);
  if (recent?.length) return { etape: "code", tel };

  const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email: m.email });
  const code = data?.properties?.email_otp;
  if (error || !code) return { etape: "tel", erreur: "Envoi impossible pour le moment. Réessaie dans une minute." };
  await envoyerWhatsApp({ id: m.id, phone: m.phone, whatsapp_optin: true }, "xoxo_code", [code], { bouton: code });
  return { etape: "code", tel };
}

export async function verifierCode(_: EtatCode, f: FormData): Promise<EtatCode> {
  const tel = String(f.get("tel") ?? "");
  const code = String(f.get("code") ?? "").replace(/\D/g, "");
  if (code.length < 6) return { etape: "code", tel, erreur: "Entre le code reçu sur WhatsApp." };
  const m = await membreParTel(tel);
  if (!m?.email) return { etape: "code", tel, erreur: "Code incorrect ou expiré." };
  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email: m.email, token: code, type: "email" });
  if (error) return { etape: "code", tel, erreur: "Code incorrect ou expiré." };
  redirect("/ambassadeurs");
}
